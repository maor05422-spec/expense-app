-- ============================================================
-- תקציב הבית - סכמת מסד נתונים ראשונית
-- מריצים את הקובץ הזה בשלמותו ב-Supabase Studio > SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- טבלאות ----------

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, household_id)
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  icon text,
  monthly_budget numeric(12, 2) not null default 0,
  type text not null default 'expense' check (type in ('expense', 'income')),
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  amount numeric(12, 2) not null,
  date date not null default current_date,
  description text,
  paid_by uuid references auth.users (id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'recurring')),
  recurring_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  amount numeric(12, 2) not null,
  description text not null,
  day_of_month integer not null check (day_of_month between 1 and 28),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table transactions
  add constraint transactions_recurring_id_fkey
  foreign key (recurring_id) references recurring_expenses (id) on delete set null;

create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) not null default 0,
  target_date date,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists savings_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references savings_goals (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  amount numeric(12, 2) not null,
  date date not null default current_date,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- אינדקסים ----------

create index if not exists idx_transactions_household_date on transactions (household_id, date desc);
create index if not exists idx_categories_household on categories (household_id);
create index if not exists idx_recurring_household on recurring_expenses (household_id);
create index if not exists idx_goals_household on savings_goals (household_id);
create index if not exists idx_contributions_goal on savings_contributions (goal_id);

-- ---------- פונקציית עזר: האם המשתמש המחובר שייך לבית הנתון ----------

create or replace function is_household_member(h_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from household_members
    where household_id = h_id and user_id = auth.uid()
  );
$$;

-- ---------- RPC ליצירת/הצטרפות לבית משותף (עוקף את הצורך במדיניות INSERT פתוחה) ----------

create or replace function create_household(household_name text, member_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  new_code text;
begin
  new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  insert into households (name, invite_code) values (household_name, new_code)
    returning id into new_household_id;
  insert into household_members (user_id, household_id, display_name)
    values (auth.uid(), new_household_id, member_display_name);
  return new_household_id;
end;
$$;

create or replace function join_household(code text, member_display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
begin
  select id into target_household_id from households where invite_code = upper(code);
  if target_household_id is null then
    raise exception 'קוד ההזמנה אינו תקין';
  end if;
  insert into household_members (user_id, household_id, display_name)
    values (auth.uid(), target_household_id, member_display_name)
    on conflict (user_id, household_id) do nothing;
  return target_household_id;
end;
$$;

grant execute on function create_household(text, text) to authenticated;
grant execute on function join_household(text, text) to authenticated;
grant execute on function is_household_member(uuid) to authenticated;

-- ---------- Row Level Security ----------

alter table households enable row level security;
alter table household_members enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table recurring_expenses enable row level security;
alter table savings_goals enable row level security;
alter table savings_contributions enable row level security;

-- households: חברי הבית יכולים לראות/לעדכן את הבית שלהם (יצירה מתבצעת רק דרך ה-RPC)
create policy "select own household" on households
  for select using (is_household_member(id));
create policy "update own household" on households
  for update using (is_household_member(id));

-- household_members: חברי הבית יכולים לראות מי עוד חבר באותו בית
create policy "select household members" on household_members
  for select using (is_household_member(household_id));

-- כל שאר הטבלאות: גישה מלאה (select/insert/update/delete) רק לחברי אותו household_id
create policy "household select categories" on categories
  for select using (is_household_member(household_id));
create policy "household insert categories" on categories
  for insert with check (is_household_member(household_id));
create policy "household update categories" on categories
  for update using (is_household_member(household_id));
create policy "household delete categories" on categories
  for delete using (is_household_member(household_id));

create policy "household select transactions" on transactions
  for select using (is_household_member(household_id));
create policy "household insert transactions" on transactions
  for insert with check (is_household_member(household_id));
create policy "household update transactions" on transactions
  for update using (is_household_member(household_id));
create policy "household delete transactions" on transactions
  for delete using (is_household_member(household_id));

create policy "household select recurring" on recurring_expenses
  for select using (is_household_member(household_id));
create policy "household insert recurring" on recurring_expenses
  for insert with check (is_household_member(household_id));
create policy "household update recurring" on recurring_expenses
  for update using (is_household_member(household_id));
create policy "household delete recurring" on recurring_expenses
  for delete using (is_household_member(household_id));

create policy "household select goals" on savings_goals
  for select using (is_household_member(household_id));
create policy "household insert goals" on savings_goals
  for insert with check (is_household_member(household_id));
create policy "household update goals" on savings_goals
  for update using (is_household_member(household_id));
create policy "household delete goals" on savings_goals
  for delete using (is_household_member(household_id));

create policy "household select contributions" on savings_contributions
  for select using (is_household_member(household_id));
create policy "household insert contributions" on savings_contributions
  for insert with check (is_household_member(household_id));
create policy "household update contributions" on savings_contributions
  for update using (is_household_member(household_id));
create policy "household delete contributions" on savings_contributions
  for delete using (is_household_member(household_id));

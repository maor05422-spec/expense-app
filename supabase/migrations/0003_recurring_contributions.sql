-- ============================================================
-- הרחבה: הפקדות אוטומטיות (חוזרות) ליעדי חיסכון
-- מריצים את הקובץ הזה בשלמותו ב-Supabase Studio > SQL Editor
-- (אחרי שכבר הרצתם את 0001_init.sql ו-0002_keyword_rules.sql)
-- ============================================================

create table if not exists recurring_contributions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  goal_id uuid not null references savings_goals (id) on delete cascade,
  amount numeric(12, 2) not null,
  day_of_month integer not null check (day_of_month between 1 and 28),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_recurring_contributions_household
  on recurring_contributions (household_id);
create index if not exists idx_recurring_contributions_goal
  on recurring_contributions (goal_id);

-- מקשר בין הפקדה שנוצרה אוטומטית לבין ההפקדה החוזרת שיצרה אותה, בדיוק כמו
-- recurring_id בטבלת transactions - כדי לדעת אם כבר נוצרה הפקדה החודש.
alter table savings_contributions
  add column if not exists recurring_contribution_id uuid
  references recurring_contributions (id) on delete set null;

alter table recurring_contributions enable row level security;

create policy "household select recurring_contributions" on recurring_contributions
  for select using (is_household_member(household_id));
create policy "household insert recurring_contributions" on recurring_contributions
  for insert with check (is_household_member(household_id));
create policy "household update recurring_contributions" on recurring_contributions
  for update using (is_household_member(household_id));
create policy "household delete recurring_contributions" on recurring_contributions
  for delete using (is_household_member(household_id));

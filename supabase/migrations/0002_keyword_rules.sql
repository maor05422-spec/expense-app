-- ============================================================
-- הרחבה: סיווג אוטומטי של תנועות לפי מילת מפתח בשם בית העסק
-- מריצים את הקובץ הזה בשלמותו ב-Supabase Studio > SQL Editor
-- (אחרי שכבר הרצתם את 0001_init.sql)
-- ============================================================

create table if not exists keyword_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  keyword text not null,
  category_id uuid not null references categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (household_id, keyword)
);

create index if not exists idx_keyword_rules_household on keyword_rules (household_id);

alter table keyword_rules enable row level security;

create policy "household select keyword_rules" on keyword_rules
  for select using (is_household_member(household_id));
create policy "household insert keyword_rules" on keyword_rules
  for insert with check (is_household_member(household_id));
create policy "household update keyword_rules" on keyword_rules
  for update using (is_household_member(household_id));
create policy "household delete keyword_rules" on keyword_rules
  for delete using (is_household_member(household_id));

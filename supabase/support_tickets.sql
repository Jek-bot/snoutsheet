-- Support tickets submitted via the in-app "Report a problem" modal.
-- Run in the Supabase SQL editor (like schema.sql / storage_policies.sql).

create table if not exists support_tickets (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete set null,
  user_email    text,
  category      text not null,
  subject       text not null,
  message       text not null,
  expected      text,
  severity      text,
  error_text    text,                       -- pasted error, for the "Error message" category
  page_url      text,
  user_agent    text,
  app_meta      jsonb,                       -- viewport, build, sentry_event_id, etc.
  status        text not null default 'new', -- new | in_progress | resolved
  created_at    timestamptz default now()
);

alter table support_tickets enable row level security;

-- A user can file a ticket and read back their own.
create policy "support owner insert" on support_tickets
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "support owner select" on support_tickets
  for select to authenticated
  using (auth.uid() = user_id);

-- Admins can read and triage every ticket. The subquery reads the caller's own
-- user_profiles row (allowed by that table's RLS), so no recursion.
create policy "support admin select" on support_tickets
  for select to authenticated
  using (exists (
    select 1 from user_profiles where id = auth.uid() and is_admin
  ));

create policy "support admin update" on support_tickets
  for update to authenticated
  using (exists (
    select 1 from user_profiles where id = auth.uid() and is_admin
  ))
  with check (exists (
    select 1 from user_profiles where id = auth.uid() and is_admin
  ));

create index if not exists idx_support_tickets_status
  on support_tickets (status, created_at desc);

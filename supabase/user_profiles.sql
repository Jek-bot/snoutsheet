-- Run this in your Supabase SQL editor

-- ─── User Profiles ──────────────────────────────────────────────────────────
create table user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  approved    boolean default false,
  is_admin    boolean default false,
  created_at  timestamptz default now()
);

alter table user_profiles enable row level security;

-- Users can read their own profile (to check approval status)
create policy "users read own profile" on user_profiles
  for select using (auth.uid() = id);

-- Admins can read and update all profiles
create policy "admins manage all profiles" on user_profiles
  for all using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Auto-create a profile row when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_profiles (id, approved, is_admin)
  values (new.id, false, false);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── After running the above, mark YOUR account as admin + approved ──────────
-- Replace the email below with your own, then run this second block:

update user_profiles
set approved = true, is_admin = true
where id = (
  select id from auth.users where email = 'YOUR_EMAIL_HERE'
);

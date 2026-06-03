-- Snoutsheet schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Clients ────────────────────────────────────────────────────────────────
create table clients (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  first_name  text not null,
  last_name   text not null,
  email       text,
  phone       text,
  address     text,
  city        text,
  state       text,
  zip         text,
  notes       text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  vet_name    text,
  vet_phone   text,
  vet_address text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table clients enable row level security;
create policy "owner access" on clients
  for all using (auth.uid() = user_id);

-- ─── Pets ───────────────────────────────────────────────────────────────────
create table pets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  client_id   uuid references clients(id) on delete cascade not null,
  name        text not null,
  species     text not null default 'Dog',
  breed       text,
  color       text,
  dob         date,
  sex         text check (sex in ('Male','Female','Unknown')),
  altered     boolean default false,
  weight_lbs  numeric(5,1),
  microchip   text,
  photo_url   text,
  notes       text,
  medical_notes text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table pets enable row level security;
create policy "owner access" on pets
  for all using (auth.uid() = user_id);

-- ─── Vaccines ───────────────────────────────────────────────────────────────
create table vaccines (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  pet_id        uuid references pets(id) on delete cascade not null,
  vaccine_name  text not null,
  date_given    date,
  expiry_date   date,
  lot_number    text,
  administered_by text,
  document_url  text,
  notes         text,
  created_at    timestamptz default now()
);

alter table vaccines enable row level security;
create policy "owner access" on vaccines
  for all using (auth.uid() = user_id);

-- ─── Services ───────────────────────────────────────────────────────────────
create table services (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  duration_minutes int,
  base_price  numeric(8,2) not null default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

alter table services enable row level security;
create policy "owner access" on services
  for all using (auth.uid() = user_id);

-- ─── Bookings ───────────────────────────────────────────────────────────────
create type booking_status as enum ('inquiry','confirmed','active','completed','cancelled');

create table bookings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  client_id     uuid references clients(id) on delete set null,
  service_id    uuid references services(id) on delete set null,
  status        booking_status default 'inquiry',
  start_date    timestamptz not null,
  end_date      timestamptz not null,
  price         numeric(8,2),
  paid          boolean default false,
  paid_at       timestamptz,
  payment_method text,
  notes         text,
  gcal_event_id text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table bookings enable row level security;
create policy "owner access" on bookings
  for all using (auth.uid() = user_id);

-- ─── Booking Pets (many-to-many) ────────────────────────────────────────────
create table booking_pets (
  booking_id  uuid references bookings(id) on delete cascade,
  pet_id      uuid references pets(id) on delete cascade,
  primary key (booking_id, pet_id)
);

alter table booking_pets enable row level security;
create policy "owner access" on booking_pets
  for all using (
    exists (
      select 1 from bookings b
      where b.id = booking_id and b.user_id = auth.uid()
    )
  );

-- ─── Settings ───────────────────────────────────────────────────────────────
create table settings (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references auth.users(id) on delete cascade unique not null,
  business_name         text default 'My Pet Sitting',
  business_phone        text,
  business_email        text,
  business_address      text,
  timezone              text default 'America/Chicago',
  gcal_connected        boolean default false,
  gcal_calendar_id      text,
  gcal_refresh_token    text,
  vaccine_reminder_days int default 30,
  booking_reminder_days int default 2,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table settings enable row level security;
create policy "owner access" on settings
  for all using (auth.uid() = user_id);

-- ─── Updated-at trigger ─────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clients_updated_at before update on clients
  for each row execute function update_updated_at();
create trigger trg_pets_updated_at before update on pets
  for each row execute function update_updated_at();
create trigger trg_bookings_updated_at before update on bookings
  for each row execute function update_updated_at();
create trigger trg_settings_updated_at before update on settings
  for each row execute function update_updated_at();

-- ─── Default services seed ──────────────────────────────────────────────────
-- (run after your first login, substituting your user_id)
-- insert into services (user_id, name, base_price, duration_minutes) values
--   ('<your-user-id>', 'Overnight Stay', 75.00, 1440),
--   ('<your-user-id>', 'Drop-In Visit (30 min)', 25.00, 30),
--   ('<your-user-id>', 'Dog Walking (60 min)', 30.00, 60);

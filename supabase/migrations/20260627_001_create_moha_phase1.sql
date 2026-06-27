-- =========================================================
-- MOHA PARLOUR — PHASE 1 DATABASE FOUNDATION
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------

do $$
begin
  create type public.moha_member_role as enum (
    'owner',
    'admin',
    'receptionist',
    'technician'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.moha_appointment_status as enum (
    'requested',
    'confirmed',
    'arrived',
    'in_service',
    'completed',
    'cancelled',
    'no_show'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.moha_appointment_source as enum (
    'online',
    'walk_in',
    'admin'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------
-- 2. CORE TABLES
-- ---------------------------------------------------------

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Africa/Nairobi',
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint salons_slug_format_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.salon_members (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.moha_member_role not null default 'receptionist',
  created_at timestamptz not null default now(),

  constraint salon_members_unique_user_per_salon
    unique (salon_id, user_id)
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  full_name text not null,
  specialty text,
  bio text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint staff_full_name_not_empty
    check (char_length(trim(full_name)) >= 2)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  category text,
  description text,
  price_kes integer not null,
  duration_minutes integer not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint services_name_not_empty
    check (char_length(trim(name)) >= 2),

  constraint services_price_not_negative
    check (price_kes >= 0),

  constraint services_valid_duration
    check (duration_minutes between 15 and 480)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  full_name text not null,
  phone text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customers_name_not_empty
    check (char_length(trim(full_name)) >= 2),

  constraint customers_unique_phone_per_salon
    unique (salon_id, phone)
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  day_of_week smallint not null,
  is_open boolean not null default true,
  opens_at time,
  closes_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_hours_valid_day
    check (day_of_week between 0 and 6),

  constraint business_hours_unique_day
    unique (salon_id, day_of_week),

  constraint business_hours_valid_times
    check (
      (is_open = false)
      or (
        opens_at is not null
        and closes_at is not null
        and opens_at < closes_at
      )
    )
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  staff_id uuid references public.staff(id) on delete set null,

  customer_name text not null,
  customer_phone text not null,

  appointment_start timestamptz not null,
  status public.moha_appointment_status not null default 'requested',
  source public.moha_appointment_source not null default 'online',

  client_note text,
  internal_note text,

  confirmed_at timestamptz,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointments_customer_name_not_empty
    check (char_length(trim(customer_name)) >= 2)
);

-- ---------------------------------------------------------
-- 3. AUTOMATIC updated_at TIMESTAMPS
-- ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists salons_set_updated_at on public.salons;
create trigger salons_set_updated_at
before update on public.salons
for each row
execute function public.set_updated_at();

drop trigger if exists staff_set_updated_at on public.staff;
create trigger staff_set_updated_at
before update on public.staff
for each row
execute function public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

drop trigger if exists business_hours_set_updated_at on public.business_hours;
create trigger business_hours_set_updated_at
before update on public.business_hours
for each row
execute function public.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 4. SEED THE MOHA SALON
-- ---------------------------------------------------------

insert into public.salons (
  name,
  slug,
  timezone
)
values (
  'MOHA',
  'moha',
  'Africa/Nairobi'
)
on conflict (slug) do update
set
  name = excluded.name,
  timezone = excluded.timezone,
  updated_at = now();

-- Default business hours:
-- Sunday closed
-- Monday to Saturday: 9:00 AM to 6:00 PM

insert into public.business_hours (
  salon_id,
  day_of_week,
  is_open,
  opens_at,
  closes_at
)
select
  salons.id,
  days.day_of_week,
  case when days.day_of_week = 0 then false else true end,
  case when days.day_of_week = 0 then null else time '09:00' end,
  case when days.day_of_week = 0 then null else time '18:00' end
from public.salons
cross join (
  select generate_series(0, 6)::smallint as day_of_week
) as days
where salons.slug = 'moha'
on conflict (salon_id, day_of_week) do nothing;

-- ---------------------------------------------------------
-- 5. MEMBERSHIP HELPER FOR PRIVATE DASHBOARD ACCESS
-- ---------------------------------------------------------

create or replace function public.is_salon_member(target_salon_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.salon_members
    where salon_id = target_salon_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_salon_member(uuid) from public;
grant execute on function public.is_salon_member(uuid) to authenticated;

-- ---------------------------------------------------------
-- 6. ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------

alter table public.salons enable row level security;
alter table public.salon_members enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.business_hours enable row level security;
alter table public.appointments enable row level security;

-- ---------------------------------------------------------
-- 7. DATABASE PERMISSIONS
-- ---------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.staff, public.services, public.business_hours
to anon, authenticated;

grant select, insert, update, delete
on public.salons,
public.salon_members,
public.staff,
public.services,
public.customers,
public.business_hours,
public.appointments
to authenticated;

-- ---------------------------------------------------------
-- 8. PUBLIC READ POLICIES
-- Public customers can later see only active services,
-- active technicians, and business hours.
-- ---------------------------------------------------------

drop policy if exists "Public can view active services" on public.services;
create policy "Public can view active services"
on public.services
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can view active staff" on public.staff;
create policy "Public can view active staff"
on public.staff
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public can view business hours" on public.business_hours;
create policy "Public can view business hours"
on public.business_hours
for select
to anon, authenticated
using (true);

-- ---------------------------------------------------------
-- 9. PRIVATE MOHA STAFF POLICIES
-- ---------------------------------------------------------

drop policy if exists "Members can view their salon" on public.salons;
create policy "Members can view their salon"
on public.salons
for select
to authenticated
using ((select public.is_salon_member(id)));

drop policy if exists "Members can update their salon" on public.salons;
create policy "Members can update their salon"
on public.salons
for update
to authenticated
using ((select public.is_salon_member(id)))
with check ((select public.is_salon_member(id)));

drop policy if exists "Members can view salon members" on public.salon_members;
create policy "Members can view salon members"
on public.salon_members
for select
to authenticated
using ((select public.is_salon_member(salon_id)));

drop policy if exists "Members can manage staff" on public.staff;
create policy "Members can manage staff"
on public.staff
for all
to authenticated
using ((select public.is_salon_member(salon_id)))
with check ((select public.is_salon_member(salon_id)));

drop policy if exists "Members can manage services" on public.services;
create policy "Members can manage services"
on public.services
for all
to authenticated
using ((select public.is_salon_member(salon_id)))
with check ((select public.is_salon_member(salon_id)));

drop policy if exists "Members can manage customers" on public.customers;
create policy "Members can manage customers"
on public.customers
for all
to authenticated
using ((select public.is_salon_member(salon_id)))
with check ((select public.is_salon_member(salon_id)));

drop policy if exists "Members can manage business hours" on public.business_hours;
create policy "Members can manage business hours"
on public.business_hours
for all
to authenticated
using ((select public.is_salon_member(salon_id)))
with check ((select public.is_salon_member(salon_id)));

drop policy if exists "Members can manage appointments" on public.appointments;
create policy "Members can manage appointments"
on public.appointments
for all
to authenticated
using ((select public.is_salon_member(salon_id)))
with check ((select public.is_salon_member(salon_id)));

-- ---------------------------------------------------------
-- 10. SAFE PUBLIC BOOKING FUNCTION
-- No anonymous user can read customer or appointment data.
-- They can only submit a new requested booking.
-- ---------------------------------------------------------

create or replace function public.create_public_booking(
  p_salon_slug text,
  p_full_name text,
  p_phone text,
  p_service_id uuid,
  p_preferred_staff_id uuid,
  p_appointment_start timestamptz,
  p_client_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_salon_id uuid;
  v_customer_id uuid;
  v_service_id uuid;
  v_staff_id uuid;
  v_appointment_id uuid;
  v_phone text;
begin
  if char_length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'Please enter your full name.';
  end if;

  if char_length(coalesce(p_client_note, '')) > 500 then
    raise exception 'Your note is too long.';
  end if;

  v_phone := regexp_replace(trim(coalesce(p_phone, '')), '[^0-9+]', '', 'g');

  if char_length(v_phone) < 7 then
    raise exception 'Please enter a valid phone number.';
  end if;

  if p_appointment_start < now() + interval '15 minutes' then
    raise exception 'Choose a future appointment time.';
  end if;

  if p_appointment_start > now() + interval '180 days' then
    raise exception 'Choose an appointment within the next six months.';
  end if;

  select id
  into v_salon_id
  from public.salons
  where slug = p_salon_slug;

  if v_salon_id is null then
    raise exception 'Salon was not found.';
  end if;

  select id
  into v_service_id
  from public.services
  where id = p_service_id
    and salon_id = v_salon_id
    and is_active = true;

  if v_service_id is null then
    raise exception 'That service is unavailable.';
  end if;

  if p_preferred_staff_id is not null then
    select id
    into v_staff_id
    from public.staff
    where id = p_preferred_staff_id
      and salon_id = v_salon_id
      and is_active = true;

    if v_staff_id is null then
      raise exception 'That technician is unavailable.';
    end if;
  end if;

  insert into public.customers (
    salon_id,
    full_name,
    phone
  )
  values (
    v_salon_id,
    trim(p_full_name),
    v_phone
  )
  on conflict (salon_id, phone) do nothing
  returning id into v_customer_id;

  if v_customer_id is null then
    select id
    into v_customer_id
    from public.customers
    where salon_id = v_salon_id
      and phone = v_phone;
  end if;

  insert into public.appointments (
    salon_id,
    customer_id,
    service_id,
    staff_id,
    customer_name,
    customer_phone,
    appointment_start,
    status,
    source,
    client_note
  )
  values (
    v_salon_id,
    v_customer_id,
    v_service_id,
    v_staff_id,
    trim(p_full_name),
    v_phone,
    p_appointment_start,
    'requested',
    'online',
    nullif(trim(coalesce(p_client_note, '')), '')
  )
  returning id into v_appointment_id;

  return v_appointment_id;
end;
$$;

revoke all on function public.create_public_booking(
  text,
  text,
  text,
  uuid,
  uuid,
  timestamptz,
  text
) from public;

grant execute on function public.create_public_booking(
  text,
  text,
  text,
  uuid,
  uuid,
  timestamptz,
  text
) to anon, authenticated;
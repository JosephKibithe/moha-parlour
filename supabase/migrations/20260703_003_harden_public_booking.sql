-- =========================================================
-- MOHA — PUBLIC BOOKING VALIDATION
-- =========================================================
-- Public booking requests:
-- • use MOHA business hours
-- • use 15-minute time intervals
-- • reject past dates
-- • validate active services / active technicians
-- • prevent accidental duplicate submissions
--
-- They remain "requested" and do NOT block a technician
-- until MOHA confirms them in the admin portal.

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
  v_service_duration integer;

  v_is_open boolean;
  v_opens_at time;
  v_closes_at time;

  v_local_start timestamp;
  v_local_end timestamp;
begin
  if char_length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'Please enter your full name.';
  end if;

  if char_length(coalesce(p_client_note, '')) > 500 then
    raise exception 'Your note is too long.';
  end if;

  v_phone := regexp_replace(
    trim(coalesce(p_phone, '')),
    '[^0-9+]',
    '',
    'g'
  );

  if char_length(v_phone) < 7 then
    raise exception 'Please enter a valid phone number.';
  end if;

  if p_appointment_start < now() + interval '15 minutes' then
    raise exception 'Please choose a future appointment time.';
  end if;

  if p_appointment_start > now() + interval '180 days' then
    raise exception 'Please choose an appointment within the next six months.';
  end if;

  select id
  into v_salon_id
  from public.salons
  where slug = p_salon_slug;

  if v_salon_id is null then
    raise exception 'Salon was not found.';
  end if;

  select
    id,
    duration_minutes
  into
    v_service_id,
    v_service_duration
  from public.services
  where id = p_service_id
    and salon_id = v_salon_id
    and is_active = true;

  if v_service_id is null then
    raise exception 'That service is currently unavailable.';
  end if;

  if p_preferred_staff_id is not null then
    select id
    into v_staff_id
    from public.staff
    where id = p_preferred_staff_id
      and salon_id = v_salon_id
      and is_active = true;

    if v_staff_id is null then
      raise exception 'That technician is currently unavailable.';
    end if;
  end if;

  -- Convert the requested time to Nairobi time for business-hour checks.
  v_local_start := p_appointment_start at time zone 'Africa/Nairobi';
  v_local_end :=
    (p_appointment_start + make_interval(mins => v_service_duration))
    at time zone 'Africa/Nairobi';

  if extract(minute from v_local_start)::integer % 15 <> 0 then
    raise exception 'Please choose a time in 15-minute intervals.';
  end if;

  if v_local_end::date <> v_local_start::date then
    raise exception 'Please choose a booking time during normal opening hours.';
  end if;

  select
    is_open,
    opens_at,
    closes_at
  into
    v_is_open,
    v_opens_at,
    v_closes_at
  from public.business_hours
  where salon_id = v_salon_id
    and day_of_week = extract(dow from v_local_start)::smallint;

  if not found or not v_is_open then
    raise exception 'MOHA is closed on the selected day.';
  end if;

  if
    v_opens_at is null
    or v_closes_at is null
    or v_local_start::time < v_opens_at
    or v_local_end::time > v_closes_at
  then
    raise exception 'Please choose a time during MOHA opening hours.';
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

  -- Stops an accidental double-click from creating two identical requests.
  if exists (
    select 1
    from public.appointments
    where salon_id = v_salon_id
      and customer_id = v_customer_id
      and appointment_start = p_appointment_start
      and status = 'requested'::public.moha_appointment_status
  ) then
    raise exception 'You already sent a booking request for this time.';
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
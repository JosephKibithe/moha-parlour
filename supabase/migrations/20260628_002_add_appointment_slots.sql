-- =========================================================
-- MOHA — APPOINTMENT SLOTS
-- =========================================================

-- Store the calculated finish time for every appointment.
-- This lets MOHA detect technician clashes accurately.

alter table public.appointments
add column if not exists appointment_end timestamptz;

-- Fill the end time for any appointments that may already exist.
update public.appointments as appointments
set appointment_end =
  appointments.appointment_start
  + make_interval(mins => services.duration_minutes)
from public.services as services
where appointments.service_id = services.id
  and appointments.appointment_end is null;

alter table public.appointments
alter column appointment_end set not null;

do $$
begin
  alter table public.appointments
  add constraint appointments_end_after_start_check
  check (appointment_end > appointment_start);
exception
  when duplicate_object then null;
end $$;

-- Automatically calculate the appointment end-time whenever
-- an appointment is created or its service/start time changes.

create or replace function public.set_appointment_end()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  service_duration integer;
begin
  select duration_minutes
  into service_duration
  from public.services
  where id = new.service_id;

  if service_duration is null then
    raise exception 'The selected service has no valid duration.';
  end if;

  new.appointment_end =
    new.appointment_start
    + make_interval(mins => service_duration);

  return new;
end;
$$;

drop trigger if exists appointments_set_end_time on public.appointments;

create trigger appointments_set_end_time
before insert or update of appointment_start, service_id
on public.appointments
for each row
execute function public.set_appointment_end();

-- Useful for day views and technician clash checks.

create index if not exists appointments_salon_start_index
on public.appointments (salon_id, appointment_start);

create index if not exists appointments_staff_start_index
on public.appointments (staff_id, appointment_start);
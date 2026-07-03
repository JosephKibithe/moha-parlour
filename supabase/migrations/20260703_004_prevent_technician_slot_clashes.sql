-- =========================================================
-- MOHA — PREVENT CONFIRMED TECHNICIAN TIME CLASHES
-- =========================================================

create extension if not exists btree_gist;

do $$
begin
  alter table public.appointments
  add constraint appointments_active_technician_no_overlap
  exclude using gist (
    salon_id with =,
    staff_id with =,
    tstzrange(appointment_start, appointment_end, '[)') with &&
  )
  where (
    staff_id is not null
    and status in (
      'confirmed'::public.moha_appointment_status,
      'arrived'::public.moha_appointment_status,
      'in_service'::public.moha_appointment_status
    )
  );
exception
  when duplicate_object then null;
end $$;
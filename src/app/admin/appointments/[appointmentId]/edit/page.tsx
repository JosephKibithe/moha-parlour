import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireMohaAdmin } from "@/lib/moha-admin";
import {
  formatNairobiDate,
  formatNairobiTime,
  getNairobiDateInputValue,
  getNairobiTimeInputValue,
} from "@/lib/moha-time";
import { createClient } from "@/lib/supabase/server";
import { updateAppointment } from "./actions";

type EditAppointmentPageProps = {
  params: Promise<{
    appointmentId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

const sourceLabels: Record<string, string> = {
  online: "Online booking request",
  walk_in: "Walk-in",
  admin: "Phone / WhatsApp booking",
};

const statusLabels: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
};

const editErrors: Record<string, string> = {
  "invalid-details": "Check the appointment details and try again.",
  "invalid-phone": "Enter a valid client phone number.",
  "not-found": "This appointment could not be found.",
  "appointment-not-editable":
    "Only requested and confirmed appointments can be edited.",
  "past-time": "Choose a future appointment time.",
  "service-unavailable": "That service is inactive or no longer available.",
  "technician-unavailable":
    "That technician is unavailable. Choose another one.",
  "technician-busy":
    "That technician already has a confirmed appointment during this time.",
  "closed-day": "MOHA is closed on the selected day.",
  "outside-hours": "This appointment falls outside MOHA business hours.",
  "save-failed":
    "The appointment could not be updated. Check your VS Code terminal for details.",
};

export default async function EditAppointmentPage({
  params,
  searchParams,
}: EditAppointmentPageProps) {
  const { appointmentId } = await params;
  const { error } = await searchParams;

  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select(
      `
        id,
        customer_name,
        customer_phone,
        customer_id,
        service_id,
        staff_id,
        appointment_start,
        appointment_end,
        status,
        source,
        client_note
      `,
    )
    .eq("id", appointmentId)
    .eq("salon_id", salon.id)
    .maybeSingle();

  if (appointmentError) {
    console.error("Could not load MOHA appointment:", appointmentError.message);
  }

  if (!appointment) {
    notFound();
  }

  const [
    { data: services, error: servicesError },
    { data: technicians, error: techniciansError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, price_kes, duration_minutes, is_active, display_order")
      .eq("salon_id", salon.id)
      .order("display_order", { ascending: true }),

    supabase
      .from("staff")
      .select("id, full_name, specialty, is_active, display_order")
      .eq("salon_id", salon.id)
      .order("display_order", { ascending: true }),
  ]);

  if (servicesError) {
    console.error("Could not load MOHA services:", servicesError.message);
  }

  if (techniciansError) {
    console.error("Could not load MOHA technicians:", techniciansError.message);
  }

  const activeServices = services?.filter((service) => service.is_active) ?? [];
  const activeTechnicians =
    technicians?.filter((technician) => technician.is_active) ?? [];

  const appointmentDate = getNairobiDateInputValue(
    appointment.appointment_start,
  );

  const appointmentTime = getNairobiTimeInputValue(
    appointment.appointment_start,
  );

  const isEditable =
    appointment.status === "requested" || appointment.status === "confirmed";

  const selectedServiceIsActive = activeServices.some(
    (service) => service.id === appointment.service_id,
  );

  const selectedTechnicianIsActive = appointment.staff_id
    ? activeTechnicians.some(
        (technician) => technician.id === appointment.staff_id,
      )
    : true;

  return (
    <AdminShell activePage="appointments">
      <header className="border-b border-stone-200 pb-6">
        <Link
          href={`/admin/appointments?date=${appointmentDate}`}
          className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
        >
          ← Back to appointments
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-rose-500">
              EDIT APPOINTMENT
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {appointment.customer_name}
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              {formatNairobiDate(appointment.appointment_start)} ·{" "}
              {formatNairobiTime(appointment.appointment_start)}
            </p>
          </div>

          <div className="rounded-2xl bg-stone-950 px-5 py-4 text-white">
            <p className="text-xs font-medium text-stone-400">Status</p>

            <p className="mt-1 text-xl font-bold">
              {statusLabels[appointment.status] ?? appointment.status}
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">
          {editErrors[error] ?? "Something went wrong. Please try again."}
        </div>
      ) : null}

      {!isEditable ? (
        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-8">
          <h2 className="text-xl font-bold text-amber-900">
            This appointment can no longer be edited.
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-amber-800">
            Completed, cancelled, no-show, arrived, and in-service appointments
            are kept as history. Only requested and confirmed bookings can be
            rescheduled or changed.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_330px]">
          <form
            action={updateAppointment}
            className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="appointmentId" value={appointment.id} />

            <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <h2 className="font-bold">Appointment details</h2>

                <p className="mt-1 text-sm text-stone-500">
                  Update the booking, then save the new schedule.
                </p>
              </div>

              <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600">
                {sourceLabels[appointment.source] ?? appointment.source}
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="customerName"
                  className="mb-2 block text-sm font-semibold"
                >
                  Client name
                </label>

                <input
                  id="customerName"
                  name="customerName"
                  required
                  defaultValue={appointment.customer_name}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label
                  htmlFor="customerPhone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Phone number
                </label>

                <input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  required
                  defaultValue={appointment.customer_phone}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="serviceId"
                className="mb-2 block text-sm font-semibold"
              >
                Service
              </label>

              <select
                id="serviceId"
                name="serviceId"
                required
                defaultValue={
                  selectedServiceIsActive ? appointment.service_id : ""
                }
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400"
              >
                {!selectedServiceIsActive ? (
                  <option value="" disabled>
                    Previous service is unavailable — choose an active service
                  </option>
                ) : null}

                {activeServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — KSh {service.price_kes.toLocaleString()} (
                    {service.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <label
                htmlFor="staffId"
                className="mb-2 block text-sm font-semibold"
              >
                Technician
              </label>

              <select
                id="staffId"
                name="staffId"
                defaultValue={
                  selectedTechnicianIsActive ? (appointment.staff_id ?? "") : ""
                }
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400"
              >
                <option value="">
                  Assign later / any available technician
                </option>

                {!selectedTechnicianIsActive ? (
                  <option value="" disabled>
                    Previous technician is unavailable — choose another
                  </option>
                ) : null}

                {activeTechnicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.full_name}
                    {technician.specialty ? ` — ${technician.specialty}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="appointmentDate"
                  className="mb-2 block text-sm font-semibold"
                >
                  Date
                </label>

                <input
                  id="appointmentDate"
                  name="appointmentDate"
                  type="date"
                  required
                  defaultValue={appointmentDate}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label
                  htmlFor="appointmentTime"
                  className="mb-2 block text-sm font-semibold"
                >
                  Start time
                </label>

                <input
                  id="appointmentTime"
                  name="appointmentTime"
                  type="time"
                  required
                  step="900"
                  defaultValue={appointmentTime}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="clientNote"
                className="mb-2 block text-sm font-semibold"
              >
                Nail request or client note
              </label>

              <textarea
                id="clientNote"
                name="clientNote"
                rows={5}
                maxLength={500}
                defaultValue={appointment.client_note ?? ""}
                placeholder="Example: Short almond, French tips, nude base, chrome details."
                className="w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 leading-6 outline-none placeholder:text-stone-400 focus:border-rose-400"
              />
            </div>

            <div className="mt-7 flex flex-wrap gap-3 border-t border-stone-100 pt-6">
              <button
                type="submit"
                className="rounded-xl bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400"
              >
                Save appointment changes
              </button>

              <Link
                href={`/admin/appointments?date=${appointmentDate}`}
                className="rounded-xl border border-stone-300 px-5 py-3 font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Cancel
              </Link>
            </div>
          </form>

          <aside className="h-fit rounded-3xl bg-stone-950 p-6 text-white shadow-xl">
            <p className="text-xs font-bold tracking-[0.25em] text-rose-400">
              BOOKING SUMMARY
            </p>

            <h2 className="mt-3 text-xl font-bold">Current appointment</h2>

            <div className="mt-6 space-y-5 text-sm">
              <div>
                <p className="text-stone-500">Current date and time</p>

                <p className="mt-1 font-semibold">
                  {formatNairobiDate(appointment.appointment_start)}
                </p>

                <p className="mt-1 text-stone-300">
                  {formatNairobiTime(appointment.appointment_start)} to{" "}
                  {formatNairobiTime(appointment.appointment_end)}
                </p>
              </div>

              <div>
                <p className="text-stone-500">Booking source</p>

                <p className="mt-1 font-semibold">
                  {sourceLabels[appointment.source] ?? appointment.source}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4 text-stone-300">
                Saving changes will automatically calculate the new end time
                using the selected service duration.
              </div>
            </div>
          </aside>
        </section>
      )}
    </AdminShell>
  );
}

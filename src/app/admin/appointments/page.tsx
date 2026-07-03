import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireMohaAdmin } from "@/lib/moha-admin";
import {
  addDaysToNairobiDate,
  formatNairobiDate,
  formatNairobiTime,
  getNairobiDateString,
  getNairobiDayRange,
  isValidNairobiDate,
} from "@/lib/moha-time";
import { createClient } from "@/lib/supabase/server";
import { createAppointment, updateAppointmentStatus } from "./actions";

const timeSlots: string[] = [];
for (let hour = 9; hour <= 17; hour++) {
  for (let min = 0; min <= 45; min += 15) {
    const hStr = String(hour).padStart(2, "0");
    const mStr = String(min).padStart(2, "0");
    timeSlots.push(`${hStr}:${mStr}`);
  }
}

function formatTime12(time24: string) {
  const [h, m] = time24.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

type AppointmentsPageProps = {
  searchParams: Promise<{
    date?: string;
    error?: string;
    success?: string;
  }>;
};

const statusLabels: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  arrived: "Arrived",
  in_service: "In service",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

const statusClasses: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  arrived: "bg-violet-100 text-violet-800",
  in_service: "bg-rose-100 text-rose-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-stone-200 text-stone-700",
  no_show: "bg-red-100 text-red-800",
};

const sourceLabels: Record<string, string> = {
  online: "Online request",
  walk_in: "Walk-in",
  admin: "Phone / WhatsApp",
};

const nextActions: Record<
  string,
  Array<{
    label: string;
    status:
      | "confirmed"
      | "arrived"
      | "in_service"
      | "completed"
      | "cancelled"
      | "no_show";
    tone: "primary" | "secondary" | "danger";
  }>
> = {
  requested: [
    { label: "Confirm", status: "confirmed", tone: "primary" },
    { label: "No-show", status: "no_show", tone: "secondary" },
    { label: "Cancel", status: "cancelled", tone: "danger" },
  ],
  confirmed: [
    { label: "Mark arrived", status: "arrived", tone: "primary" },
    { label: "No-show", status: "no_show", tone: "secondary" },
    { label: "Cancel", status: "cancelled", tone: "danger" },
  ],
  arrived: [
    { label: "Start service", status: "in_service", tone: "primary" },
    { label: "No-show", status: "no_show", tone: "secondary" },
  ],
  in_service: [{ label: "Complete", status: "completed", tone: "primary" }],
};

export default async function AppointmentsPage({
  searchParams,
}: AppointmentsPageProps) {
  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();
  const { date, error, success } = await searchParams;

  const selectedDate =
    date && isValidNairobiDate(date) ? date : getNairobiDateString();

  const previousDate = addDaysToNairobiDate(selectedDate, -1);
  const nextDate = addDaysToNairobiDate(selectedDate, 1);
  const { start, end } = getNairobiDayRange(selectedDate);

  const [
    { data: services, error: servicesError },
    { data: technicians, error: techniciansError },
    { data: appointments, error: appointmentsError },
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

    supabase
      .from("appointments")
      .select(
        `
          id,
          customer_name,
          customer_phone,
          service_id,
          staff_id,
          appointment_start,
          appointment_end,
          status,
          source,
          client_note,
          internal_note,
          created_at
        `,
      )
      .eq("salon_id", salon.id)
      .gte("appointment_start", start.toISOString())
      .lt("appointment_start", end.toISOString())
      .order("appointment_start", { ascending: true }),
  ]);

  if (servicesError) {
    console.error("Could not load MOHA services:", servicesError.message);
  }

  if (techniciansError) {
    console.error("Could not load MOHA technicians:", techniciansError.message);
  }

  if (appointmentsError) {
    console.error(
      "Could not load MOHA appointments:",
      appointmentsError.message,
    );
  }

  const activeServices = services?.filter((service) => service.is_active) ?? [];
  const activeTechnicians =
    technicians?.filter((technician) => technician.is_active) ?? [];

  const servicesById = new Map(
    services?.map((service) => [service.id, service]) ?? [],
  );

  const techniciansById = new Map(
    technicians?.map((technician) => [technician.id, technician]) ?? [],
  );

  const requestedCount =
    appointments?.filter((appointment) => appointment.status === "requested")
      .length ?? 0;

  return (
    <AdminShell activePage="appointments">
      <header className="border-b border-stone-200 pb-6">
        <Link
          href="/admin"
          className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
        >
          ← Dashboard
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-rose-500">
              MOHA APPOINTMENTS
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {formatNairobiDate(selectedDate)}
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Add walk-ins, phone bookings, and manage client appointment
              progress.
            </p>
          </div>

          <div className="rounded-2xl bg-stone-950 px-5 py-4 text-white">
            <p className="text-xs font-medium text-stone-400">
              Requests waiting
            </p>
            <p className="mt-1 text-2xl font-bold">{requestedCount}</p>
          </div>
        </div>
      </header>

      {success === "appointment-created" ? (
        <Notice type="success">Appointment added successfully.</Notice>
      ) : null}

      {success === "status-updated" ? (
        <Notice type="success">Appointment status updated.</Notice>
      ) : null}
      {success === "appointment-updated" ? (
        <Notice type="success">Appointment updated successfully.</Notice>
      ) : null}
      {error ? <AppointmentError error={error} /> : null}

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/appointments?date=${previousDate}`}
                className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold transition hover:bg-stone-50"
              >
                ←
              </Link>

              <Link
                href="/admin/appointments"
                className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold transition hover:bg-stone-50"
              >
                Today
              </Link>

              <Link
                href={`/admin/appointments?date=${nextDate}`}
                className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold transition hover:bg-stone-50"
              >
                →
              </Link>
            </div>

            <form
              action="/admin/appointments"
              className="flex items-center gap-2"
            >
              <label htmlFor="date" className="sr-only">
                Appointment date
              </label>

              <input
                id="date"
                name="date"
                type="date"
                defaultValue={selectedDate}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400"
              />

              <button
                type="submit"
                className="rounded-xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                View
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-6 py-5">
              <h2 className="font-bold">Schedule</h2>
              <p className="mt-1 text-sm text-stone-500">
                {appointments?.length ?? 0} appointment
                {(appointments?.length ?? 0) === 1 ? "" : "s"} on this day.
              </p>
            </div>

            {!appointments?.length ? (
              <div className="p-12 text-center">
                <p className="text-lg font-semibold">
                  No appointments for this date.
                </p>

                <p className="mt-2 text-sm text-stone-500">
                  Add a booking or walk-in using the MOHA form.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {appointments.map((appointment) => {
                  const service = servicesById.get(appointment.service_id);
                  const technician = appointment.staff_id
                    ? techniciansById.get(appointment.staff_id)
                    : null;

                  return (
                    <article key={appointment.id} className="p-6">
                      <div className="flex flex-col justify-between gap-5 lg:flex-row">
                        <div className="flex min-w-0 gap-4">
                          <div className="w-24 shrink-0">
                            <p className="text-base font-bold">
                              {formatNairobiTime(appointment.appointment_start)}
                            </p>

                            <p className="mt-1 text-sm text-stone-400">
                              to{" "}
                              {formatNairobiTime(appointment.appointment_end)}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold">
                                {appointment.customer_name}
                              </h3>

                              <span
                                className={[
                                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                                  statusClasses[appointment.status] ??
                                    "bg-stone-100 text-stone-700",
                                ].join(" ")}
                              >
                                {statusLabels[appointment.status] ??
                                  appointment.status}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-stone-500">
                              {appointment.customer_phone}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                              <p className="font-medium text-stone-800">
                                {service?.name ?? "Service unavailable"}
                              </p>

                              <p className="text-stone-500">
                                {technician
                                  ? technician.full_name
                                  : "Technician not assigned"}
                              </p>

                              <p className="text-stone-400">
                                {sourceLabels[appointment.source] ??
                                  appointment.source}
                              </p>
                            </div>

                            {appointment.client_note ? (
                              <p className="mt-3 max-w-xl rounded-xl bg-stone-50 px-3 py-2 text-sm leading-6 text-stone-600">
                                {appointment.client_note}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <AppointmentStatusActions
                          appointmentId={appointment.id}
                          status={appointment.status}
                          selectedDate={selectedDate}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-3xl bg-stone-950 p-6 text-white shadow-xl">
          <p className="text-xs font-bold tracking-[0.25em] text-rose-400">
            ADD APPOINTMENT
          </p>

          <h2 className="mt-3 text-xl font-bold">Walk-in or manual booking</h2>

          <p className="mt-2 text-sm leading-6 text-stone-400">
            Phone and WhatsApp bookings are added as confirmed. Walk-ins are
            added as arrived.
          </p>

          {!activeServices.length ? (
            <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Add at least one active service before creating appointments.
            </div>
          ) : null}

          <form action={createAppointment} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="source"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Booking source
              </label>

              <select
                id="source"
                name="source"
                defaultValue="admin"
                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none focus:border-rose-400"
              >
                <option value="admin">Phone / WhatsApp booking</option>
                <option value="walk_in">Walk-in client</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="customerName"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Client name
              </label>

              <input
                id="customerName"
                name="customerName"
                required
                placeholder="e.g. Wanjiku N."
                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
              />
            </div>

            <div>
              <label
                htmlFor="customerPhone"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Phone number
              </label>

              <input
                id="customerPhone"
                name="customerPhone"
                required
                type="tel"
                placeholder="0712 345 678"
                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
              />
            </div>

            <div>
              <label
                htmlFor="serviceId"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Service
              </label>

              <select
                id="serviceId"
                name="serviceId"
                required
                disabled={!activeServices.length}
                defaultValue=""
                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none focus:border-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>
                  Choose a service
                </option>

                {activeServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — KSh {service.price_kes.toLocaleString()} (
                    {service.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="staffId"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Technician
              </label>

              <select
                id="staffId"
                name="staffId"
                defaultValue=""
                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none focus:border-rose-400"
              >
                <option value="">
                  Assign later / any available technician
                </option>

                {activeTechnicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.full_name}
                    {technician.specialty ? ` — ${technician.specialty}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="appointmentDate"
                  className="mb-2 block text-sm font-medium text-stone-200"
                >
                  Date
                </label>

                <input
                  id="appointmentDate"
                  name="appointmentDate"
                  type="date"
                  required
                  defaultValue={selectedDate}
                  className="w-full rounded-xl border border-stone-700 bg-stone-900 px-3 py-3 text-white outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label
                  htmlFor="appointmentTime"
                  className="mb-2 block text-sm font-medium text-stone-200"
                >
                  Start time
                </label>

                <select
                  id="appointmentTime"
                  name="appointmentTime"
                  required
                  defaultValue="09:00"
                  className="w-full rounded-xl border border-stone-700 bg-stone-900 px-3 py-3 text-white outline-none focus:border-rose-400"
                >
                  {timeSlots.map((t) => (
                    <option
                      key={t}
                      value={t}
                      className="bg-stone-900 text-white"
                    >
                      {formatTime12(t)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="clientNote"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Client note <span className="text-stone-500">(optional)</span>
              </label>

              <textarea
                id="clientNote"
                name="clientNote"
                rows={3}
                maxLength={500}
                placeholder="e.g. Wants short almond, nude colour."
                className="w-full resize-none rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
              />
            </div>

            <button
              type="submit"
              disabled={!activeServices.length}
              className="w-full rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add appointment
            </button>
          </form>
        </aside>
      </section>
    </AdminShell>
  );
}
function AppointmentStatusActions({
  appointmentId,
  status,
  selectedDate,
}: {
  appointmentId: string;
  status: string;
  selectedDate: string;
}) {
  const actions = nextActions[status] ?? [];
  const canEdit = status === "requested" || status === "confirmed";

  if (!actions.length && !canEdit) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
      {canEdit ? (
        <Link
          href={`/admin/appointments/${appointmentId}/edit`}
          className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
        >
          Edit
        </Link>
      ) : null}

      {actions.map((action) => (
        <form key={action.status} action={updateAppointmentStatus}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="nextStatus" value={action.status} />
          <input type="hidden" name="appointmentDate" value={selectedDate} />

          <button
            type="submit"
            className={[
              "rounded-xl px-3 py-2 text-sm font-semibold transition",
              action.tone === "primary"
                ? "bg-stone-950 text-white hover:bg-stone-800"
                : "",
              action.tone === "secondary"
                ? "border border-stone-300 text-stone-700 hover:bg-stone-100"
                : "",
              action.tone === "danger"
                ? "border border-red-200 text-red-700 hover:bg-red-50"
                : "",
            ].join(" ")}
          >
            {action.label}
          </button>
        </form>
      ))}
    </div>
  );
}
function Notice({
  type,
  children,
}: {
  type: "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        type === "success"
          ? "mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
          : ""
      }
    >
      {children}
    </div>
  );
}

function AppointmentError({ error }: { error: string }) {
  const messages: Record<string, string> = {
    "invalid-appointment": "Check the appointment details, then try again.",
    "invalid-phone": "Enter a valid client phone number.",
    "past-appointment":
      "Phone bookings cannot be created in the past. Use a walk-in for an appointment that started today.",
    "service-unavailable": "That service is unavailable or inactive.",
    "technician-unavailable": "That technician is unavailable.",
    "technician-busy":
      "That technician already has a confirmed appointment during this time.",
    "closed-day": "MOHA is closed on the selected day.",
    "outside-hours": "This appointment falls outside MOHA business hours.",
    "invalid-status": "The requested status update was invalid.",
    "invalid-transition":
      "That appointment cannot move to the selected status.",
    "appointment-not-found": "That appointment no longer exists.",
    "save-failed":
      "The appointment could not be saved. Check your VS Code terminal for details.",
  };

  return (
    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">
      {messages[error] ?? "Something went wrong. Please try again."}
    </div>
  );
}

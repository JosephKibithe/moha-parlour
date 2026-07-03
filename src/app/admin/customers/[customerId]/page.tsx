import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireMohaAdmin } from "@/lib/moha-admin";
import { formatNairobiDate, formatNairobiTime } from "@/lib/moha-time";
import { createClient } from "@/lib/supabase/server";
import { updateCustomerNotes } from "../actions";

type CustomerProfilePageProps = {
  params: Promise<{
    customerId: string;
  }>;
  searchParams: Promise<{
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

export default async function CustomerProfilePage({
  params,
  searchParams,
}: CustomerProfilePageProps) {
  const { customerId } = await params;
  const { error, success } = await searchParams;

  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, full_name, phone, notes, created_at")
    .eq("id", customerId)
    .eq("salon_id", salon.id)
    .maybeSingle();

  if (customerError) {
    console.error("Could not load MOHA customer:", customerError.message);
  }

  if (!customer) {
    notFound();
  }

  const [
    { data: appointments, error: appointmentsError },
    { data: services, error: servicesError },
    { data: technicians, error: techniciansError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        `
          id,
          appointment_start,
          appointment_end,
          service_id,
          staff_id,
          status,
          source,
          client_note,
          internal_note
        `,
      )
      .eq("salon_id", salon.id)
      .eq("customer_id", customer.id)
      .order("appointment_start", { ascending: false }),

    supabase
      .from("services")
      .select("id, name, duration_minutes")
      .eq("salon_id", salon.id),

    supabase.from("staff").select("id, full_name").eq("salon_id", salon.id),
  ]);

  if (appointmentsError) {
    console.error(
      "Could not load MOHA customer appointments:",
      appointmentsError.message,
    );
  }

  if (servicesError) {
    console.error("Could not load MOHA services:", servicesError.message);
  }

  if (techniciansError) {
    console.error("Could not load MOHA technicians:", techniciansError.message);
  }

  const servicesById = new Map(
    services?.map((service) => [service.id, service]) ?? [],
  );

  const techniciansById = new Map(
    technicians?.map((technician) => [technician.id, technician]) ?? [],
  );

  const completedVisits =
    appointments?.filter((appointment) => appointment.status === "completed")
      .length ?? 0;

  const currentTime = new Date();

  const upcomingAppointments =
    appointments?.filter((appointment) => {
      return (
        ["requested", "confirmed", "arrived", "in_service"].includes(
          appointment.status,
        ) && new Date(appointment.appointment_start) >= currentTime
      );
    }) ?? [];

  return (
    <AdminShell activePage="customers">
      <header className="border-b border-stone-200 pb-6">
        <Link
          href="/admin/customers"
          className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
        >
          ← Customers
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-rose-100 text-2xl font-bold text-rose-600">
              {customer.full_name.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-rose-500">
                MOHA CLIENT PROFILE
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {customer.full_name}
              </h1>

              <p className="mt-2 text-sm text-stone-500">
                {customer.phone} · Client since{" "}
                {formatNairobiDate(customer.created_at)}
              </p>
            </div>
          </div>

          <Link
            href="/admin/appointments"
            className="inline-flex w-fit rounded-xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Add appointment
          </Link>
        </div>
      </header>

      {success === "notes-saved" ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
          Client notes saved.
        </div>
      ) : null}

      {error === "save-failed" ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">
          Client notes could not be saved. Check your VS Code terminal for
          details.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Completed visits"
          value={completedVisits}
          description="Appointments marked completed"
        />

        <StatCard
          label="Total appointments"
          value={appointments?.length ?? 0}
          description="Including bookings and walk-ins"
        />

        <StatCard
          label="Upcoming"
          value={upcomingAppointments.length}
          description="Active future appointments"
        />
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-5">
            <h2 className="font-bold">Appointment history</h2>

            <p className="mt-1 text-sm text-stone-500">
              Every MOHA booking and walk-in for this client.
            </p>
          </div>

          {!appointments?.length ? (
            <div className="p-12 text-center">
              <p className="text-lg font-semibold">No appointments yet.</p>

              <p className="mt-2 text-sm text-stone-500">
                Add the client’s first booking from the appointments page.
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">
                            {service?.name ?? "Service unavailable"}
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

                        <p className="mt-2 text-sm text-stone-500">
                          {formatNairobiDate(appointment.appointment_start)} ·{" "}
                          {formatNairobiTime(appointment.appointment_start)} to{" "}
                          {formatNairobiTime(appointment.appointment_end)}
                        </p>

                        <p className="mt-2 text-sm text-stone-500">
                          {technician
                            ? `Technician: ${technician.full_name}`
                            : "Technician: not assigned"}
                        </p>

                        {appointment.client_note ? (
                          <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-sm leading-6 text-stone-600">
                            {appointment.client_note}
                          </p>
                        ) : null}
                      </div>

                      <p className="shrink-0 text-sm font-medium text-stone-400">
                        {appointment.source === "walk_in"
                          ? "Walk-in"
                          : appointment.source === "online"
                            ? "Online request"
                            : "Phone / WhatsApp"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl bg-stone-950 p-6 text-white shadow-xl">
          <p className="text-xs font-bold tracking-[0.25em] text-rose-400">
            PRIVATE NOTES
          </p>

          <h2 className="mt-3 text-xl font-bold">Client preferences</h2>

          <p className="mt-2 text-sm leading-6 text-stone-400">
            Notes are visible only to authorised MOHA staff.
          </p>

          <form action={updateCustomerNotes} className="mt-6">
            <input type="hidden" name="customerId" value={customer.id} />

            <label htmlFor="notes" className="sr-only">
              Client notes
            </label>

            <textarea
              id="notes"
              name="notes"
              rows={8}
              maxLength={2000}
              defaultValue={customer.notes ?? ""}
              placeholder="Examples:
• Prefers short almond shape
• Likes nude and chrome colours
• Usually books with Faith
• Sensitive cuticles"
              className="w-full resize-none rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
            />

            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-400"
            >
              Save client notes
            </button>
          </form>

          {upcomingAppointments.length ? (
            <div className="mt-8 border-t border-stone-800 pt-6">
              <p className="text-xs font-bold tracking-[0.2em] text-stone-400">
                NEXT APPOINTMENT
              </p>

              <p className="mt-3 font-semibold">
                {formatNairobiDate(
                  upcomingAppointments[upcomingAppointments.length - 1]
                    .appointment_start,
                )}
              </p>

              <p className="mt-1 text-sm text-stone-400">
                {formatNairobiTime(
                  upcomingAppointments[upcomingAppointments.length - 1]
                    .appointment_start,
                )}
              </p>
            </div>
          ) : null}
        </aside>
      </section>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>

      <p className="mt-4 text-4xl font-bold">{value}</p>

      <p className="mt-3 text-sm leading-6 text-stone-500">{description}</p>
    </article>
  );
}

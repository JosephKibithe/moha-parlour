import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireMohaAdmin } from "@/lib/moha-admin";
import { formatNairobiDate, formatNairobiTime } from "@/lib/moha-time";
import { createClient } from "@/lib/supabase/server";

type CustomersPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

type CustomerSummary = {
  completedVisits: number;
  lastCompletedVisit?: string;
  upcomingAppointment?: string;
};

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();
  const { q } = await searchParams;

  const searchQuery = q?.trim().toLowerCase() ?? "";

  const [
    { data: customers, error: customersError },
    { data: appointments, error: appointmentsError },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone, notes, created_at")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("appointments")
      .select("id, customer_id, appointment_start, status")
      .eq("salon_id", salon.id)
      .order("appointment_start", { ascending: false }),
  ]);

  if (customersError) {
    console.error("Could not load MOHA customers:", customersError.message);
  }

  if (appointmentsError) {
    console.error(
      "Could not load MOHA customer appointments:",
      appointmentsError.message,
    );
  }

  const now = new Date();

  const customerSummaries = new Map<string, CustomerSummary>();

  for (const appointment of appointments ?? []) {
    const summary = customerSummaries.get(appointment.customer_id) ?? {
      completedVisits: 0,
    };

    if (appointment.status === "completed") {
      summary.completedVisits += 1;

      if (!summary.lastCompletedVisit) {
        summary.lastCompletedVisit = appointment.appointment_start;
      }
    }

    const isUpcomingStatus = [
      "requested",
      "confirmed",
      "arrived",
      "in_service",
    ].includes(appointment.status);

    if (isUpcomingStatus && new Date(appointment.appointment_start) >= now) {
      const currentUpcoming = summary.upcomingAppointment
        ? new Date(summary.upcomingAppointment)
        : null;

      const appointmentDate = new Date(appointment.appointment_start);

      if (!currentUpcoming || appointmentDate < currentUpcoming) {
        summary.upcomingAppointment = appointment.appointment_start;
      }
    }

    customerSummaries.set(appointment.customer_id, summary);
  }

  const filteredCustomers = (customers ?? []).filter((customer) => {
    if (!searchQuery) {
      return true;
    }

    return (
      customer.full_name.toLowerCase().includes(searchQuery) ||
      customer.phone.toLowerCase().includes(searchQuery)
    );
  });

  return (
    <AdminShell activePage="customers">
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
              MOHA CLIENTS
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Customers
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Client records are created automatically when you add an
              appointment or walk-in.
            </p>
          </div>

          <div className="rounded-2xl bg-stone-950 px-5 py-4 text-white">
            <p className="text-xs font-medium text-stone-400">Total clients</p>

            <p className="mt-1 text-2xl font-bold">{customers?.length ?? 0}</p>
          </div>
        </div>
      </header>

      <section className="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-stone-100 px-6 py-5 md:flex-row md:items-center">
          <div>
            <h2 className="font-bold">MOHA customer directory</h2>

            <p className="mt-1 text-sm text-stone-500">
              Search by name or phone number.
            </p>
          </div>

          <form
            action="/admin/customers"
            className="flex w-full gap-2 md:w-auto"
          >
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search a client..."
              className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-stone-400 focus:border-rose-400 md:w-64"
            />

            <button
              type="submit"
              className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Search
            </button>
          </form>
        </div>

        {!filteredCustomers.length ? (
          <div className="p-12 text-center">
            <p className="text-lg font-semibold">
              {searchQuery
                ? "No matching customers found."
                : "No customers yet."}
            </p>

            <p className="mt-2 text-sm text-stone-500">
              Add a walk-in or appointment and the client profile will appear
              here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredCustomers.map((customer) => {
              const summary = customerSummaries.get(customer.id) ?? {
                completedVisits: 0,
              };

              return (
                <Link
                  key={customer.id}
                  href={`/admin/customers/${customer.id}`}
                  className="block p-6 transition hover:bg-stone-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-lg font-bold text-rose-600">
                        {customer.full_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold">{customer.full_name}</h3>

                        <p className="mt-1 text-sm text-stone-500">
                          {customer.phone}
                        </p>

                        {customer.notes ? (
                          <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-stone-500">
                            {customer.notes}
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-stone-400">
                            No private client notes yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-6 text-sm lg:text-right">
                      <div>
                        <p className="text-stone-400">Completed visits</p>

                        <p className="mt-1 font-bold text-stone-900">
                          {summary.completedVisits}
                        </p>
                      </div>

                      <div>
                        <p className="text-stone-400">
                          {summary.upcomingAppointment
                            ? "Next appointment"
                            : "Last visit"}
                        </p>

                        <p className="mt-1 font-bold text-stone-900">
                          {summary.upcomingAppointment
                            ? `${formatNairobiDate(
                                summary.upcomingAppointment,
                              )} · ${formatNairobiTime(
                                summary.upcomingAppointment,
                              )}`
                            : summary.lastCompletedVisit
                              ? formatNairobiDate(summary.lastCompletedVisit)
                              : "No completed visit"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

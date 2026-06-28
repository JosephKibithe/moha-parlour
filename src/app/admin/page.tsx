import { AdminShell } from "@/components/admin/admin-shell";
import { requireMohaAdmin } from "@/lib/moha-admin";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const [
    { count: servicesCount },
    { count: staffCount },
    { count: requestedAppointmentsCount },
    { count: confirmedAppointmentsCount },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("is_active", true),

    supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("is_active", true),

    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("status", "requested"),

    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("status", "confirmed"),
  ]);

  return (
    <AdminShell activePage="dashboard">
      <header className="flex flex-col justify-between gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-rose-500">
            {salon.name.toUpperCase()} PARLOUR
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Good morning, MOHA
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Your bookings, team, and services will be managed here.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold transition hover:bg-stone-50"
        >
          View public website ↗
        </a>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Active services"
          value={servicesCount ?? 0}
          description="Services available for booking"
        />

        <DashboardCard
          label="Active technicians"
          value={staffCount ?? 0}
          description="Team members currently available"
        />

        <DashboardCard
          label="Booking requests"
          value={requestedAppointmentsCount ?? 0}
          description="Bookings waiting for MOHA approval"
          highlight
        />

        <DashboardCard
          label="Confirmed bookings"
          value={confirmedAppointmentsCount ?? 0}
          description="Upcoming approved appointments"
        />
      </section>

      <section className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-8">
        <p className="text-xs font-bold tracking-[0.25em] text-rose-500">
          GETTING STARTED
        </p>

        <h2 className="mt-3 text-2xl font-bold">
          Set up your MOHA service menu
        </h2>

        <p className="mt-3 max-w-2xl leading-7 text-stone-600">
          Add your real nail services, prices, and typical appointment duration.
          Once the service menu is ready, we will add technicians and connect
          the public booking form.
        </p>

        <a
          href="/admin/services"
          className="mt-6 inline-flex rounded-xl bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
        >
          Add MOHA services
        </a>
      </section>
    </AdminShell>
  );
}

function DashboardCard({
  label,
  value,
  description,
  highlight = false,
}: {
  label: string;
  value: number;
  description: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={[
        "rounded-3xl p-6 shadow-sm",
        highlight
          ? "bg-rose-500 text-white"
          : "border border-stone-200 bg-white",
      ].join(" ")}
    >
      <p
        className={
          highlight ? "text-sm text-rose-100" : "text-sm text-stone-500"
        }
      >
        {label}
      </p>

      <p className="mt-4 text-4xl font-bold">{value}</p>

      <p
        className={[
          "mt-3 text-sm leading-6",
          highlight ? "text-rose-100" : "text-stone-500",
        ].join(" ")}
      >
        {description}
      </p>
    </article>
  );
}

import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireMohaAdmin } from "@/lib/moha-admin";
import { createClient } from "@/lib/supabase/server";
import { createService } from "./actions";

type ServicesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();
  const { error, success } = await searchParams;

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(
      "id, name, category, description, price_kes, duration_minutes, is_active, display_order",
    )
    .eq("salon_id", salon.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (servicesError) {
    console.error("Could not load MOHA services:", servicesError.message);
  }

  return (
    <AdminShell activePage="services">
      <header className="flex flex-col justify-between gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
          >
            ← Dashboard
          </Link>

          <p className="mt-6 text-xs font-bold tracking-[0.25em] text-rose-500">
            MOHA SERVICE MENU
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Services and prices
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            These are the services clients will later select while booking.
          </p>
        </div>
      </header>

      {success === "service-created" ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
          Service added successfully.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">
          {error === "invalid-service"
            ? "Check the service name, price, and duration, then try again."
            : "The service could not be saved. Check your terminal for details."}
        </div>
      ) : null}

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-5">
            <h2 className="font-bold">Current MOHA services</h2>
            <p className="mt-1 text-sm text-stone-500">
              Add only services you are ready to offer online.
            </p>
          </div>

          {!services?.length ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold">
                Your service menu is empty.
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Add your first service from the form on the right.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{service.name}</h3>

                      {service.category ? (
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                          {service.category}
                        </span>
                      ) : null}
                    </div>

                    {service.description ? (
                      <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                        {service.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-5 sm:text-right">
                    <div>
                      <p className="text-lg font-bold">
                        KSh {service.price_kes.toLocaleString()}
                      </p>

                      <p className="mt-1 text-sm text-stone-500">
                        {service.duration_minutes} min
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl bg-stone-950 p-6 text-white shadow-xl">
          <p className="text-xs font-bold tracking-[0.25em] text-rose-400">
            ADD SERVICE
          </p>

          <h2 className="mt-3 text-xl font-bold">Create a MOHA service</h2>

          <form action={createService} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Service name
              </label>

              <input
                id="name"
                name="name"
                required
                placeholder="e.g. Gel manicure"
                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Category <span className="text-stone-500">(optional)</span>
              </label>

              <input
                id="category"
                name="category"
                placeholder="e.g. Manicure"
                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="priceKes"
                  className="mb-2 block text-sm font-medium text-stone-200"
                >
                  Price (KSh)
                </label>

                <input
                  id="priceKes"
                  name="priceKes"
                  type="number"
                  min="0"
                  step="50"
                  required
                  placeholder="1500"
                  className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
                />
              </div>

              <div>
                <label
                  htmlFor="durationMinutes"
                  className="mb-2 block text-sm font-medium text-stone-200"
                >
                  Duration
                </label>

                <select
                  id="durationMinutes"
                  name="durationMinutes"
                  defaultValue="60"
                  className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none focus:border-rose-400"
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hour</option>
                  <option value="75">1 hr 15 min</option>
                  <option value="90">1 hr 30 min</option>
                  <option value="120">2 hours</option>
                  <option value="150">2 hr 30 min</option>
                  <option value="180">3 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Short description{" "}
                <span className="text-stone-500">(optional)</span>
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={300}
                placeholder="What does this service include?"
                className="w-full resize-none rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-400"
            >
              Add service
            </button>
          </form>
        </aside>
      </section>
    </AdminShell>
  );
}

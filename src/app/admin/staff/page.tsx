import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireMohaAdmin } from "@/lib/moha-admin";
import { createClient } from "@/lib/supabase/server";
import { createTechnician, setTechnicianAvailability } from "./actions";

type StaffPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();
  const { error, success } = await searchParams;

  const { data: technicians, error: techniciansError } = await supabase
    .from("staff")
    .select(
      "id, full_name, specialty, bio, display_order, is_active, created_at",
    )
    .eq("salon_id", salon.id)
    .order("is_active", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (techniciansError) {
    console.error("Could not load MOHA technicians:", techniciansError.message);
  }

  const activeCount =
    technicians?.filter((technician) => technician.is_active).length ?? 0;

  return (
    <AdminShell activePage="staff">
      <header className="flex flex-col justify-between gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
          >
            ← Dashboard
          </Link>

          <p className="mt-6 text-xs font-bold tracking-[0.25em] text-rose-500">
            MOHA TEAM
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Technicians
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Add the nail technicians clients can select during booking.
          </p>
        </div>

        <div className="rounded-2xl bg-stone-950 px-5 py-4 text-white">
          <p className="text-xs font-medium text-stone-400">
            Active technicians
          </p>
          <p className="mt-1 text-2xl font-bold">{activeCount}</p>
        </div>
      </header>

      {success === "technician-created" ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
          Technician added successfully.
        </div>
      ) : null}

      {success === "availability-updated" ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
          Technician availability updated.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">
          {error === "invalid-technician"
            ? "Check the technician details and try again."
            : error === "update-failed"
              ? "Technician availability could not be updated. Check your terminal for details."
              : "Technician could not be saved. Check your terminal for details."}
        </div>
      ) : null}

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-5">
            <h2 className="font-bold">MOHA technician list</h2>
            <p className="mt-1 text-sm text-stone-500">
              Only active technicians will appear in the future booking form.
            </p>
          </div>

          {!technicians?.length ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold">No technicians added yet.</p>
              <p className="mt-2 text-sm text-stone-500">
                Add your first MOHA nail technician from the form.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {technicians.map((technician, index) => (
                <article
                  key={technician.id}
                  className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-lg font-bold text-rose-600">
                      {technician.full_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{technician.full_name}</h3>

                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            technician.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-stone-200 text-stone-600",
                          ].join(" ")}
                        >
                          {technician.is_active ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      {technician.specialty ? (
                        <p className="mt-1 text-sm font-medium text-rose-500">
                          {technician.specialty}
                        </p>
                      ) : null}

                      {technician.bio ? (
                        <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                          {technician.bio}
                        </p>
                      ) : null}

                      <p className="mt-3 text-xs text-stone-400">
                        Booking display position: {index + 1}
                      </p>
                    </div>
                  </div>

                  <form action={setTechnicianAvailability}>
                    <input
                      type="hidden"
                      name="technicianId"
                      value={technician.id}
                    />

                    <input
                      type="hidden"
                      name="nextIsActive"
                      value={technician.is_active ? "false" : "true"}
                    />

                    <button
                      type="submit"
                      className={[
                        "rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                        technician.is_active
                          ? "border-stone-300 text-stone-700 hover:bg-stone-100"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                      ].join(" ")}
                    >
                      {technician.is_active
                        ? "Mark unavailable"
                        : "Mark available"}
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl bg-stone-950 p-6 text-white shadow-xl">
          <p className="text-xs font-bold tracking-[0.25em] text-rose-400">
            ADD TECHNICIAN
          </p>

          <h2 className="mt-3 text-xl font-bold">Add to the MOHA team</h2>

          <p className="mt-2 text-sm leading-6 text-stone-400">
            This profile will later be visible to clients choosing a preferred
            technician.
          </p>

          <form action={createTechnician} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Full name
              </label>

              <input
                id="fullName"
                name="fullName"
                required
                placeholder="e.g. Faith W."
                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
              />
            </div>

            <div>
              <label
                htmlFor="specialty"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Specialty <span className="text-stone-500">(optional)</span>
              </label>

              <input
                id="specialty"
                name="specialty"
                placeholder="e.g. Acrylic extensions & nail art"
                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Short profile <span className="text-stone-500">(optional)</span>
              </label>

              <textarea
                id="bio"
                name="bio"
                rows={4}
                maxLength={300}
                placeholder="A short description clients can see later."
                className="w-full resize-none rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-400"
            >
              Add technician
            </button>
          </form>
        </aside>
      </section>
    </AdminShell>
  );
}

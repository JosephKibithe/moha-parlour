import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-stone-50 p-6 text-stone-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between border-b border-stone-200 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-rose-500">
              MOHA ADMIN
            </p>
            <h1 className="mt-2 text-3xl font-bold">MOHA Parlour Dashboard</h1>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold transition hover:bg-stone-100"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold">
            Dashboard protected successfully
          </h2>

          <p className="mt-3 text-stone-600">
            This is the private MOHA staff area. Next, we will connect services,
            technicians, clients, and booking requests.
          </p>
        </div>
      </section>
    </main>
  );
}

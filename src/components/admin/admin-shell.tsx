import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/admin/actions";

type AdminShellProps = {
  children: ReactNode;
  activePage?:
    | "dashboard"
    | "services"
    | "staff"
    | "appointments"
    | "customers"
    | "media";
};

const navigation = [
  { label: "Dashboard", href: "/admin", key: "dashboard" },
  { label: "Appointments", href: "/admin/appointments", key: "appointments" },
  { label: "Services", href: "/admin/services", key: "services" },
  { label: "Technicians", href: "/admin/staff", key: "staff" },
  { label: "Customers", href: "/admin/customers", key: "customers" },
  { label: "Website Media", href: "/admin/media", key: "media" },
] as const;

export function AdminShell({ children, activePage }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white px-3 py-2 shadow-lg md:hidden">
          <nav className="flex items-center justify-between gap-1 overflow-x-auto">
            {navigation.map((item) => {
              const isActive = item.key === activePage;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={[
                    "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition",
                    isActive
                      ? "bg-rose-500 text-white"
                      : "text-stone-500 hover:bg-stone-100",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-stone-950 p-6 text-stone-100 md:flex md:flex-col">
          <Link href="/admin" className="mb-12 block">
            <p className="text-xs font-bold tracking-[0.3em] text-rose-400">
              MOHA
            </p>

            <p className="mt-2 text-lg font-bold">Admin Portal</p>
          </Link>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = item.key === activePage;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={[
                    "block rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-rose-500 text-white"
                      : "text-stone-400 hover:bg-stone-900 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-stone-800 pt-6">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full rounded-xl border border-stone-700 px-4 py-3 text-left text-sm font-medium text-stone-300 transition hover:bg-stone-900 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-5 pb-24 md:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}

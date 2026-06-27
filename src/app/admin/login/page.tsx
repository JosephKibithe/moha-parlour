import Link from "next/link";
import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;

  const safeNext =
    next === "/admin" || next?.startsWith("/admin/") ? next : "/admin";

  const message =
    error === "missing-fields"
      ? "Enter both your email address and password."
      : error === "login-failed"
        ? "We could not sign you in. Check the email, password, and Supabase user confirmation status."
        : null;

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-12 text-stone-100">
      <section className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl border border-stone-800 bg-stone-900 p-8 shadow-2xl">
          <Link
            href="/"
            className="text-sm font-medium text-stone-400 transition hover:text-white"
          >
            ← Back to MOHA
          </Link>

          <p className="mt-10 text-xs font-bold tracking-[0.3em] text-rose-400">
            MOHA STAFF PORTAL
          </p>

          <h1 className="mt-3 text-3xl font-bold">Sign in</h1>

          <p className="mt-3 text-sm leading-6 text-stone-400">
            This area is for authorised MOHA staff only.
          </p>

          {message ? (
            <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {message}
            </div>
          ) : null}

          <form action={login} className="mt-8 space-y-5">
            <input type="hidden" name="next" value={safeNext} />

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-white outline-none placeholder:text-stone-600 focus:border-rose-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-stone-200"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-white outline-none placeholder:text-stone-600 focus:border-rose-400"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-400"
            >
              Sign in to MOHA
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

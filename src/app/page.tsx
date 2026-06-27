import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-rose-500">
          MOHA NAIL PARLOUR
        </p>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
          Beautiful nails.
          <br />
          Easier bookings.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
          Book your next nail appointment with MOHA. Choose your service,
          preferred time, and let our team take care of the rest.
        </p>

        <div className="mt-10">
          <Link
            href="/book"
            className="inline-flex rounded-full bg-stone-900 px-6 py-3 font-semibold text-white transition hover:bg-stone-700"
          >
            Book an appointment
          </Link>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-stone-500">Easy booking</p>
            <p className="mt-2 text-xl font-semibold">
              Choose a preferred time
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-stone-500">Professional care</p>
            <p className="mt-2 text-xl font-semibold">
              Services for every style
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-stone-500">MOHA team</p>
            <p className="mt-2 text-xl font-semibold">
              Appointments managed properly
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

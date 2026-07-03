import Link from "next/link";
import { createPublicBooking } from "./actions";
import { addDaysToNairobiDate, getNairobiDateString } from "@/lib/moha-time";
import { createClient } from "@/lib/supabase/server";

type BookingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const bookingErrors: Record<string, string> = {
  "invalid-details": "Please check the booking details and try again.",
  "invalid-name": "Please enter your full name.",
  "invalid-phone": "Please enter a valid phone number.",
  "service-unavailable":
    "That service is currently unavailable. Please choose another one.",
  "technician-unavailable":
    "That technician is currently unavailable. Please choose another technician.",
  "closed-day":
    "MOHA is closed on the selected day. Please choose another date.",
  "outside-hours": "Please choose a time during MOHA opening hours.",
  "invalid-time": "Please choose a time in 15-minute intervals.",
  "past-time": "Please choose a future appointment time.",
  "duplicate-request":
    "You already sent a booking request for this exact time.",
  "booking-failed": "Your booking request could not be sent. Please try again.",
};

function formatBusinessTime(value: string | null) {
  if (!value) {
    return "";
  }

  const [hourText, minuteText] = value.slice(0, 5).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const timeSlots: string[] = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (let min = 0; min <= 45; min += 15) {
      const hStr = String(hour).padStart(2, "0");
      const mStr = String(min).padStart(2, "0");
      timeSlots.push(`${hStr}:${mStr}`);
    }
  }

  const [
    { data: services, error: servicesError },
    { data: technicians, error: techniciansError },
    { data: businessHours, error: businessHoursError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, category, description, price_kes, duration_minutes")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),

    supabase
      .from("staff")
      .select("id, full_name, specialty")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),

    supabase
      .from("business_hours")
      .select("day_of_week, is_open, opens_at, closes_at")
      .order("day_of_week", { ascending: true }),
  ]);

  if (servicesError) {
    console.error(
      "Could not load public MOHA services:",
      servicesError.message,
    );
  }

  if (techniciansError) {
    console.error(
      "Could not load public MOHA technicians:",
      techniciansError.message,
    );
  }

  if (businessHoursError) {
    console.error(
      "Could not load public MOHA business hours:",
      businessHoursError.message,
    );
  }

  const today = getNairobiDateString();
  const latestBookingDate = addDaysToNairobiDate(today, 180);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
        >
          ← Back to MOHA
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <p className="text-xs font-bold tracking-[0.3em] text-rose-500">
              MOHA NAIL PARLOUR
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Request an appointment
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600">
              Choose your preferred service, technician, date, and time. MOHA
              will review your request before confirming your appointment.
            </p>

            {error ? (
              <div className="mt-7 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">
                {bookingErrors[error] ??
                  "Something went wrong. Please try again."}
              </div>
            ) : null}

            {!services?.length ? (
              <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                <p className="font-semibold">
                  MOHA is not accepting online bookings yet.
                </p>

                <p className="mt-2 text-sm leading-6">
                  Please contact the parlour directly for an appointment.
                </p>
              </div>
            ) : (
              <form action={createPublicBooking} className="mt-8 space-y-7">
                <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold tracking-[0.2em] text-rose-500">
                    YOUR DETAILS
                  </p>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="fullName"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Full name
                      </label>

                      <input
                        id="fullName"
                        name="fullName"
                        required
                        autoComplete="name"
                        placeholder="Your name"
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none placeholder:text-stone-400 focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Phone number
                      </label>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="0712 345 678"
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none placeholder:text-stone-400 focus:border-rose-400"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold tracking-[0.2em] text-rose-500">
                    APPOINTMENT DETAILS
                  </p>

                  <div className="mt-5 space-y-5">
                    <div>
                      <label
                        htmlFor="serviceId"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Select a service
                      </label>

                      <select
                        id="serviceId"
                        name="serviceId"
                        required
                        defaultValue=""
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400"
                      >
                        <option value="" disabled>
                          Choose a service
                        </option>

                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} — KSh{" "}
                            {service.price_kes.toLocaleString()} ·{" "}
                            {service.duration_minutes} min
                          </option>
                        ))}
                      </select>

                      <p className="mt-2 text-sm text-stone-500">
                        The listed price is the current MOHA service price.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="staffId"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Preferred technician{" "}
                        <span className="font-normal text-stone-400">
                          (optional)
                        </span>
                      </label>

                      <select
                        id="staffId"
                        name="staffId"
                        defaultValue=""
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400"
                      >
                        <option value="">Any available MOHA technician</option>

                        {technicians?.map((technician) => (
                          <option key={technician.id} value={technician.id}>
                            {technician.full_name}
                            {technician.specialty
                              ? ` — ${technician.specialty}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="appointmentDate"
                          className="mb-2 block text-sm font-semibold"
                        >
                          Preferred date
                        </label>

                        <input
                          id="appointmentDate"
                          name="appointmentDate"
                          type="date"
                          required
                          min={today}
                          max={latestBookingDate}
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="appointmentTime"
                          className="mb-2 block text-sm font-semibold"
                        >
                          Preferred time
                        </label>

                        <select
                          id="appointmentTime"
                          name="appointmentTime"
                          required
                          defaultValue=""
                          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-rose-400 animate-none"
                        >
                          <option value="" disabled>
                            Select preferred time
                          </option>
                          {timeSlots.map((t) => (
                            <option key={t} value={t}>
                              {formatBusinessTime(t)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="clientNote"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Nail request or inspiration note{" "}
                        <span className="font-normal text-stone-400">
                          (optional)
                        </span>
                      </label>

                      <textarea
                        id="clientNote"
                        name="clientNote"
                        rows={4}
                        maxLength={500}
                        placeholder="Example: Short almond shape, nude base with simple chrome details."
                        className="w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 leading-6 outline-none placeholder:text-stone-400 focus:border-rose-400"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl bg-stone-950 p-6 text-white">
                  <p className="text-sm font-semibold">
                    Your appointment is not confirmed yet.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    MOHA will review your preferred time and confirm the
                    appointment directly with you.
                  </p>

                  <button
                    type="submit"
                    className="mt-6 w-full rounded-xl bg-rose-500 px-5 py-3.5 font-semibold text-white transition hover:bg-rose-400"
                  >
                    Send booking request
                  </button>
                </section>
              </form>
            )}
          </section>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <p className="text-xs font-bold tracking-[0.25em] text-rose-500">
              MOHA HOURS
            </p>

            <h2 className="mt-3 text-xl font-bold">Plan your visit</h2>

            <div className="mt-6 space-y-3">
              {businessHours?.map((hours) => (
                <div
                  key={hours.day_of_week}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="font-medium text-stone-700">
                    {dayNames[hours.day_of_week]}
                  </span>

                  <span className="text-right text-stone-500">
                    {hours.is_open
                      ? `${formatBusinessTime(hours.opens_at)} – ${formatBusinessTime(hours.closes_at)}`
                      : "Closed"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-900">
                Booking requests
              </p>

              <p className="mt-2 text-sm leading-6 text-rose-800">
                Select a preferred time. MOHA will confirm availability before
                your appointment is final.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Sparkles,
} from "lucide-react";
import { MohaPublicHeader } from "@/components/public/moha-public-header";
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

const fieldClassName =
  "w-full rounded-xl border border-white/15 bg-[#111013] px-4 py-3 text-white outline-none placeholder:text-white/35 transition focus:border-[#d97b98] focus:ring-1 focus:ring-[#d97b98]/40";

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
    <main className="moha-editorial min-h-screen overflow-x-clip bg-[#0d0c0e] text-[#f7f3ef]">
      <MohaPublicHeader bookCtaLabel="Book your set" />

      <section className="relative isolate overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#7a334b]/30 blur-[130px]" />

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16 lg:px-10">
          <Link
            href="/"
            className="moha-hero-reveal inline-flex items-center gap-2 text-sm font-medium text-white/50 transition hover:text-white"
          >
            ← Back to MOHA
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
            <section>
              <div className="moha-hero-reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-[0.14em] text-[#efb0c4]">
                <Sparkles className="h-3.5 w-3.5" />
                BOOK YOUR SET
              </div>

              <h1 className="moha-display moha-hero-reveal mt-6 max-w-3xl text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl lg:text-[4.5rem]">
                Request an
                <br />
                <span className="italic text-[#efb0c4]">appointment.</span>
              </h1>

              <p className="moha-hero-reveal mt-6 max-w-2xl text-lg leading-8 text-white/60">
                Choose your preferred service, technician, date, and time. MOHA
                will review your request before confirming your appointment.
              </p>

              <div className="moha-hero-reveal mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <BookingStep
                  icon={<CalendarDays className="h-4 w-4" />}
                  title="Pick your time"
                  description="Select a preferred date and slot."
                />

                <BookingStep
                  icon={<Sparkles className="h-4 w-4" />}
                  title="Choose your set"
                  description="Browse live MOHA services."
                />

                <BookingStep
                  icon={<Clock3 className="h-4 w-4" />}
                  title="MOHA confirms"
                  description="We reach out once approved."
                />
              </div>

              {error ? (
                <div className="moha-hero-reveal mt-8 rounded-[1.4rem] border border-[#d97b98]/40 bg-[#d97b98]/10 px-5 py-4 text-sm font-medium text-[#efb0c4]">
                  {bookingErrors[error] ??
                    "Something went wrong. Please try again."}
                </div>
              ) : null}

              {!services?.length ? (
                <div className="moha-hero-reveal mt-8 rounded-[1.8rem] border border-dashed border-white/20 bg-white/5 p-8">
                  <p className="text-lg font-semibold text-white">
                    MOHA is not accepting online bookings yet.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Please contact the parlour directly for an appointment.
                  </p>
                </div>
              ) : (
                <form action={createPublicBooking} className="mt-10 space-y-6">
                  <section className="rounded-[1.8rem] border border-white/10 bg-[#161217] p-6 sm:p-7">
                    <p className="text-xs font-bold tracking-[0.2em] text-[#d97b98]">
                      YOUR DETAILS
                    </p>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="fullName"
                          className="mb-2 block text-sm font-semibold text-white/85"
                        >
                          Full name
                        </label>

                        <input
                          id="fullName"
                          name="fullName"
                          required
                          autoComplete="name"
                          placeholder="Your name"
                          className={fieldClassName}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="mb-2 block text-sm font-semibold text-white/85"
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
                          className={fieldClassName}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.8rem] border border-white/10 bg-[#161217] p-6 sm:p-7">
                    <p className="text-xs font-bold tracking-[0.2em] text-[#d97b98]">
                      APPOINTMENT DETAILS
                    </p>

                    <div className="mt-5 space-y-5">
                      <div>
                        <label
                          htmlFor="serviceId"
                          className="mb-2 block text-sm font-semibold text-white/85"
                        >
                          Select a service
                        </label>

                        <select
                          id="serviceId"
                          name="serviceId"
                          required
                          defaultValue=""
                          className={fieldClassName}
                        >
                          <option value="" disabled className="bg-[#161217]">
                            Choose a service
                          </option>

                          {services.map((service) => (
                            <option
                              key={service.id}
                              value={service.id}
                              className="bg-[#161217]"
                            >
                              {service.name} — KSh{" "}
                              {service.price_kes.toLocaleString()} ·{" "}
                              {service.duration_minutes} min
                            </option>
                          ))}
                        </select>

                        <p className="mt-2 text-sm text-white/45">
                          The listed price is the current MOHA service price.
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="staffId"
                          className="mb-2 block text-sm font-semibold text-white/85"
                        >
                          Preferred technician{" "}
                          <span className="font-normal text-white/35">
                            (optional)
                          </span>
                        </label>

                        <select
                          id="staffId"
                          name="staffId"
                          defaultValue=""
                          className={fieldClassName}
                        >
                          <option value="" className="bg-[#161217]">
                            Any available MOHA technician
                          </option>

                          {technicians?.map((technician) => (
                            <option
                              key={technician.id}
                              value={technician.id}
                              className="bg-[#161217]"
                            >
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
                            className="mb-2 block text-sm font-semibold text-white/85"
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
                            className={`${fieldClassName} [color-scheme:dark]`}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="appointmentTime"
                            className="mb-2 block text-sm font-semibold text-white/85"
                          >
                            Preferred time
                          </label>

                          <select
                            id="appointmentTime"
                            name="appointmentTime"
                            required
                            defaultValue=""
                            className={fieldClassName}
                          >
                            <option value="" disabled className="bg-[#161217]">
                              Select preferred time
                            </option>
                            {timeSlots.map((t) => (
                              <option
                                key={t}
                                value={t}
                                className="bg-[#161217]"
                              >
                                {formatBusinessTime(t)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="clientNote"
                          className="mb-2 block text-sm font-semibold text-white/85"
                        >
                          Nail request or inspiration note{" "}
                          <span className="font-normal text-white/35">
                            (optional)
                          </span>
                        </label>

                        <textarea
                          id="clientNote"
                          name="clientNote"
                          rows={4}
                          maxLength={500}
                          placeholder="Example: Short almond shape, nude base with simple chrome details."
                          className={`${fieldClassName} resize-none leading-6`}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.8rem] border border-[#d97b98]/30 bg-[#181318] p-6 sm:p-7">
                    <p className="text-sm font-semibold text-white">
                      Your appointment is not confirmed yet.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/55">
                      MOHA will review your preferred time and confirm the
                      appointment directly with you.
                    </p>

                    <button
                      type="submit"
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f7f3ef] px-5 py-3.5 font-semibold text-[#141014] transition hover:bg-[#efb0c4] sm:w-auto"
                    >
                      Send booking request
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </section>
                </form>
              )}
            </section>

            <aside className="h-fit rounded-[1.8rem] border border-white/10 bg-[#181318] p-6 sm:p-7 lg:sticky lg:top-24">
              <p className="text-xs font-bold tracking-[0.25em] text-[#d97b98]">
                MOHA HOURS
              </p>

              <h2 className="moha-display mt-3 text-3xl leading-none tracking-[-0.03em] text-white">
                Plan your visit
              </h2>

              <div className="mt-6 space-y-3">
                {businessHours?.map((hours) => (
                  <div
                    key={hours.day_of_week}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="font-medium text-white/75">
                      {dayNames[hours.day_of_week]}
                    </span>

                    <span className="text-right text-white/45">
                      {hours.is_open
                        ? `${formatBusinessTime(hours.opens_at)} – ${formatBusinessTime(hours.closes_at)}`
                        : "Closed"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-[1.2rem] border border-[#d97b98]/25 bg-[#d97b98]/10 p-4">
                <p className="text-sm font-semibold text-[#efb0c4]">
                  Booking requests
                </p>

                <p className="mt-2 text-sm leading-6 text-white/65">
                  Select a preferred time. MOHA will confirm availability
                  before your appointment is final.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function BookingStep({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[#d97b98]">{icon}</div>

      <p className="mt-4 text-sm font-semibold text-white">{title}</p>

      <p className="mt-1 text-xs leading-5 text-white/50">{description}</p>
    </article>
  );
}

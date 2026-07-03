import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
import { mohaPublic } from "@/lib/moha-public";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("services")
    .select(
      "id, name, category, description, price_kes, duration_minutes, display_order",
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .limit(6);

  if (error) {
    console.error("Could not load MOHA public services:", error.message);
  }

  const whatsappUrl = mohaPublic.phoneE164
    ? `https://wa.me/${mohaPublic.phoneE164.replace(/[^\d]/g, "")}`
    : null;

  const hasContactDetails =
    Boolean(mohaPublic.phoneE164) ||
    Boolean(mohaPublic.mapsUrl) ||
    Boolean(mohaPublic.instagramUrl);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="group">
            <p className="text-xs font-bold tracking-[0.32em] text-rose-500">
              MOHA
            </p>

            <p className="mt-1 text-sm font-semibold text-stone-900">
              Nail Parlour
            </p>
          </Link>

          <Link
            href="/book"
            className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Book now
          </Link>
        </div>
      </header>

      <section className="border-b border-stone-200">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-bold tracking-[0.15em] text-rose-700">
              <Sparkles className="h-3.5 w-3.5" />
              MOHA NAIL PARLOUR
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[0.98] tracking-tight md:text-7xl">
              {mohaPublic.heroTitle}
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-stone-600">
              {mohaPublic.heroDescription}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3.5 font-semibold text-white transition hover:bg-rose-400"
              >
                Request an appointment
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3.5 font-semibold text-stone-800 transition hover:bg-stone-100"
              >
                View services
              </a>
            </div>

            <div className="mt-12 grid max-w-xl gap-3 sm:grid-cols-3">
              <HeroDetail
                icon={<CalendarDays className="h-4 w-4" />}
                title="Easy requests"
                description="Choose your preferred date and time"
              />

              <HeroDetail
                icon={<Sparkles className="h-4 w-4" />}
                title="Your style"
                description="Choose a service and preferred technician"
              />

              <HeroDetail
                icon={<Clock3 className="h-4 w-4" />}
                title="MOHA confirms"
                description="We review availability before confirming"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 p-7 text-white shadow-2xl">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />

            <div className="relative">
              <p className="text-xs font-bold tracking-[0.26em] text-rose-300">
                MOHA SIGNATURE
              </p>

              <h2 className="mt-4 text-3xl font-bold leading-tight">
                Made for your next favourite nail set.
              </h2>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold text-rose-200">
                  Booking is simple
                </p>

                <ol className="mt-4 space-y-4 text-sm text-stone-300">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                      1
                    </span>
                    Select your preferred service.
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                      2
                    </span>
                    Pick a date, time, and technician.
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                      3
                    </span>
                    MOHA confirms your appointment.
                  </li>
                </ol>
              </div>

              <Link
                href="/book"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-semibold text-stone-950 transition hover:bg-rose-50"
              >
                Book with MOHA
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-rose-500">
              SERVICE MENU
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              Find your next set.
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-stone-600">
              Choose from MOHA&apos;s current nail services. Prices and
              availability update directly from our booking system.
            </p>
          </div>

          <Link
            href="/book"
            className="inline-flex w-fit items-center gap-2 font-semibold text-rose-600 transition hover:text-rose-500"
          >
            Request an appointment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {!services?.length ? (
          <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold">
              MOHA service menu is being updated.
            </p>

            <p className="mt-2 text-sm text-stone-500">
              Please contact MOHA directly for the latest services.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const image = mohaPublic.serviceImages[service.name];

              return (
                <article
                  key={service.id}
                  className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-rose-100 via-stone-100 to-fuchsia-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={service.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-end p-5">
                        <div className="rounded-2xl bg-white/80 px-4 py-3 backdrop-blur">
                          <p className="text-xs font-bold tracking-[0.2em] text-rose-500">
                            MOHA
                          </p>

                          <p className="mt-1 text-sm font-semibold text-stone-800">
                            Service photo coming soon
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {service.category ? (
                          <p className="text-xs font-bold tracking-[0.16em] text-rose-500">
                            {service.category.toUpperCase()}
                          </p>
                        ) : null}

                        <h3 className="mt-2 text-xl font-bold">
                          {service.name}
                        </h3>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-stone-900">
                        KSh {service.price_kes.toLocaleString()}
                      </p>
                    </div>

                    {service.description ? (
                      <p className="mt-4 min-h-12 text-sm leading-6 text-stone-600">
                        {service.description}
                      </p>
                    ) : (
                      <p className="mt-4 min-h-12 text-sm leading-6 text-stone-400">
                        A MOHA nail service made for your style.
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                      <p className="text-sm text-stone-500">
                        {service.duration_minutes} min
                      </p>

                      <Link
                        href="/book"
                        className="text-sm font-semibold text-rose-600 transition hover:text-rose-500"
                      >
                        Book this service
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {mohaPublic.featuredLooks.length > 0 ? (
        <section className="bg-stone-950 py-20 text-white md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-bold tracking-[0.25em] text-rose-300">
              MOHA LOOKS
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              Recent sets from MOHA.
            </h2>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {mohaPublic.featuredLooks.map((look) => (
                <article
                  key={look.image}
                  className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-stone-800"
                >
                  <Image
                    src={look.image}
                    alt={look.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6">
                    <p className="text-xl font-bold">{look.title}</p>

                    {look.subtitle ? (
                      <p className="mt-1 text-sm text-stone-200">
                        {look.subtitle}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="grid gap-8 rounded-[2rem] bg-rose-50 p-7 md:p-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-rose-500">
              VISIT MOHA
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              Your next appointment starts here.
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-stone-600">
              Request a time that works for you. MOHA will review the booking
              and confirm it directly before your appointment.
            </p>

            <Link
              href="/book"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-3.5 font-semibold text-white transition hover:bg-stone-800"
            >
              Request an appointment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex gap-4">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-rose-500" />

              <div>
                <p className="font-bold">Location</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {mohaPublic.locationName}
                </p>
                <p className="text-sm leading-6 text-stone-500">
                  {mohaPublic.locationDetail}
                </p>

                {mohaPublic.mapsUrl ? (
                  <a
                    href={mohaPublic.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-semibold text-rose-600 transition hover:text-rose-500"
                  >
                    Open in Google Maps ↗
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-6 border-t border-stone-100 pt-6">
              <div className="flex gap-4">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-rose-500" />

                <div>
                  <p className="font-bold">Contact</p>

                  {mohaPublic.phoneE164 ? (
                    <a
                      href={`tel:+${mohaPublic.phoneE164.replace(/[^\d]/g, "")}`}
                      className="mt-1 block text-sm text-stone-600 transition hover:text-rose-600"
                    >
                      {mohaPublic.phoneDisplay}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-stone-500">
                      Contact details coming soon.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {hasContactDetails ? (
              <div className="mt-6 flex flex-wrap gap-3 border-t border-stone-100 pt-6">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                ) : null}

                {mohaPublic.instagramUrl ? (
                  <a
                    href={mohaPublic.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
                  >
                    <InstagramIcon className="h-4 w-4" />
                    Instagram
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-6 py-8 text-sm text-stone-500 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} MOHA Nail Parlour. All rights reserved.
          </p>

          <Link
            href="/book"
            className="font-semibold text-rose-600 transition hover:text-rose-500"
          >
            Book an appointment
          </Link>
        </div>
      </footer>
    </main>
  );
}

function HeroDetail({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="text-rose-500">{icon}</div>
      <p className="mt-3 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
    </div>
  );
}

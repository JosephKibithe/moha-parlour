import Image from "next/image";
import Link from "next/link";
import type { ReactNode, ComponentPropsWithoutRef } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import { MohaMosaic } from "@/components/public/moha-mosaic";
import { mohaPublic } from "@/lib/moha-public";
import { createClient } from "@/lib/supabase/server";

function Instagram({ className, ...props }: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-instagram ${className || ""}`}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function formatBusinessTime(value: string | null) {
  if (!value) return "";

  const [hourText, minuteText] = value.slice(0, 5).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export default async function Home() {
  const supabase = await createClient();

  const [
    { data: services, error: servicesError },
    { data: businessHours, error: businessHoursError },
    { data: siteImages, error: siteImagesError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select(
        "id, name, category, description, price_kes, duration_minutes, display_order",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(6),

    supabase
      .from("business_hours")
      .select("day_of_week, is_open, opens_at, closes_at")
      .order("day_of_week", { ascending: true }),
    supabase
      .from("site_images")
      .select(
        `
      id,
      placement,
      service_id,
      storage_path,
      title,
      subtitle,
      alt_text,
      sort_order
    `,
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (servicesError) {
    console.error(
      "Could not load public MOHA services:",
      servicesError.message,
    );
  }

  if (businessHoursError) {
    console.error(
      "Could not load public MOHA business hours:",
      businessHoursError.message,
    );
  }
  if (siteImagesError) {
    console.error(
      "Could not load MOHA website images:",
      siteImagesError.message,
    );
  }

  const publicSiteImages = (siteImages ?? []).map((image) => {
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("moha-site-media")
      .getPublicUrl(image.storage_path);

    return {
      ...image,
      publicUrl,
    };
  });

  const galleryImages = publicSiteImages.filter(
    (image) => image.placement === "gallery",
  );

  const serviceImagesByServiceId = new Map(
    publicSiteImages
      .filter((image) => image.placement === "service" && image.service_id)
      .map((image) => [image.service_id!, image]),
  );

  const photoSources = Array.from(
    new Set(
      [
        ...mohaPublic.featuredLooks.map((look) => look.image),
        ...Object.values(mohaPublic.serviceImages),
      ].filter(Boolean),
    ),
  );

  const whatsappUrl = mohaPublic.phoneE164
    ? `https://wa.me/${mohaPublic.phoneE164.replace(/[^\d]/g, "")}`
    : null;

  const callUrl = mohaPublic.phoneE164
    ? `tel:+${mohaPublic.phoneE164.replace(/[^\d]/g, "")}`
    : null;

  return (
    <main className="moha-editorial min-h-screen overflow-x-clip bg-[#0d0c0e] text-[#f7f3ef]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d0c0e]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="group">
            <p className="text-xs font-bold tracking-[0.32em] text-[#d97b98]">
              MOHA
            </p>

            <p className="mt-1 text-sm font-medium text-white/80 transition group-hover:text-white">
              Nail Parlour
            </p>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
            <a href="#mood" className="transition hover:text-white">
              The MOHA mood
            </a>

            <a href="#services" className="transition hover:text-white">
              Services
            </a>

            <a href="#visit" className="transition hover:text-white">
              Visit us
            </a>
          </nav>

          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-full border border-[#d97b98] bg-[#d97b98] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#f0a1ba] hover:bg-[#f0a1ba]"
          >
            Book your set
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#7a334b]/35 blur-[140px]" />

        <div className="mx-auto grid min-h-[calc(100svh-73px)] max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-[minmax(0,0.95fr)_minmax(430px,0.85fr)] lg:px-10">
          <div className="order-2 lg:order-1">
            <div className="moha-hero-reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-[0.14em] text-[#efb0c4]">
              <Sparkles className="h-3.5 w-3.5" />
              MOHA NAIL PARLOUR
            </div>

            <h1 className="moha-display moha-hero-reveal mt-7 max-w-3xl text-6xl leading-[0.84] tracking-[-0.055em] sm:text-7xl lg:text-[6.8rem]">
              Nails that
              <br />
              feel <span className="italic text-[#efb0c4]">like you.</span>
            </h1>

            <p className="moha-hero-reveal mt-8 max-w-xl text-lg leading-8 text-white/65">
              Clean details. Soft glam. Statement sets. MOHA creates nail looks
              made for your moment, your mood, and your next favourite photo.
            </p>

            <div className="moha-hero-reveal mt-10 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-full bg-[#f7f3ef] px-5 py-3.5 font-semibold text-[#141014] transition hover:bg-[#efb0c4]"
              >
                Request an appointment
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3.5 font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Explore services
              </a>
            </div>

            <div className="moha-hero-reveal mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
              <HeroDetail
                icon={<CalendarDays className="h-4 w-4" />}
                title="Choose your time"
                description="Send a preferred date and time."
              />

              <HeroDetail
                icon={<Sparkles className="h-4 w-4" />}
                title="Choose your style"
                description="Select your preferred service."
              />

              <HeroDetail
                icon={<Clock3 className="h-4 w-4" />}
                title="MOHA confirms"
                description="We review your request first."
              />
            </div>
          </div>

          <div className="order-1 moha-mosaic-reveal lg:order-2">
            <MohaMosaic images={photoSources} />
          </div>
        </div>
      </section>

      <section
        id="mood"
        className="border-y border-white/10 bg-[#121014] py-20 sm:py-28"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-10">
          <div>
            <p className="text-xs font-bold tracking-[0.27em] text-[#d97b98]">
              THE MOHA MOOD
            </p>

            <h2 className="moha-display mt-5 max-w-md text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl">
              Your set should feel like a whole mood.
            </h2>
          </div>

          <div className="max-w-2xl">
            <p className="text-xl leading-8 text-white/70">
              From clean natural finishes to full glam details, every MOHA
              appointment starts with your style and ends with a set you want to
              show off.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "Soft glam",
                "French tips",
                "Chrome",
                "Acrylic sets",
                "Minimal details",
                "Nail art",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/75"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.27em] text-[#d97b98]">
              SERVICE MENU
            </p>

            <h2 className="moha-display mt-5 text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl">
              Find your next set.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-white/60">
              Current MOHA services, live prices, and appointment duration —
              pulled directly from our booking system.
            </p>
          </div>

          <Link
            href="/book"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:border-[#efb0c4] hover:bg-white/10"
          >
            Request an appointment
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {!services?.length ? (
          <div className="mt-12 rounded-[2rem] border border-dashed border-white/20 bg-white/5 p-10 text-center">
            <p className="text-lg font-semibold">
              MOHA service menu is updating.
            </p>

            <p className="mt-2 text-sm text-white/60">
              Please contact MOHA directly for the latest available services.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const serviceImage = serviceImagesByServiceId.get(service.id);
              return (
                <article
                  key={service.id}
                  className="group relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#161217] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d97b98]/70 hover:bg-[#20141b]"
                >
                  {serviceImage ? (
                    <div className="relative -mx-6 -mt-6 mb-6 aspect-[4/3] overflow-hidden">
                      <img
                        src={serviceImage.publicUrl}
                        alt={serviceImage.alt_text}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#161217] via-transparent to-transparent" />
                    </div>
                  ) : null}

                  <p className="absolute right-6 top-5 text-5xl font-semibold tracking-[-0.08em] text-white/[0.04]">
                    0{index + 1}
                  </p>

                  {service.category ? (
                    <p className="text-xs font-bold tracking-[0.18em] text-[#d97b98]">
                      {service.category.toUpperCase()}
                    </p>
                  ) : (
                    <p className="text-xs font-bold tracking-[0.18em] text-[#d97b98]">
                      MOHA SERVICE
                    </p>
                  )}

                  <h3 className="moha-display mt-5 text-3xl leading-none tracking-[-0.035em]">
                    {service.name}
                  </h3>

                  <p className="mt-5 min-h-14 text-sm leading-6 text-white/60">
                    {service.description ||
                      "A polished MOHA service designed around your style."}
                  </p>

                  <div className="mt-8 flex items-end justify-between border-t border-white/10 pt-5">
                    <div>
                      <p className="text-xl font-semibold text-white">
                        KSh {service.price_kes.toLocaleString()}
                      </p>

                      <p className="mt-1 text-sm text-white/45">
                        {service.duration_minutes} min
                      </p>
                    </div>

                    <Link
                      href="/book"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition group-hover:border-[#efb0c4] group-hover:bg-[#efb0c4] group-hover:text-[#141014]"
                      aria-label={`Book ${service.name}`}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {galleryImages.length > 0 ? (
        <section className="border-y border-white/10 bg-[#121014] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold tracking-[0.27em] text-[#d97b98]">
                  RECENT SETS
                </p>

                <h2 className="moha-display mt-5 text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl">
                  Fresh from MOHA.
                </h2>
              </div>

              <Link
                href="/book"
                className="inline-flex w-fit items-center gap-2 font-semibold text-[#efb0c4] transition hover:text-white"
              >
                Book a similar set
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((image) => (
                <article
                  key={image.id}
                  className="group relative aspect-[4/5] overflow-hidden rounded-[1.8rem] bg-[#20141b]"
                >
                  <img
                    src={image.publicUrl}
                    alt={image.alt_text}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-xs font-bold tracking-[0.16em] text-[#efb0c4]">
                      MOHA LOOK
                    </p>

                    <h3 className="moha-display mt-3 text-3xl leading-none">
                      {image.title}
                    </h3>

                    {image.subtitle ? (
                      <p className="mt-2 text-sm text-white/70">
                        {image.subtitle}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section
        id="visit"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#181318] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 sm:p-12">
            <p className="text-xs font-bold tracking-[0.27em] text-[#d97b98]">
              VISIT MOHA
            </p>

            <h2 className="moha-display mt-5 max-w-xl text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl">
              Your next favourite set starts here.
            </h2>

            <p className="mt-6 max-w-xl leading-7 text-white/65">
              Choose your preferred service, technician, date, and time. MOHA
              reviews each request before confirming your appointment.
            </p>

            <Link
              href="/book"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#d97b98] px-5 py-3.5 font-semibold text-white transition hover:bg-[#efb0c4] hover:text-[#141014]"
            >
              Request an appointment
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border-t border-white/10 bg-[#111013] p-8 sm:p-12 lg:border-l lg:border-t-0">
            <div className="flex gap-4">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#d97b98]" />

              <div>
                <p className="font-semibold text-white">Location</p>

                <p className="mt-2 text-sm leading-6 text-white/70">
                  {mohaPublic.locationName}
                </p>

                <p className="text-sm leading-6 text-white/45">
                  {mohaPublic.locationDetail}
                </p>

                {mohaPublic.mapsUrl ? (
                  <a
                    href={mohaPublic.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#efb0c4] transition hover:text-white"
                  >
                    Open in Maps
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-8">
              <div className="flex gap-4">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-[#d97b98]" />

                <div>
                  <p className="font-semibold text-white">Contact MOHA</p>

                  {callUrl ? (
                    <a
                      href={callUrl}
                      className="mt-2 block text-sm text-white/70 transition hover:text-[#efb0c4]"
                    >
                      {mohaPublic.phoneDisplay}
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-white/45">
                      Contact details coming soon.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-8">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f7f3ef] px-4 py-2.5 text-sm font-semibold text-[#141014] transition hover:bg-[#efb0c4]"
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
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#efb0c4] hover:bg-white/10"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              ) : null}
            </div>

            <div className="mt-8 border-t border-white/10 pt-8">
              <p className="text-xs font-bold tracking-[0.18em] text-white/40">
                OPENING HOURS
              </p>

              <div className="mt-4 space-y-2 text-sm">
                {businessHours?.map((hours) => (
                  <div
                    key={hours.day_of_week}
                    className="flex justify-between gap-4 text-white/65"
                  >
                    <span>
                      {
                        [
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ][hours.day_of_week]
                      }
                    </span>

                    <span className="text-right">
                      {hours.is_open
                        ? `${formatBusinessTime(hours.opens_at)} – ${formatBusinessTime(hours.closes_at)}`
                        : "Closed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-8 text-sm text-white/45 sm:flex-row sm:items-center sm:px-8 lg:px-10">
          <p>
            © {new Date().getFullYear()} {mohaPublic.label}. All rights
            reserved.
          </p>

          <Link
            href="/book"
            className="font-semibold text-[#efb0c4] transition hover:text-white"
          >
            Book your set
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

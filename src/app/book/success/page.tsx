import Link from "next/link";
import { ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";
import {
  BookingConfirmationCard,
  type BookingConfirmationDetails,
} from "@/components/public/booking-confirmation-card";
import { MohaPublicHeader } from "@/components/public/moha-public-header";
import { mohaPublic } from "@/lib/moha-public";
import { createClient } from "@/lib/supabase/server";

type SuccessPageProps = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function BookingSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { id } = await searchParams;
  const supabase = await createClient();

  let confirmationDetails: BookingConfirmationDetails | null = null;

  if (id) {
    const { data: aptData } = await supabase
      .from("appointments")
      .select(
        "id, appointment_start, appointment_end, customer_name, service_id, staff_id",
      )
      .eq("id", id)
      .maybeSingle();

    if (aptData) {
      const [serviceRes, staffRes] = await Promise.all([
        supabase
          .from("services")
          .select("name, price_kes, duration_minutes")
          .eq("id", aptData.service_id)
          .maybeSingle(),
        aptData.staff_id
          ? supabase
              .from("staff")
              .select("full_name")
              .eq("id", aptData.staff_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      confirmationDetails = {
        id: aptData.id,
        clientName: aptData.customer_name || "there",
        serviceName: serviceRes.data?.name || "Nail pampering session",
        servicePrice: serviceRes.data?.price_kes,
        serviceDuration: serviceRes.data?.duration_minutes,
        appointmentStart: aptData.appointment_start,
        appointmentEnd: aptData.appointment_end,
        technicianName:
          staffRes.data?.full_name ?? "First available MOHA stylist",
      };
    }
  }

  const clientName = confirmationDetails?.clientName ?? "Gorgeous";
  const whatsappUrl = mohaPublic.phoneE164
    ? `https://wa.me/${mohaPublic.phoneE164.replace(/[^\d]/g, "")}`
    : null;

  return (
    <main className="moha-editorial min-h-screen overflow-x-clip bg-[#0d0c0e] text-[#f7f3ef]">
      <MohaPublicHeader bookCtaLabel="Book another set" />

      <section className="relative isolate overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#7a334b]/35 blur-[140px]" />

        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 md:py-20 lg:px-10">
          <div className="moha-hero-reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-[0.14em] text-[#efb0c4]">
            <Sparkles className="h-3.5 w-3.5" />
            REQUEST RECEIVED
          </div>

          <h1 className="moha-display moha-hero-reveal mt-6 text-5xl leading-[0.9] tracking-[-0.045em] sm:text-6xl">
            We can&apos;t wait to
            <br />
            <span className="italic text-[#efb0c4]">pamper you.</span>
          </h1>

          <p className="moha-hero-reveal mt-6 max-w-2xl text-lg leading-8 text-white/60">
            Thank you,{" "}
            <span className="font-semibold text-white">{clientName}</span>. Your
            booking request is safely with MOHA. We&apos;ll review your
            preferred time and reach out shortly to confirm your session.
          </p>

          {confirmationDetails ? (
            <div className="mt-10">
              <BookingConfirmationCard details={confirmationDetails} />
            </div>
          ) : (
            <div className="moha-booking-card-reveal mt-10 rounded-[1.8rem] border border-dashed border-white/20 bg-white/5 p-8 text-center">
              <p className="text-lg font-semibold text-white">
                Your request was received.
              </p>

              <p className="mt-2 text-sm leading-6 text-white/55">
                MOHA will contact you shortly to confirm your appointment
                details.
              </p>
            </div>
          )}

          <div className="moha-hero-reveal mt-8 rounded-[1.8rem] border border-white/10 bg-[#161217] p-6 sm:p-7">
            <h2 className="text-xs font-bold tracking-[0.2em] text-[#d97b98]">
              WHAT HAPPENS NEXT
            </h2>

            <ol className="mt-5 space-y-4 text-sm leading-6 text-white/60">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d97b98]/40 text-xs font-bold text-[#efb0c4]">
                  1
                </span>
                <span>
                  <strong className="text-white">Availability check.</strong>{" "}
                  We review your stylist choice and preferred time slot right
                  away.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d97b98]/40 text-xs font-bold text-[#efb0c4]">
                  2
                </span>
                <span>
                  <strong className="text-white">Confirmation message.</strong>{" "}
                  You&apos;ll get an SMS or WhatsApp from MOHA once your
                  appointment is approved.
                </span>
              </li>

              <li className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d97b98]/40 text-xs font-bold text-[#efb0c4]">
                  3
                </span>
                <span>
                  <strong className="text-white">Bring your inspo.</strong>{" "}
                  Save nail shape and art references to show your technician
                  when you arrive.
                </span>
              </li>
            </ol>
          </div>

          <div className="moha-hero-reveal mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7f3ef] px-5 py-3.5 font-semibold text-[#141014] transition hover:bg-[#efb0c4]"
            >
              Back to home
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3.5 font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Book another session
            </Link>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d97b98]/40 px-5 py-3.5 font-semibold text-[#efb0c4] transition hover:border-[#efb0c4] hover:bg-[#d97b98]/10"
              >
                <MessageCircle className="h-4 w-4" />
                Message MOHA
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

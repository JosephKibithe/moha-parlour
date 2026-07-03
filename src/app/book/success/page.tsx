import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatNairobiDate, formatNairobiTime } from "@/lib/moha-time";

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

  let appointment: any = null;
  let service: any = null;
  let technician: any = null;

  if (id) {
    const { data: aptData } = await supabase
      .from("appointments")
      .select("id, appointment_start, appointment_end, customer_name, service_id, staff_id")
      .eq("id", id)
      .maybeSingle();

    if (aptData) {
      appointment = aptData;

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

      service = serviceRes.data;
      technician = staffRes.data;
    }
  }

  const clientName = appointment?.customer_name || "Gorgeous";
  const serviceName = service?.name || "Nail pampering session";
  const servicePrice = service?.price_kes;
  const serviceDuration = service?.duration_minutes;
  const techName = technician?.full_name ?? "First available MOHA stylist";

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-12 text-stone-900">
      <section className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-stone-200/50 md:p-12">
        
        {/* Cute Icon Header */}
        <div className="flex justify-center gap-2 text-4xl animate-bounce">
          <span>🎉</span>
          <span>💅</span>
          <span>✨</span>
        </div>

        <p className="mt-6 text-xs font-bold tracking-[0.3em] text-rose-500">
          MOHA NAIL PARLOUR
        </p>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 md:text-4xl">
          We can't wait to pamper you!
        </h1>

        <p className="mt-5 text-base leading-7 text-stone-600">
          Yay, <span className="font-bold text-stone-900">{clientName}</span>! Your booking request is safely in our hands. Our team is double-checking our calendars, and we will text or WhatsApp you shortly to lock in your session. Get ready to show your nails some serious love! 💕
        </p>

        {appointment ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-rose-100 bg-rose-50/30 p-6 text-left shadow-sm">
            <h2 className="text-xs font-bold tracking-wider text-rose-600 uppercase">
              Your Booking Summary
            </h2>
            
            <div className="mt-4 space-y-4 text-sm divide-y divide-rose-100/50">
              
              {/* Service & Price */}
              <div className="flex justify-between items-start pt-1">
                <div>
                  <p className="font-bold text-stone-900">{serviceName}</p>
                  {serviceDuration ? (
                    <p className="text-xs text-stone-500 mt-0.5">{serviceDuration} mins of bliss</p>
                  ) : null}
                </div>
                {servicePrice ? (
                  <span className="font-bold text-rose-600 shrink-0">
                    KES {servicePrice.toLocaleString()}
                  </span>
                ) : null}
              </div>

              {/* Date & Time */}
              <div className="pt-4">
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">When</p>
                <p className="font-bold text-stone-900 mt-1">
                  {formatNairobiDate(appointment.appointment_start)}
                </p>
                <p className="text-stone-600 mt-0.5">
                  at {formatNairobiTime(appointment.appointment_start)} to {formatNairobiTime(appointment.appointment_end)}
                </p>
              </div>

              {/* Technician */}
              <div className="pt-4">
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Stylist</p>
                <p className="font-bold text-stone-900 mt-1">
                  {techName}
                </p>
              </div>

            </div>
          </div>
        ) : null}

        {/* Next Steps Section */}
        <div className="mt-8 rounded-2xl bg-stone-50 p-6 text-left border border-stone-200/60">
          <h3 className="font-bold text-stone-900 text-sm">🌸 What happens next?</h3>
          <ul className="mt-3 space-y-3 text-xs leading-6 text-stone-600">
            <li className="flex gap-2.5">
              <span className="text-rose-500 shrink-0">1.</span>
              <span><strong>Availability Check:</strong> We review your stylist choice and time slot immediately.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="text-rose-500 shrink-0">2.</span>
              <span><strong>Confirmation Alert:</strong> You will get an SMS or WhatsApp message from MOHA once it's approved.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="text-rose-500 shrink-0">3.</span>
              <span><strong>Nail Inspiration:</strong> Take screenshot ideas of shapes and art to show your technician when you arrive! 📸</span>
            </li>
          </ul>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-stone-950 px-6 py-3 font-semibold text-white transition hover:bg-stone-800 text-sm shadow-md shadow-stone-900/10"
          >
            Back to Home 🏠
          </Link>

          <Link
            href="/book"
            className="rounded-xl border border-stone-300 px-6 py-3 font-semibold text-stone-800 transition hover:bg-stone-50 text-sm"
          >
            Book Another Session 🌸
          </Link>
        </div>

      </section>
    </main>
  );
}

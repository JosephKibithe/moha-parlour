import type { ReactNode } from "react";
import {
  CalendarDays,
  Clock3,
  Sparkles,
  UserRound,
} from "lucide-react";
import { formatNairobiDate, formatNairobiTime } from "@/lib/moha-time";
import { mohaPublic } from "@/lib/moha-public";

export type BookingConfirmationDetails = {
  id: string;
  clientName: string;
  serviceName: string;
  servicePrice?: number;
  serviceDuration?: number;
  appointmentStart: string;
  appointmentEnd: string;
  technicianName: string;
};

export function BookingConfirmationCard({
  details,
}: {
  details: BookingConfirmationDetails;
}) {
  const reference = details.id.slice(0, 8).toUpperCase();

  return (
    <article className="moha-booking-card-reveal relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#161217] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_20%_0%,rgba(217,123,152,0.45),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(239,176,196,0.25),transparent_45%)]" />

      <div className="relative border-b border-dashed border-white/15 px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.28em] text-[#d97b98]">
              {mohaPublic.label}
            </p>

            <h2 className="moha-display mt-3 text-4xl leading-[0.92] tracking-[-0.04em] text-white sm:text-[2.75rem]">
              Your booking
              <br />
              <span className="italic text-[#efb0c4]">request</span>
            </h2>
          </div>

          <span className="shrink-0 rounded-full border border-[#efb0c4]/30 bg-[#efb0c4]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#efb0c4]">
            Pending
          </span>
        </div>

        <p className="mt-5 text-sm leading-6 text-white/55">
          Hi{" "}
          <span className="font-semibold text-white">{details.clientName}</span>
          , your preferred appointment is saved. MOHA will confirm availability
          with you shortly.
        </p>
      </div>

      <div className="relative space-y-5 px-6 py-7 sm:px-8">
        <div className="rounded-[1.4rem] border border-white/10 bg-[#111013] p-5">
          <p className="text-xs font-bold tracking-[0.18em] text-white/40">
            SERVICE
          </p>

          <p className="moha-display mt-2 text-3xl leading-none tracking-[-0.03em] text-white">
            {details.serviceName}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {details.servicePrice ? (
              <span className="rounded-full border border-[#d97b98]/35 bg-[#d97b98]/10 px-3 py-1 font-semibold text-[#efb0c4]">
                KSh {details.servicePrice.toLocaleString()}
              </span>
            ) : null}

            {details.serviceDuration ? (
              <span className="text-white/50">
                {details.serviceDuration} min session
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ConfirmationDetail
            icon={<CalendarDays className="h-4 w-4" />}
            label="Date"
            value={formatNairobiDate(details.appointmentStart)}
          />

          <ConfirmationDetail
            icon={<Clock3 className="h-4 w-4" />}
            label="Time"
            value={`${formatNairobiTime(details.appointmentStart)} – ${formatNairobiTime(details.appointmentEnd)}`}
          />

          <ConfirmationDetail
            icon={<UserRound className="h-4 w-4" />}
            label="Stylist"
            value={details.technicianName}
            className="sm:col-span-2"
          />
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-4 border-t border-white/10 bg-[#121014] px-6 py-5 sm:px-8">
        <div className="flex items-center gap-2 text-xs text-white/45">
          <Sparkles className="h-3.5 w-3.5 text-[#d97b98]" />
          <span>Ref {reference}</span>
        </div>

        <p className="text-right text-xs leading-5 text-white/45">
          Awaiting MOHA confirmation
        </p>
      </div>
    </article>
  );
}

function ConfirmationDetail({
  icon,
  label,
  value,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4 ${className}`}
    >
      <div className="flex items-center gap-2 text-[#d97b98]">
        {icon}
        <p className="text-[11px] font-bold tracking-[0.16em] text-white/40">
          {label.toUpperCase()}
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold leading-6 text-white">{value}</p>
    </div>
  );
}

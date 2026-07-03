"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isValidNairobiDate, toNairobiDateTime } from "@/lib/moha-time";
import { createClient } from "@/lib/supabase/server";

const bookingSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().or(z.literal("")),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  clientNote: z.string().trim().max(500).optional(),
});

function bookingErrorCode(message?: string) {
  const normalized = (message ?? "").toLowerCase();

  if (normalized.includes("full name")) return "invalid-name";
  if (normalized.includes("valid phone")) return "invalid-phone";
  if (normalized.includes("service is currently unavailable")) {
    return "service-unavailable";
  }
  if (normalized.includes("technician is currently unavailable")) {
    return "technician-unavailable";
  }
  if (normalized.includes("closed on the selected day")) {
    return "closed-day";
  }
  if (normalized.includes("opening hours")) {
    return "outside-hours";
  }
  if (normalized.includes("15-minute intervals")) {
    return "invalid-time";
  }
  if (normalized.includes("future appointment")) {
    return "past-time";
  }
  if (normalized.includes("already sent a booking request")) {
    return "duplicate-request";
  }

  return "booking-failed";
}

export async function createPublicBooking(formData: FormData) {
  const parsed = bookingSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    serviceId: formData.get("serviceId"),
    staffId: formData.get("staffId"),
    appointmentDate: formData.get("appointmentDate"),
    appointmentTime: formData.get("appointmentTime"),
    clientNote: formData.get("clientNote"),
  });

  if (
    !parsed.success ||
    !isValidNairobiDate(parsed.data?.appointmentDate ?? "")
  ) {
    redirect("/book?error=invalid-details");
  }

  let appointmentStart: Date;

  try {
    appointmentStart = toNairobiDateTime(
      parsed.data.appointmentDate,
      parsed.data.appointmentTime,
    );
  } catch {
    redirect("/book?error=invalid-details");
  }

  const supabase = await createClient();

  const { data: appointmentId, error } = await supabase.rpc("create_public_booking", {
    p_salon_slug: "moha",
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone,
    p_service_id: parsed.data.serviceId,
    p_preferred_staff_id: parsed.data.staffId || null,
    p_appointment_start: appointmentStart.toISOString(),
    p_client_note: parsed.data.clientNote || null,
  });

  if (error) {
    console.error("MOHA public booking failed:", error.message);

    redirect(`/book?error=${bookingErrorCode(error.message)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/customers");

  redirect(`/book/success?id=${appointmentId}`);
}

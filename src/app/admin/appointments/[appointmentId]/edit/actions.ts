"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMohaAdmin } from "@/lib/moha-admin";
import {
  getNairobiDayOfWeek,
  isValidNairobiDate,
  toNairobiDateTime,
} from "@/lib/moha-time";
import { createClient } from "@/lib/supabase/server";

const updateAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(7).max(30),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().or(z.literal("")),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  clientNote: z.string().trim().max(500).optional(),
});

function editPath(
  appointmentId: string,
  key: "error" | "success",
  value: string,
) {
  return `/admin/appointments/${appointmentId}/edit?${key}=${value}`;
}

function schedulePath(date: string, success: string) {
  return `/admin/appointments?date=${encodeURIComponent(date)}&success=${success}`;
}

function minutesFromTime(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);

  return hours * 60 + minutes;
}

export async function updateAppointment(formData: FormData) {
  const rawAppointmentId = String(formData.get("appointmentId") ?? "");

  const validId = z.string().uuid().safeParse(rawAppointmentId);

  if (!validId.success) {
    redirect("/admin/appointments?error=invalid-appointment");
  }

  const parsed = updateAppointmentSchema.safeParse({
    appointmentId: rawAppointmentId,
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
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
    redirect(editPath(rawAppointmentId, "error", "invalid-details"));
  }

  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const { data: currentAppointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, customer_id, status")
    .eq("id", parsed.data.appointmentId)
    .eq("salon_id", salon.id)
    .maybeSingle();

  if (appointmentError || !currentAppointment) {
    redirect(editPath(parsed.data.appointmentId, "error", "not-found"));
  }

  if (
    currentAppointment.status !== "requested" &&
    currentAppointment.status !== "confirmed"
  ) {
    redirect(
      editPath(parsed.data.appointmentId, "error", "appointment-not-editable"),
    );
  }

  let appointmentStart: Date;

  try {
    appointmentStart = toNairobiDateTime(
      parsed.data.appointmentDate,
      parsed.data.appointmentTime,
    );
  } catch {
    redirect(editPath(parsed.data.appointmentId, "error", "invalid-details"));
  }

  if (appointmentStart.getTime() < Date.now() - 5 * 60 * 1000) {
    redirect(editPath(parsed.data.appointmentId, "error", "past-time"));
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", parsed.data.serviceId)
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .maybeSingle();

  if (serviceError || !service) {
    redirect(
      editPath(parsed.data.appointmentId, "error", "service-unavailable"),
    );
  }

  const appointmentEnd = new Date(
    appointmentStart.getTime() + service.duration_minutes * 60 * 1000,
  );

  const dayOfWeek = getNairobiDayOfWeek(parsed.data.appointmentDate);

  const { data: businessHours, error: businessHoursError } = await supabase
    .from("business_hours")
    .select("is_open, opens_at, closes_at")
    .eq("salon_id", salon.id)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (businessHoursError || !businessHours || !businessHours.is_open) {
    redirect(editPath(parsed.data.appointmentId, "error", "closed-day"));
  }

  const openingMinutes = minutesFromTime(businessHours.opens_at ?? "00:00");
  const closingMinutes = minutesFromTime(businessHours.closes_at ?? "00:00");
  const selectedStartMinutes = minutesFromTime(parsed.data.appointmentTime);
  const selectedEndMinutes = selectedStartMinutes + service.duration_minutes;

  if (
    selectedStartMinutes < openingMinutes ||
    selectedEndMinutes > closingMinutes
  ) {
    redirect(editPath(parsed.data.appointmentId, "error", "outside-hours"));
  }

  const staffId = parsed.data.staffId || null;

  if (staffId) {
    const { data: technician, error: technicianError } = await supabase
      .from("staff")
      .select("id")
      .eq("id", staffId)
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .maybeSingle();

    if (technicianError || !technician) {
      redirect(
        editPath(parsed.data.appointmentId, "error", "technician-unavailable"),
      );
    }

    if (currentAppointment.status === "confirmed") {
      const { data: conflict, error: conflictError } = await supabase
        .from("appointments")
        .select("id")
        .eq("salon_id", salon.id)
        .eq("staff_id", staffId)
        .neq("id", currentAppointment.id)
        .in("status", ["confirmed", "arrived", "in_service"])
        .lt("appointment_start", appointmentEnd.toISOString())
        .gt("appointment_end", appointmentStart.toISOString())
        .limit(1)
        .maybeSingle();

      if (conflictError) {
        console.error(
          "Could not check MOHA appointment clash:",
          conflictError.message,
        );

        redirect(editPath(parsed.data.appointmentId, "error", "save-failed"));
      }

      if (conflict) {
        redirect(
          editPath(parsed.data.appointmentId, "error", "technician-busy"),
        );
      }
    }
  }

  const phone = parsed.data.customerPhone.replace(/[^\d+]/g, "");

  if (phone.length < 7) {
    redirect(editPath(parsed.data.appointmentId, "error", "invalid-phone"));
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .upsert(
      {
        salon_id: salon.id,
        full_name: parsed.data.customerName,
        phone,
      },
      {
        onConflict: "salon_id,phone",
      },
    )
    .select("id")
    .single();

  if (customerError || !customer) {
    console.error("Could not update MOHA customer:", customerError?.message);

    redirect(editPath(parsed.data.appointmentId, "error", "save-failed"));
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      customer_id: customer.id,
      customer_name: parsed.data.customerName,
      customer_phone: phone,
      service_id: service.id,
      staff_id: staffId,
      appointment_start: appointmentStart.toISOString(),
      client_note: parsed.data.clientNote || null,
    })
    .eq("id", currentAppointment.id)
    .eq("salon_id", salon.id);

  if (updateError) {
    console.error("Could not update MOHA appointment:", updateError.message);

    if (updateError.code === "23P01") {
      redirect(editPath(parsed.data.appointmentId, "error", "technician-busy"));
    }

    redirect(editPath(parsed.data.appointmentId, "error", "save-failed"));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${parsed.data.appointmentId}/edit`);
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${currentAppointment.customer_id}`);
  revalidatePath(`/admin/customers/${customer.id}`);

  redirect(schedulePath(parsed.data.appointmentDate, "appointment-updated"));
}

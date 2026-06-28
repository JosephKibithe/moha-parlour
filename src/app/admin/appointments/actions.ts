"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMohaAdmin } from "@/lib/moha-admin";
import {
  getNairobiDateString,
  getNairobiDayOfWeek,
  isValidNairobiDate,
  toNairobiDateTime,
} from "@/lib/moha-time";
import { createClient } from "@/lib/supabase/server";

const appointmentSchema = z.object({
  source: z.enum(["admin", "walk_in"]),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(7).max(30),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().or(z.literal("")),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  clientNote: z.string().trim().max(500).optional(),
});

const appointmentStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  nextStatus: z.enum([
    "confirmed",
    "arrived",
    "in_service",
    "completed",
    "cancelled",
    "no_show",
  ]),
});

type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "arrived"
  | "in_service"
  | "completed"
  | "cancelled"
  | "no_show";

const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ["confirmed", "cancelled", "no_show"],
  confirmed: ["arrived", "cancelled", "no_show"],
  arrived: ["in_service", "cancelled", "no_show"],
  in_service: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

function appointmentPath(
  date: string,
  key: "error" | "success",
  value: string,
) {
  return `/admin/appointments?date=${encodeURIComponent(date)}&${key}=${encodeURIComponent(value)}`;
}

function getSafeDate(formData: FormData) {
  const date = String(formData.get("appointmentDate") ?? "");

  return isValidNairobiDate(date) ? date : getNairobiDateString();
}

function minutesFromTime(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);

  return hours * 60 + minutes;
}

export async function createAppointment(formData: FormData) {
  const parsed = appointmentSchema.safeParse({
    source: formData.get("source"),
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    serviceId: formData.get("serviceId"),
    staffId: formData.get("staffId"),
    appointmentDate: formData.get("appointmentDate"),
    appointmentTime: formData.get("appointmentTime"),
    clientNote: formData.get("clientNote"),
  });

  const selectedDate = getSafeDate(formData);

  if (!parsed.success || !isValidNairobiDate(selectedDate)) {
    redirect(appointmentPath(selectedDate, "error", "invalid-appointment"));
  }

  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const phone = parsed.data.customerPhone.replace(/[^\d+]/g, "");

  if (phone.length < 7) {
    redirect(appointmentPath(selectedDate, "error", "invalid-phone"));
  }

  const appointmentStart = toNairobiDateTime(
    selectedDate,
    parsed.data.appointmentTime,
  );

  const now = new Date();

  if (
    parsed.data.source === "admin" &&
    appointmentStart.getTime() < now.getTime() - 5 * 60 * 1000
  ) {
    redirect(appointmentPath(selectedDate, "error", "past-appointment"));
  }

  if (
    parsed.data.source === "walk_in" &&
    appointmentStart.getTime() < now.getTime() - 24 * 60 * 60 * 1000
  ) {
    redirect(appointmentPath(selectedDate, "error", "past-appointment"));
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", parsed.data.serviceId)
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .single();

  if (serviceError || !service) {
    console.error("Could not find MOHA service:", serviceError?.message);
    redirect(appointmentPath(selectedDate, "error", "service-unavailable"));
  }

  const appointmentEnd = new Date(
    appointmentStart.getTime() + service.duration_minutes * 60 * 1000,
  );

  const dayOfWeek = getNairobiDayOfWeek(selectedDate);

  const { data: businessHours, error: businessHoursError } = await supabase
    .from("business_hours")
    .select("is_open, opens_at, closes_at")
    .eq("salon_id", salon.id)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (businessHoursError || !businessHours || !businessHours.is_open) {
    redirect(appointmentPath(selectedDate, "error", "closed-day"));
  }

  const openingMinutes = minutesFromTime(businessHours.opens_at ?? "00:00");
  const closingMinutes = minutesFromTime(businessHours.closes_at ?? "00:00");
  const selectedStartMinutes = minutesFromTime(parsed.data.appointmentTime);
  const selectedEndMinutes = selectedStartMinutes + service.duration_minutes;

  if (
    selectedStartMinutes < openingMinutes ||
    selectedEndMinutes > closingMinutes
  ) {
    redirect(appointmentPath(selectedDate, "error", "outside-hours"));
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
        appointmentPath(selectedDate, "error", "technician-unavailable"),
      );
    }

    const { data: conflict, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("salon_id", salon.id)
      .eq("staff_id", staffId)
      .in("status", ["confirmed", "arrived", "in_service"])
      .lt("appointment_start", appointmentEnd.toISOString())
      .gt("appointment_end", appointmentStart.toISOString())
      .limit(1)
      .maybeSingle();

    if (conflictError) {
      console.error("Could not check booking conflict:", conflictError.message);
      redirect(appointmentPath(selectedDate, "error", "save-failed"));
    }

    if (conflict) {
      redirect(appointmentPath(selectedDate, "error", "technician-busy"));
    }
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
    console.error("Could not save MOHA customer:", customerError?.message);
    redirect(appointmentPath(selectedDate, "error", "save-failed"));
  }

  const initialStatus =
    parsed.data.source === "walk_in" ? "arrived" : "confirmed";

  const { error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      salon_id: salon.id,
      customer_id: customer.id,
      service_id: service.id,
      staff_id: staffId,
      customer_name: parsed.data.customerName,
      customer_phone: phone,
      appointment_start: appointmentStart.toISOString(),
      status: initialStatus,
      source: parsed.data.source,
      client_note: parsed.data.clientNote || null,
    });

  if (appointmentError) {
    console.error(
      "Could not create MOHA appointment:",
      appointmentError.message,
    );
    redirect(appointmentPath(selectedDate, "error", "save-failed"));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");

  redirect(appointmentPath(selectedDate, "success", "appointment-created"));
}

export async function updateAppointmentStatus(formData: FormData) {
  const parsed = appointmentStatusSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    nextStatus: formData.get("nextStatus"),
  });

  const selectedDate = getSafeDate(formData);

  if (!parsed.success) {
    redirect(appointmentPath(selectedDate, "error", "invalid-status"));
  }

  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, status, staff_id, appointment_start, appointment_end")
    .eq("id", parsed.data.appointmentId)
    .eq("salon_id", salon.id)
    .maybeSingle();

  if (appointmentError || !appointment) {
    redirect(appointmentPath(selectedDate, "error", "appointment-not-found"));
  }

  const currentStatus = appointment.status as AppointmentStatus;
  const nextStatus = parsed.data.nextStatus as AppointmentStatus;

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    redirect(appointmentPath(selectedDate, "error", "invalid-transition"));
  }

  // A public booking request does not permanently reserve a time.
  // MOHA checks availability again at the moment it is confirmed.
  if (nextStatus === "confirmed" && appointment.staff_id) {
    const { data: conflict, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("salon_id", salon.id)
      .eq("staff_id", appointment.staff_id)
      .neq("id", appointment.id)
      .in("status", ["confirmed", "arrived", "in_service"])
      .lt("appointment_start", appointment.appointment_end)
      .gt("appointment_end", appointment.appointment_start)
      .limit(1)
      .maybeSingle();

    if (conflictError) {
      console.error(
        "Could not validate appointment confirmation:",
        conflictError.message,
      );

      redirect(appointmentPath(selectedDate, "error", "save-failed"));
    }

    if (conflict) {
      redirect(appointmentPath(selectedDate, "error", "technician-busy"));
    }
  }

  const updateData: Record<string, string> = {
    status: nextStatus,
  };

  if (nextStatus === "confirmed") {
    updateData.confirmed_at = new Date().toISOString();
  }

  if (nextStatus === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", appointment.id)
    .eq("salon_id", salon.id);

  if (updateError) {
    console.error(
      "Could not update MOHA appointment status:",
      updateError.message,
    );

    redirect(appointmentPath(selectedDate, "error", "save-failed"));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/appointments");

  redirect(appointmentPath(selectedDate, "success", "status-updated"));
}

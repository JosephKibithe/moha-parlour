"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMohaAdmin } from "@/lib/moha-admin";
import { createClient } from "@/lib/supabase/server";

const technicianSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the technician's name.").max(100),
  specialty: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(300).optional(),
});

const availabilitySchema = z.object({
  technicianId: z.string().uuid(),
  nextIsActive: z.enum(["true", "false"]),
});

export async function createTechnician(formData: FormData) {
  const parsed = technicianSchema.safeParse({
    fullName: formData.get("fullName"),
    specialty: formData.get("specialty"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    redirect("/admin/staff?error=invalid-technician");
  }

  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const { data: lastTechnician, error: orderError } = await supabase
    .from("staff")
    .select("display_order")
    .eq("salon_id", salon.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    console.error("Could not find technician order:", orderError.message);
    redirect("/admin/staff?error=save-failed");
  }

  const { error } = await supabase.from("staff").insert({
    salon_id: salon.id,
    full_name: parsed.data.fullName,
    specialty: parsed.data.specialty || null,
    bio: parsed.data.bio || null,
    display_order: (lastTechnician?.display_order ?? -1) + 1,
    is_active: true,
  });

  if (error) {
    console.error("Could not create MOHA technician:", error.message);
    redirect("/admin/staff?error=save-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/staff");

  redirect("/admin/staff?success=technician-created");
}

export async function setTechnicianAvailability(formData: FormData) {
  const parsed = availabilitySchema.safeParse({
    technicianId: formData.get("technicianId"),
    nextIsActive: formData.get("nextIsActive"),
  });

  if (!parsed.success) {
    redirect("/admin/staff?error=invalid-technician");
  }

  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("staff")
    .update({
      is_active: parsed.data.nextIsActive === "true",
    })
    .eq("id", parsed.data.technicianId)
    .eq("salon_id", salon.id);

  if (error) {
    console.error("Could not update technician availability:", error.message);
    redirect("/admin/staff?error=update-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/staff");

  redirect("/admin/staff?success=availability-updated");
}

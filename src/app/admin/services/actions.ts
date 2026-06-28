"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMohaAdmin } from "@/lib/moha-admin";
import { createClient } from "@/lib/supabase/server";

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Enter a service name.").max(100),
  category: z.string().trim().max(60).optional(),
  description: z.string().trim().max(300).optional(),
  priceKes: z.coerce.number().int().min(0).max(1_000_000),
  durationMinutes: z.coerce.number().int().min(15).max(480),
});

export async function createService(formData: FormData) {
  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    priceKes: formData.get("priceKes"),
    durationMinutes: formData.get("durationMinutes"),
  });

  if (!parsed.success) {
    redirect("/admin/services?error=invalid-service");
  }

  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const { data: lastService } = await supabase
    .from("services")
    .select("display_order")
    .eq("salon_id", salon.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("services").insert({
    salon_id: salon.id,
    name: parsed.data.name,
    category: parsed.data.category || null,
    description: parsed.data.description || null,
    price_kes: parsed.data.priceKes,
    duration_minutes: parsed.data.durationMinutes,
    display_order: (lastService?.display_order ?? -1) + 1,
    is_active: true,
  });

  if (error) {
    console.error("Could not create MOHA service:", error.message);
    redirect("/admin/services?error=save-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/services");

  redirect("/admin/services?success=service-created");
}

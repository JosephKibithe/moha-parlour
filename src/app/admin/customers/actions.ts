"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMohaAdmin } from "@/lib/moha-admin";
import { createClient } from "@/lib/supabase/server";

const customerNotesSchema = z.object({
  customerId: z.string().uuid(),
  notes: z.string().trim().max(2000),
});

export async function updateCustomerNotes(formData: FormData) {
  const parsed = customerNotesSchema.safeParse({
    customerId: formData.get("customerId"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect("/admin/customers?error=invalid-customer");
  }

  const { salon } = await requireMohaAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .update({
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.customerId)
    .eq("salon_id", salon.id);

  if (error) {
    console.error("Could not update MOHA customer notes:", error.message);

    redirect(`/admin/customers/${parsed.data.customerId}?error=save-failed`);
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${parsed.data.customerId}`);

  redirect(`/admin/customers/${parsed.data.customerId}?success=notes-saved`);
}

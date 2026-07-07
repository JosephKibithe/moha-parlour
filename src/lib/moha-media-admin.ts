import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireMohaMediaAdmin() {
  const supabase = await createClient();

  const { data, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !data || !data.claims?.sub) {
    redirect("/admin/login");
  }

  const claims = data.claims;

  const { data: membership, error: membershipError } = await supabase
    .from("salon_members")
    .select(
      `
        role,
        salons (
          id,
          name,
          slug
        )
      `,
    )
    .eq("user_id", claims.sub)
    .maybeSingle();

  if (membershipError || !membership || !membership.salons) {
    redirect("/admin?error=no-media-access");
  }

  const salon = Array.isArray(membership.salons)
    ? membership.salons[0]
    : membership.salons;

  if (
    salon.slug !== "moha" ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    redirect("/admin?error=no-media-access");
  }

  return {
    salon,
    role: membership.role,
  };
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MohaAdminContext = {
  salon: {
    id: string;
    name: string;
    slug: string;
  };
  role: string;
};

export async function requireMohaAdmin(): Promise<MohaAdminContext> {
  const supabase = await createClient();

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (claimsError || !claims?.sub) {
    redirect("/admin/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("salon_members")
    .select("salon_id, role")
    .eq("user_id", claims.sub)
    .maybeSingle();

  if (membershipError || !membership) {
    console.error("MOHA membership check failed:", membershipError?.message);

    redirect("/admin/login?error=no-salon-access");
  }

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("id, name, slug")
    .eq("id", membership.salon_id)
    .single();

  if (salonError || !salon || salon.slug !== "moha") {
    console.error("MOHA salon lookup failed:", salonError?.message);

    redirect("/admin/login?error=no-salon-access");
  }

  return {
    salon,
    role: membership.role,
  };
}

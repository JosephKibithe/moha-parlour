"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getSafeAdminPath(value: FormDataEntryValue | null) {
  if (
    typeof value === "string" &&
    (value === "/admin" || value.startsWith("/admin/"))
  ) {
    return value;
  }

  return "/admin";
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=missing-fields");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !session) {
    console.error("MOHA admin login failed:", error?.message);

    redirect("/admin/login?error=login-failed");
  }

  redirect(getSafeAdminPath(formData.get("next")));
}

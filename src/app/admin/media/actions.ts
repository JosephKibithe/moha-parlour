"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMohaMediaAdmin } from "@/lib/moha-media-admin";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_BYTES = 102_400;

const imageDetailsSchema = z.object({
  imageId: z.string().uuid(),
  title: z.string().trim().min(1).max(100),
  subtitle: z.string().trim().max(100).optional(),
  altText: z.string().trim().min(3).max(160),
  isActive: z.enum(["true", "false"]),
});

function redirectToMedia(key: "success" | "error", value: string): never {
  redirect(`/admin/media?${key}=${encodeURIComponent(value)}`);
}

export async function uploadSiteImage(formData: FormData) {
  const { salon } = await requireMohaMediaAdmin();
  const supabase = await createClient();

  const placement = String(formData.get("placement") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const altText = String(formData.get("altText") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const image = formData.get("image");

  if (
    !(image instanceof File) ||
    !title ||
    !altText ||
    !["gallery", "service"].includes(placement)
  ) {
    redirectToMedia("error", "invalid-upload");
  }

  if (
    placement === "service" &&
    !z.string().uuid().safeParse(serviceId).success
  ) {
    redirectToMedia("error", "missing-service");
  }

  if (image.type !== "image/webp") {
    redirectToMedia("error", "webp-only");
  }

  if (image.size > MAX_IMAGE_BYTES) {
    redirectToMedia("error", "image-too-large");
  }

  const safePath = `${salon.slug}/${randomUUID()}.webp`;

  const { error: storageError } = await supabase.storage
    .from("moha-site-media")
    .upload(safePath, image, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "31536000",
    });

  if (storageError) {
    console.error("Could not upload MOHA site image:", storageError.message);
    redirectToMedia("error", "upload-failed");
  }

  const { data: highestImage } = await supabase
    .from("site_images")
    .select("sort_order")
    .eq("salon_id", salon.id)
    .eq("placement", placement)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: recordError } = await supabase.from("site_images").insert({
    salon_id: salon.id,
    placement,
    service_id: placement === "service" ? serviceId : null,
    storage_path: safePath,
    title,
    subtitle: subtitle || null,
    alt_text: altText,
    sort_order: (highestImage?.sort_order ?? -1) + 1,
    is_active: true,
  });

  if (recordError) {
    console.error(
      "Could not save MOHA site image record:",
      recordError.message,
    );

    await supabase.storage.from("moha-site-media").remove([safePath]);

    redirectToMedia("error", "save-failed");
  }

  revalidatePath("/");
  revalidatePath("/admin/media");

  redirectToMedia("success", "image-uploaded");
}

export async function updateSiteImage(formData: FormData) {
  const parsed = imageDetailsSchema.safeParse({
    imageId: formData.get("imageId"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    altText: formData.get("altText"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirectToMedia("error", "invalid-image-details");
  }

  const { salon } = await requireMohaMediaAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_images")
    .update({
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      alt_text: parsed.data.altText,
      is_active: parsed.data.isActive === "true",
    })
    .eq("id", parsed.data.imageId)
    .eq("salon_id", salon.id);

  if (error) {
    console.error("Could not update MOHA site image:", error.message);
    redirectToMedia("error", "update-failed");
  }

  revalidatePath("/");
  revalidatePath("/admin/media");

  redirectToMedia("success", "image-updated");
}

export async function deleteSiteImage(formData: FormData) {
  const imageId = String(formData.get("imageId") ?? "");

  if (!z.string().uuid().safeParse(imageId).success) {
    redirectToMedia("error", "invalid-image");
  }

  const { salon } = await requireMohaMediaAdmin();
  const supabase = await createClient();

  const { data: image, error: imageError } = await supabase
    .from("site_images")
    .select("id, storage_path")
    .eq("id", imageId)
    .eq("salon_id", salon.id)
    .maybeSingle();

  if (imageError || !image) {
    redirectToMedia("error", "image-not-found");
  }

  const { error: databaseError } = await supabase
    .from("site_images")
    .delete()
    .eq("id", image.id)
    .eq("salon_id", salon.id);

  if (databaseError) {
    console.error("Could not delete MOHA site image:", databaseError.message);
    redirectToMedia("error", "delete-failed");
  }

  const { error: storageError } = await supabase.storage
    .from("moha-site-media")
    .remove([image.storage_path]);

  if (storageError) {
    console.error(
      "MOHA image record removed but storage cleanup failed:",
      storageError.message,
    );
  }

  revalidatePath("/");
  revalidatePath("/admin/media");

  redirectToMedia("success", "image-deleted");
}

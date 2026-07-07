import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { requireMohaMediaAdmin } from "@/lib/moha-media-admin";
import { createClient } from "@/lib/supabase/server";
import { deleteSiteImage, updateSiteImage, uploadSiteImage } from "./actions";

type MediaPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

const errors: Record<string, string> = {
  "invalid-upload": "Complete all image details and choose a valid image.",
  "missing-service": "Choose a service for this service-card image.",
  "webp-only": "The dashboard must first convert the image to WebP.",
  "image-too-large": "The final image must stay below 100 KB.",
  "upload-failed": "The image could not be uploaded.",
  "save-failed":
    "The image uploaded but its website record could not be saved.",
  "invalid-image-details": "Check the image details and try again.",
  "update-failed": "The image details could not be updated.",
  "invalid-image": "That image is invalid.",
  "image-not-found": "That image no longer exists.",
  "delete-failed": "The image could not be deleted.",
};

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const { success, error } = await searchParams;
  const { salon } = await requireMohaMediaAdmin();
  const supabase = await createClient();

  const [
    { data: services, error: servicesError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("id, name")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true }),

    supabase
      .from("site_images")
      .select(
        `
          id,
          placement,
          service_id,
          storage_path,
          title,
          subtitle,
          alt_text,
          sort_order,
          is_active,
          created_at,
          services (
            name
          )
        `,
      )
      .eq("salon_id", salon.id)
      .order("placement", { ascending: true })
      .order("sort_order", { ascending: true }),
  ]);

  if (servicesError) {
    console.error("Could not load services for media:", servicesError.message);
  }

  if (imagesError) {
    console.error("Could not load MOHA website media:", imagesError.message);
  }

  const publicImages = (images ?? []).map((image) => {
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("moha-site-media")
      .getPublicUrl(image.storage_path);

    const service = Array.isArray(image.services)
      ? image.services[0]
      : image.services;

    return {
      ...image,
      publicUrl,
      serviceName: service?.name ?? null,
    };
  });

  return (
    <AdminShell activePage="media">
      <header className="border-b border-stone-200 pb-6">
        <Link
          href="/admin"
          className="text-sm font-medium text-stone-500 transition hover:text-stone-900"
        >
          ← Dashboard
        </Link>

        <p className="mt-6 text-xs font-bold tracking-[0.25em] text-rose-500">
          MOHA WEBSITE MEDIA
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Homepage images
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
          Add, edit, hide, or remove images shown on MOHA&apos;s public website.
          Every stored image is WebP and capped at 100 KB.
        </p>
      </header>

      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
          {success === "image-uploaded"
            ? "Image uploaded successfully."
            : success === "image-updated"
              ? "Image updated successfully."
              : "Image deleted successfully."}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-800">
          {errors[error] ?? "Something went wrong. Please try again."}
        </div>
      ) : null}

      <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-5">
          {!publicImages.length ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
              <p className="text-lg font-semibold">No website images yet.</p>

              <p className="mt-2 text-sm text-stone-500">
                Upload a gallery image or connect one to a service card.
              </p>
            </div>
          ) : (
            publicImages.map((image) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
                  <img
                    src={image.publicUrl}
                    alt={image.alt_text}
                    className="aspect-[4/5] h-full w-full object-cover"
                  />

                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        {image.placement === "gallery"
                          ? "Gallery + Hero Mosaic"
                          : "Service card"}
                      </span>

                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          image.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-stone-200 text-stone-600",
                        ].join(" ")}
                      >
                        {image.is_active ? "Live" : "Hidden"}
                      </span>

                      {image.serviceName ? (
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                          {image.serviceName}
                        </span>
                      ) : null}
                    </div>

                    <form action={updateSiteImage} className="mt-5 space-y-4">
                      <input type="hidden" name="imageId" value={image.id} />

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Title
                        </label>

                        <input
                          name="title"
                          required
                          maxLength={100}
                          defaultValue={image.title}
                          className="w-full rounded-xl border border-stone-300 px-3 py-2.5 outline-none focus:border-rose-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Subtitle
                        </label>

                        <input
                          name="subtitle"
                          maxLength={100}
                          defaultValue={image.subtitle ?? ""}
                          className="w-full rounded-xl border border-stone-300 px-3 py-2.5 outline-none focus:border-rose-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium">
                          Image description
                        </label>

                        <input
                          name="altText"
                          required
                          maxLength={160}
                          defaultValue={image.alt_text}
                          className="w-full rounded-xl border border-stone-300 px-3 py-2.5 outline-none focus:border-rose-400"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3 pt-1">
                        <button
                          type="submit"
                          name="isActive"
                          value={image.is_active ? "false" : "true"}
                          className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                        >
                          {image.is_active ? "Hide image" : "Show image"}
                        </button>

                        <button
                          type="submit"
                          name="isActive"
                          value={image.is_active ? "true" : "false"}
                          className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
                        >
                          Save text
                        </button>
                      </div>
                    </form>

                    <form action={deleteSiteImage} className="mt-3">
                      <input type="hidden" name="imageId" value={image.id} />

                      <button
                        type="submit"
                        className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                      >
                        Delete image permanently
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="h-fit">
          <MediaUploadForm
            services={services ?? []}
            uploadAction={uploadSiteImage}
          />

          <div className="mt-5 rounded-3xl border border-stone-200 bg-white p-6">
            <p className="text-xs font-bold tracking-[0.2em] text-rose-500">
              IMAGE RULES
            </p>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
              <li>Use clear nail close-ups and well-lit salon photos.</li>
              <li>Portrait photos work best for the homepage mosaic.</li>
              <li>Uploads are converted to WebP before storage.</li>
              <li>Stored file size cannot exceed 100 KB.</li>
              <li>Gallery images automatically feed the hero mosaic.</li>
            </ul>
          </div>
        </aside>
      </section>
    </AdminShell>
  );
}

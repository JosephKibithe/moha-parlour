"use client";

import { useRef, useState } from "react";

const MAX_IMAGE_BYTES = 102_400;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 1200;
const MIN_DIMENSION = 420;

type Service = {
  id: string;
  name: string;
};

type MediaUploadFormProps = {
  services: Service[];
  uploadAction: (formData: FormData) => void | Promise<void>;
};

async function compressImageToWebp(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Choose an image smaller than 10 MB before compression.");
  }

  const imageBitmap = await createImageBitmap(file);

  let width = imageBitmap.width;
  let height = imageBitmap.height;

  if (Math.max(width, height) > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);

    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not prepare this image.");
  }

  let quality = 0.88;

  while (width >= MIN_DIMENSION && height >= MIN_DIMENSION) {
    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, width, height);
    context.drawImage(imageBitmap, 0, 0, width, height);

    while (quality >= 0.3) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", quality);
      });

      if (blob && blob.size <= MAX_IMAGE_BYTES) {
        return blob;
      }

      quality -= 0.06;
    }

    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
    quality = 0.88;
  }

  throw new Error(
    "This image cannot fit below 100 KB while keeping acceptable quality. Try a simpler or smaller photo.",
  );
}

export function MediaUploadForm({
  services,
  uploadAction,
}: MediaUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [placement, setPlacement] = useState<"gallery" | "service">("gallery");
  const [message, setMessage] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const sourceFile = fileInputRef.current?.files?.[0];

    if (!sourceFile) {
      setMessage("Choose an image first.");
      return;
    }

    try {
      setIsPreparing(true);
      setMessage("Compressing image to under 100 KB...");

      const compressedBlob = await compressImageToWebp(sourceFile);

      const compressedFile = new File(
        [compressedBlob],
        `${crypto.randomUUID()}.webp`,
        { type: "image/webp" },
      );

      const formData = new FormData(form);

      formData.set("image", compressedFile);

      setMessage(
        `Ready: ${(compressedFile.size / 1024).toFixed(1)} KB. Uploading...`,
      );

      await uploadAction(formData);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Image preparation failed. Please try again.",
      );
    } finally {
      setIsPreparing(false);
    }
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
    setMessage(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-stone-950 p-6 text-white shadow-xl"
    >
      <p className="text-xs font-bold tracking-[0.25em] text-rose-400">
        ADD WEBSITE IMAGE
      </p>

      <h2 className="mt-3 text-xl font-bold">Upload image</h2>

      <p className="mt-2 text-sm leading-6 text-stone-400">
        MOHA converts uploads to WebP and stores only files below 100 KB.
      </p>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-stone-200">
          Image placement
        </label>

        <select
          name="placement"
          value={placement}
          onChange={(event) =>
            setPlacement(event.target.value as "gallery" | "service")
          }
          className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none focus:border-rose-400"
        >
          <option value="gallery">Homepage gallery + hero mosaic</option>
          <option value="service">Specific service card</option>
        </select>
      </div>

      {placement === "service" ? (
        <div className="mt-5">
          <label
            htmlFor="serviceId"
            className="mb-2 block text-sm font-medium text-stone-200"
          >
            Attach to service
          </label>

          <select
            id="serviceId"
            name="serviceId"
            required
            defaultValue=""
            className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none focus:border-rose-400"
          >
            <option value="" disabled>
              Choose a service
            </option>

            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="mt-5">
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-stone-200"
        >
          Image title
        </label>

        <input
          id="title"
          name="title"
          required
          maxLength={100}
          placeholder="e.g. Soft chrome almond"
          className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="subtitle"
          className="mb-2 block text-sm font-medium text-stone-200"
        >
          Subtitle <span className="text-stone-500">(optional)</span>
        </label>

        <input
          id="subtitle"
          name="subtitle"
          maxLength={100}
          placeholder="e.g. Acrylic extensions"
          className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="altText"
          className="mb-2 block text-sm font-medium text-stone-200"
        >
          Image description
        </label>

        <input
          id="altText"
          name="altText"
          required
          maxLength={160}
          placeholder="e.g. Glossy nude almond nails by MOHA"
          className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white outline-none placeholder:text-stone-500 focus:border-rose-400"
        />
      </div>

      <div className="mt-5">
        <label
          htmlFor="image"
          className="mb-2 block text-sm font-medium text-stone-200"
        >
          Choose image
        </label>

        <input
          ref={fileInputRef}
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={handleImageChange}
          className="block w-full rounded-xl border border-dashed border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-300 file:mr-4 file:rounded-lg file:border-0 file:bg-rose-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
      </div>

      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Image preview"
          className="mt-5 aspect-[4/5] w-full rounded-2xl object-cover"
        />
      ) : null}

      {message ? (
        <p className="mt-4 text-sm leading-6 text-rose-200">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPreparing}
        className="mt-6 w-full rounded-xl bg-rose-500 px-4 py-3 font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPreparing ? "Preparing image..." : "Upload website image"}
      </button>
    </form>
  );
}

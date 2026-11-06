import {
  IMAGE_VARIANT_QUALITY,
  IMAGE_VARIANT_WIDTHS,
  MAX_IMAGE_UPLOAD_BYTES,
  type ImageVariantWidth,
} from "./image-variants";

export async function createUploadVariants(file: File): Promise<Array<{
  width: ImageVariantWidth;
  blob: Blob;
}>> {
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Choose an image smaller than 20 MB.");
  }
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
    throw new Error("Use a JPG, PNG, WebP, or AVIF product photo.");
  }

  const image = await createImageBitmap(file);
  try {
    if (image.width * image.height > 40_000_000) {
      throw new Error("Choose an image smaller than 40 megapixels.");
    }
    const variants = [];
    for (const width of IMAGE_VARIANT_WIDTHS) {
      const scale = Math.min(1, width / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image processing is unavailable in this browser.");
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => {
          if (value?.type === "image/webp") resolve(value);
          else reject(new Error("This browser cannot create WebP images. Try an updated browser."));
        }, "image/webp", IMAGE_VARIANT_QUALITY);
      });
      variants.push({ width, blob });
      canvas.width = canvas.height = 1;
    }
    return variants;
  } finally {
    image.close();
  }
}

import {
  IMAGE_VARIANT_QUALITY,
  IMAGE_VARIANT_WIDTHS,
  MAX_IMAGE_UPLOAD_BYTES,
  type ImageVariantWidth,
} from "./image-variants";

export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.gif,.heic,.heif";

export async function prepareUploadFile(file: File): Promise<File> {
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error("Choose an image smaller than 20 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    avif: "image/avif", gif: "image/gif", svg: "image/svg+xml", heic: "image/heic", heif: "image/heif",
  };
  const type = file.type || types[extension ?? ""];
  if (!type || !Object.values(types).includes(type)) {
    throw new Error("Use a JPG, PNG, WebP, AVIF, GIF, SVG, or HEIC image.");
  }
  if (type === "image/heic" || type === "image/heif" || extension === "heic" || extension === "heif") {
    try {
      const { heicTo } = await import("heic-to/csp");
      const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
      if (jpeg.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error("Converted photo exceeds 20 MB.");
      return new File([jpeg], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
      throw new Error("This HEIC photo could not be converted. Export it as JPG and try again.");
    }
  }
  return file.type === type ? file : new File([file], file.name, { type });
}

export async function createUploadVariants(file: File): Promise<Array<{
  width: ImageVariantWidth;
  blob: Blob;
}>> {
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Choose an image smaller than 20 MB.");
  }
  // Animated GIFs and vector logos keep their original rendering.
  if (["image/gif", "image/svg+xml"].includes(file.type)) return [];
  const objectUrl = URL.createObjectURL(file);
  let bitmap: ImageBitmap | undefined;
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This image could not be decoded."));
      element.src = objectUrl;
    });
    if (image.naturalWidth * image.naturalHeight > 100_000_000) {
      throw new Error("Choose an image smaller than 100 megapixels.");
    }
    const decodeScale = Math.min(1, 1280 / image.naturalWidth, 1280 / image.naturalHeight);
    if (typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(file, {
          resizeWidth: Math.max(1, Math.round(image.naturalWidth * decodeScale)),
          resizeHeight: Math.max(1, Math.round(image.naturalHeight * decodeScale)),
          resizeQuality: "high",
        });
      } catch { /* The HTML image is a fallback for browsers with limited bitmap support. */ }
    }
    const source = bitmap ?? image;
    const sourceWidth = bitmap?.width ?? image.naturalWidth;
    const sourceHeight = bitmap?.height ?? image.naturalHeight;
    const variants = [];
    for (const width of IMAGE_VARIANT_WIDTHS) {
      const scale = Math.min(1, width / sourceWidth, 1280 / sourceHeight);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image processing is unavailable in this browser.");
      context.imageSmoothingQuality = "high";
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
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
    bitmap?.close();
    URL.revokeObjectURL(objectUrl);
  }
}

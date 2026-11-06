export const IMAGE_VARIANT_WIDTHS = [320, 640, 1280] as const;
export const IMAGE_VARIANT_QUALITY = 0.82;
export const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;

export type ImageVariantWidth = (typeof IMAGE_VARIANT_WIDTHS)[number];

export function parseImageVariantWidth(value: string | null): ImageVariantWidth | null {
  return IMAGE_VARIANT_WIDTHS.find((width) => String(width) === value) ?? null;
}

export function imageVariantPath(path: string, width: ImageVariantWidth): string {
  return `${path}.variants/${width}.webp`;
}

export function imageVariantUrl(src: string, width: ImageVariantWidth): string {
  if (!src.startsWith("/api/storage/objects/")) return src;
  const [path, query = ""] = src.split("?");
  const params = new URLSearchParams(query);
  params.set("width", String(width));
  return `${path}?${params}`;
}

export function imageVariantSrcSet(src: string): string | undefined {
  if (!src.startsWith("/api/storage/objects/")) return undefined;
  return IMAGE_VARIANT_WIDTHS.map((width) => `${imageVariantUrl(src, width)} ${width}w`).join(", ");
}

import type { SiteSettings } from "./types";

export function resolveOpenGraphImage(settings: SiteSettings): string {
  const imagePath = settings.seo?.og_image?.trim();
  if (!imagePath) return "/opengraph.jpg";
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("/api/storage/") ||
    imagePath.startsWith("/images/") ||
    imagePath === "/opengraph.jpg"
  ) {
    return imagePath;
  }

  return `/api/storage${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}

export function openGraphImages(settings: SiteSettings): { url: string }[] {
  return [{ url: resolveOpenGraphImage(settings) }];
}

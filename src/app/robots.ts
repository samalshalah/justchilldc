import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (settings.seo?.canonical_domain
      ? `https://${settings.seo.canonical_domain}`
      : "https://example.com");

  // If maintenance mode is on, block all bots while we're down
  if (settings.maintenance_mode) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/checkout",
          "/order/",
          "/sorry",
          "/dutchie-preview",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

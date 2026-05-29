import type { Metadata, Viewport } from "next";
import { preinit } from "react-dom";
import "./globals.css";
import { getSiteSettings } from "@/lib/settings";
import {
  getThemeCssVars,
  DEFAULT_THEME_CONFIG,
  type ThemeConfig,
} from "@/lib/theme";
import { DEFAULTS } from "@/lib/defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

/**
 * Root metadata. Per-page metadata via `generateMetadata` exports
 * extends/overrides this. Anything truly site-wide goes here.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = settings.seo ?? {};
  const storeName = settings.store?.name ?? DEFAULTS.storeName;
  const description = seo.meta_description ?? DEFAULTS.seoMetaDescription
    .replace("{store}", storeName)
    .replace("{city}", seo.city ?? DEFAULTS.city);

  // Build canonical site URL from deployment env first, then admin settings.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (seo.canonical_domain ? `https://${seo.canonical_domain}` : undefined);

  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: {
      default: storeName,
      template: (seo.title_template ?? "%s | " + storeName).replace(
        "{page}",
        "%s"
      ).replace("{store}", storeName).replace(
        "{city}",
        seo.city ?? DEFAULTS.city
      ),
    },
    description,
    openGraph: {
      type: "website",
      siteName: storeName,
      title: storeName,
      description,
      images: seo.og_image
        ? [{ url: `/api/storage${seo.og_image}` }]
        : [{ url: "/opengraph.jpg" }],
    },
    twitter: {
      card: "summary_large_image",
      title: storeName,
      description,
    },
    robots: seo.robots_noindex ? { index: false, follow: false } : undefined,
    verification: seo.google_site_verification
      ? { google: seo.google_site_verification }
      : undefined,
    icons: {
      icon: "/favicon.ico",
    },
  };
}

/**
 * Build the @import url() for whichever fonts the theme uses.
 * Only loads what's actually configured — saves a chunk of bytes versus
 * the legacy approach of preloading Inter on every page.
 */
function fontStylesheetUrl(theme: ThemeConfig): string {
  const families = new Set([theme.font_body, theme.font_display]);
  const params = Array.from(families)
    .map(
      (name) =>
        `family=${encodeURIComponent(name)}:wght@400;500;600;700`
    )
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const theme: ThemeConfig = {
    ...DEFAULT_THEME_CONFIG,
    ...(settings.theme_config ?? {}),
  };
  const cssVars = getThemeCssVars(theme);
  const fontUrl = fontStylesheetUrl(theme);

  // Use React's preinit to inject the Google Fonts stylesheet — this avoids
  // the hydration mismatch that occurs when a <link rel="stylesheet"> placed
  // manually in <head> JSX gets hoisted by Next.js during SSR but then
  // React tries to reconcile it in a different position on the client.
  preinit(fontUrl, { as: "style" });

  // Inline-style the CSS vars on <html> so the user sees themed HTML on
  // first paint. No flash of unstyled content. The legacy app set these
  // in a useEffect — too late.
  return (
    <html lang="en" style={cssVars as React.CSSProperties}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}

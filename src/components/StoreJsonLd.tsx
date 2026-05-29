/**
 * StoreJsonLd — emits the site-wide LocalBusiness/Store JSON-LD tag.
 *
 * Reads from settings via the SettingsProvider so client and server agree
 * on the markup. Set on every storefront page; per-page schemas
 * (Product, BreadcrumbList) are added in addition to this on those pages.
 */
"use client";

import { useSettings } from "./SettingsProvider";
import { DEFAULTS } from "@/lib/defaults";

export function StoreJsonLd() {
  const settings = useSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const seo = settings.seo ?? {};

  if (seo.auto_structured_data === false) return null;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (seo.canonical_domain ? `https://${seo.canonical_domain}` : undefined);

  const loc = settings.location;
  const phone = loc?.phone || settings.contact?.phone || settings.store?.phone;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: storeName,
    url: siteUrl,
    telephone: phone,
  };

  if (loc?.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: loc.address,
      addressLocality: loc.city ?? DEFAULTS.city,
      addressRegion: loc.state ?? DEFAULTS.state,
      postalCode: loc.zip,
      addressCountry: "US",
    };
  }

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

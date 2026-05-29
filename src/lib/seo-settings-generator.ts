import { DEFAULTS } from "./defaults";
import type { SeoConfig, SiteSettings } from "./types";

function valueOrFallback(value: string | undefined, fallback: string): string {
  const clean = value?.trim();
  return clean ? clean : fallback;
}

function cityState(city: string, state: string): string {
  if (!state || state === DEFAULTS.state) return city;
  return `${city}, ${state}`;
}

export function generateLocalSeoSettings(settings: SiteSettings): SeoConfig {
  const existing = settings.seo ?? {};
  const storeName = valueOrFallback(settings.store?.name, DEFAULTS.storeName);
  const city = valueOrFallback(
    settings.location?.city || existing.city,
    DEFAULTS.city
  );
  const state = valueOrFallback(settings.location?.state, DEFAULTS.state);
  const place = cityState(city, state);
  const storeLower =
    storeName === DEFAULTS.storeName ? "the store" : storeName;

  return {
    ...existing,
    title_template: "{page} | {store} | {city}",
    meta_description: `${storeName} is a cannabis shop in ${place} with a live menu, local product details, curated brands, pickup planning, and helpful cannabis education for adults 21+.`,
    city,
    auto_structured_data: true,
    page_home: {
      ...(existing.page_home ?? {}),
      title: `${storeName} | Cannabis Menu in ${place}`,
      description: `Browse the ${storeName} cannabis menu in ${place}. Shop live inventory by category, brand, strain type, and feel with local pickup planning for adults 21+.`,
    },
    page_shop: {
      ...(existing.page_shop ?? {}),
      title: `Shop Cannabis in ${place} | ${storeName}`,
      description: `Shop the live ${storeName} cannabis menu in ${place}. Filter products by category, brand, strain type, effect, price, and availability before pickup.`,
    },
    page_product: {
      ...(existing.page_product ?? {}),
      title: `{product} | ${storeName} ${place}`,
      description: `Shop {product}, a {strain} {category}, at ${storeLower} in ${place}. View THC/CBD, brand details, availability, and pickup information. 21+ only.`,
    },
    page_category: {
      ...(existing.page_category ?? {}),
      title: `{page} Cannabis Products | ${storeName} ${place}`,
      description: `Shop {page} products at ${storeName} in ${place}. Browse live availability, brands, strain types, prices, and pickup information.`,
    },
    page_brand: {
      ...(existing.page_brand ?? {}),
      title: `{page} Products | ${storeName} ${place}`,
      description: `Browse {page} cannabis products at ${storeName} in ${place}. Compare live menu items, categories, product details, and pickup availability.`,
    },
    page_blog: {
      ...(existing.page_blog ?? {}),
      title: `Cannabis Resources | ${storeName} ${place}`,
      description: `Read ${storeName} cannabis resources for ${place} shoppers, including menu guides, product education, pickup tips, FAQs, and local store updates.`,
    },
  };
}

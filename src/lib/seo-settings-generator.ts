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
    title_template: "{page} | {store}",
    meta_description: `${storeName} is a local cannabis dispensary in ${place}. Browse live menu items by category, brand, strain type, and feel with compliant local ordering.`,
    city,
    auto_structured_data: true,
    page_home: {
      ...(existing.page_home ?? {}),
      title: "Cannabis Dispensary in {city}",
      description: `${storeName} serves customers in ${place} with a live cannabis menu, curated products, local product information, and a simple compliant ordering experience.`,
    },
    page_shop: {
      ...(existing.page_shop ?? {}),
      title: "Cannabis Menu in {city}",
      description: `Browse the live ${storeName} cannabis menu in ${place}. Shop flower, pre-rolls, edibles, concentrates, vapes, brands, strain types, and product effects.`,
    },
    page_product: {
      ...(existing.page_product ?? {}),
      title: "{product} | {category} in {city} | {store}",
      description: `Shop {product}, a {strain} {category}, at ${storeLower} in {city}. Check product details, THC/CBD, effects, availability, and local ordering information.`,
    },
    page_category: {
      ...(existing.page_category ?? {}),
      title: "{page} in {city}",
      description: `Shop {page} products at ${storeName} in ${place}. Browse current availability, product details, prices, strain types, and local ordering information.`,
    },
    page_brand: {
      ...(existing.page_brand ?? {}),
      title: "{page} Products in {city}",
      description: `Browse {page} products available at ${storeName} in ${place}. Compare menu items, categories, product details, and live availability.`,
    },
    page_blog: {
      ...(existing.page_blog ?? {}),
      title: "Cannabis Resources in {city}",
      description: `${storeName} resources for cannabis shoppers in ${place}, including product education, local menu updates, FAQs, and store information.`,
    },
  };
}

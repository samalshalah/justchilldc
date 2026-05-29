import type { SiteSettings } from "./types";
import { DEFAULTS } from "./defaults";

export interface LocalSeoPage {
  slug: string;
  area: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: {
    heading: string;
    body: string;
  }[];
}

const AREA_NAMES = [
  "Washington, DC",
  "Shaw",
  "Logan Circle",
  "Mount Vernon Square",
  "U Street Corridor",
  "Downtown DC",
  "NoMa",
  "Dupont Circle",
  "Adams Morgan",
  "Capitol Hill",
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function storeName(settings: SiteSettings): string {
  return settings.store?.name || DEFAULTS.storeName;
}

function city(settings: SiteSettings): string {
  return settings.location?.city || settings.seo?.city || DEFAULTS.city;
}

function state(settings: SiteSettings): string {
  return settings.location?.state || DEFAULTS.state;
}

export function getLocalSeoPages(settings: SiteSettings): LocalSeoPage[] {
  const name = storeName(settings);
  const marketCity = city(settings);
  const marketState = state(settings);
  const address = settings.store?.address || settings.location?.address || "";
  const phone = settings.store?.phone || settings.location?.phone || "";
  const market = marketState ? `${marketCity}, ${marketState}` : marketCity;

  return AREA_NAMES.map((area) => {
    const areaMarket =
      area === "Washington, DC" ? "Washington, DC" : `${area}, Washington, DC`;
    return {
      slug: slugify(area),
      area,
      title: `${areaMarket} Cannabis Menu | ${name}`,
      metaDescription: `Browse the ${name} cannabis menu for ${areaMarket}. Compare products, brands, strain types, effects, and pickup details from a local Washington, DC shop.`,
      h1: `${name} Cannabis Menu Near ${area}`,
      intro: `${name} helps adults in ${areaMarket} browse a live cannabis menu before visiting the store. Use this page to review local menu categories, product details, brand availability, and pickup planning for ${market}.`,
      sections: [
        {
          heading: `Shop cannabis products near ${area}`,
          body: `Customers can browse flower, pre-rolls, edibles, concentrates, vapes, and accessories on the live ${name} menu. Product pages include category, brand, strain type, THC/CBD details when available, and current availability.`,
        },
        {
          heading: `Local pickup from ${name}`,
          body: `${address ? `${name} is located at ${address}. ` : ""}Browse online first, add items to your bag, and prepare your pickup details before you arrive. Adults must be 21+ and bring a valid government-issued ID.`,
        },
        {
          heading: `Why this page exists`,
          body: `This local resource page is built for shoppers searching from ${areaMarket}. It connects nearby customers with useful menu information, store details, and product education without adding extra navigation clutter to the main website.${phone ? ` For questions, call ${phone}.` : ""}`,
        },
      ],
    };
  });
}

export function getLocalSeoPageBySlug(
  settings: SiteSettings,
  slug: string
): LocalSeoPage | null {
  return getLocalSeoPages(settings).find((page) => page.slug === slug) ?? null;
}

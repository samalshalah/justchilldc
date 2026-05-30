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

const AREA_PROFILES = [
  {
    area: "Washington, DC",
    audience: "Washington, DC shoppers",
    travel: "from anywhere in the District",
    localNote:
      "Use this page as the main local guide for browsing the live menu before visiting the store in Northwest DC.",
  },
  {
    area: "Shaw",
    audience: "Shaw residents and visitors",
    travel: "from the Shaw neighborhood",
    localNote:
      "Shaw shoppers are close to the store, making it easy to check the menu online before planning a short visit.",
  },
  {
    area: "Logan Circle",
    audience: "Logan Circle customers",
    travel: "from Logan Circle",
    localNote:
      "Logan Circle is one of the closest nearby neighborhoods for customers comparing cannabis products before heading out.",
  },
  {
    area: "Mount Vernon Square",
    audience: "Mount Vernon Square shoppers",
    travel: "from Mount Vernon Square",
    localNote:
      "Customers near Mount Vernon Square can review current menu availability, pickup details, and store information in one place.",
  },
  {
    area: "U Street Corridor",
    audience: "U Street Corridor customers",
    travel: "from the U Street Corridor",
    localNote:
      "The U Street Corridor is a natural nearby search area for adults looking for a clear DC cannabis menu and local store details.",
  },
  {
    area: "Downtown DC",
    audience: "Downtown DC shoppers",
    travel: "from Downtown DC",
    localNote:
      "This page helps Downtown DC customers compare categories, brands, product details, and store contact information before visiting.",
  },
  {
    area: "NoMa",
    audience: "NoMa customers",
    travel: "from NoMa",
    localNote:
      "NoMa shoppers can use the live menu to compare products and plan a convenient visit to the store.",
  },
  {
    area: "Dupont Circle",
    audience: "Dupont Circle shoppers",
    travel: "from Dupont Circle",
    localNote:
      "Customers coming from Dupont Circle can browse ahead, compare product details, and confirm the store address before pickup.",
  },
  {
    area: "Adams Morgan",
    audience: "Adams Morgan customers",
    travel: "from Adams Morgan",
    localNote:
      "Adams Morgan shoppers can use this local page to explore the current menu without digging through unrelated store pages.",
  },
  {
    area: "Capitol Hill",
    audience: "Capitol Hill shoppers",
    travel: "from Capitol Hill",
    localNote:
      "Capitol Hill customers can review live inventory, product categories, and pickup planning details before crossing town.",
  },
  {
    area: "Navy Yard",
    audience: "Navy Yard shoppers",
    travel: "from Navy Yard",
    localNote:
      "This page supports Navy Yard customers who want to compare menu options before planning a visit to Northwest DC.",
  },
  {
    area: "Georgetown",
    audience: "Georgetown customers",
    travel: "from Georgetown",
    localNote:
      "Georgetown shoppers can browse the menu, confirm product details, and prepare pickup information before visiting.",
  },
  {
    area: "Columbia Heights",
    audience: "Columbia Heights shoppers",
    travel: "from Columbia Heights",
    localNote:
      "Columbia Heights customers can review product availability and store details before making a local trip.",
  },
  {
    area: "Petworth",
    audience: "Petworth customers",
    travel: "from Petworth",
    localNote:
      "Petworth shoppers can use the page to understand product categories, menu availability, and store requirements.",
  },
  {
    area: "Arlington, VA",
    audience: "Arlington customers planning a DC visit",
    travel: "from Arlington, Virginia",
    localNote:
      "For Arlington adults planning a trip into DC, this page keeps the menu, address, and age requirements easy to review.",
  },
  {
    area: "Alexandria, VA",
    audience: "Alexandria customers planning a DC visit",
    travel: "from Alexandria, Virginia",
    localNote:
      "Alexandria shoppers can compare the current DC menu before deciding whether to visit the store in Washington.",
  },
  {
    area: "Silver Spring, MD",
    audience: "Silver Spring customers planning a DC visit",
    travel: "from Silver Spring, Maryland",
    localNote:
      "Silver Spring customers can use this page to review live menu information, store contact details, and pickup planning notes.",
  },
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

  return AREA_PROFILES.map((profile) => {
    const area = profile.area;
    const areaMarket = area.includes(",")
      ? area
      : area === "Washington, DC"
      ? "Washington, DC"
      : `${area}, Washington, DC`;
    const nearbyPhrase =
      area === "Washington, DC"
        ? "in Washington, DC"
        : `near ${area}`;

    return {
      slug: slugify(area),
      area,
      title: `Cannabis Menu ${nearbyPhrase} | ${name}`,
      metaDescription: `Browse the ${name} cannabis menu ${nearbyPhrase}. Compare live categories, brands, strain types, effects, prices, and pickup planning details in Washington, DC.`,
      h1:
        area === "Washington, DC"
          ? `${name} Cannabis Menu in Washington, DC`
          : `Cannabis Menu Near ${area}`,
      intro: `${name} helps ${profile.audience} browse a live Washington, DC cannabis menu before visiting. Review categories, brands, strain types, product details, and pickup planning information for ${market}. ${profile.localNote}`,
      sections: [
        {
          heading: `Browse live cannabis products ${nearbyPhrase}`,
          body: `${name} keeps a live menu with flower, pre-rolls, edibles, concentrates, vapes, tinctures, topicals, accessories, and other available categories. Product listings include brand, category, strain type, price, availability, THC/CBD details when provided, and helpful product notes for adults 21+.`,
        },
        {
          heading: `Plan a visit ${profile.travel}`,
          body: `${address ? `${name} is located at ${address}. ` : ""}Browse online first, compare menu options, add items to your bag, and prepare your pickup details before you arrive. Adults must be 21+ and bring a valid government-issued ID.`,
        },
        {
          heading: `Product education for ${areaMarket}`,
          body: `Each product page is designed to help local shoppers compare options before checkout. You can review category information, strain type, potency details when available, brand names, effects, flavors, and related product suggestions without relying on vague menu labels.`,
        },
        {
          heading: `Local store details and age requirements`,
          body: `${name} focuses on clear local information, compliant ordering, and helpful service for Washington, DC customers and nearby visitors. Pickup availability can change as inventory changes, so always check the live menu before visiting.${phone ? ` For questions, call ${phone}.` : ""}`,
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

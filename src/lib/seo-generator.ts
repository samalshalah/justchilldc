/**
 * SEO helpers for owner-proof product and menu content.
 *
 * Store owners should not need to understand meta tags or write product copy.
 * These helpers turn normal business data into clean product names, product
 * descriptions, page titles, and category/brand fallback descriptions.
 */

import { DEFAULTS } from "./defaults";
import type { StrainType } from "./strain-database";

export interface ProductForSeo {
  name: string;
  category: string;
  strainType: StrainType;
  strainName?: string;
  thc?: string;
  cbd?: string;
  brand?: string;
  description?: string;
  effects?: string[];
  terpenes?: string[];
  flavors?: string[];
  weight?: string;
  inStock?: boolean;
}

export interface SeoContext {
  storeName?: string;
  city?: string;
  state?: string;
  legalModelName?: string;
}

function resolveLegalModelName(ctx: SeoContext): string {
  const explicit = ctx.legalModelName?.trim();
  const generic = [
    DEFAULTS.legalModelName,
    "local compliance model",
    "applicable local regulations",
  ].map((value) => value.toLowerCase());

  if (explicit && !generic.includes(explicit.toLowerCase())) {
    return explicit;
  }

  const city = ctx.city || DEFAULTS.city;
  const state = ctx.state || DEFAULTS.state;
  const place =
    city === DEFAULTS.city && state === DEFAULTS.state
      ? "local"
      : state
      ? `${city}, ${state}`
      : city;

  return `${place} cannabis compliance requirements`;
}

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function titleCase(s: string): string {
  if (!s) return s;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const ACRONYMS: Record<string, string> = {
  cbd: "CBD",
  cbg: "CBG",
  cbn: "CBN",
  thc: "THC",
  thca: "THCA",
  cbda: "CBDA",
  dc: "DC",
  og: "OG",
  rso: "RSO",
};

function normalizeAcronyms(s: string): string {
  return s.replace(/\b(cbd|cbg|cbn|thc|thca|cbda|dc|og|rso)\b/gi, (match) => {
    return ACRONYMS[match.toLowerCase()] ?? match;
  });
}

function hasSeoValue(value: string | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  return v !== "" && v !== "-" && v !== "—" && v !== "â€”";
}

export function isStaleGeneratedSeoCopy(value: string | undefined | null): boolean {
  if (!value?.trim()) return true;
  const v = value.toLowerCase();
  return [
    DEFAULTS.storeName,
    DEFAULTS.city,
    DEFAULTS.state,
    DEFAULTS.legalModelName,
    "white label store",
    "your city",
    "your state",
    "local compliance model",
  ].some((token) => v.includes(token.toLowerCase()));
}

function sentenceList(items: string[]): string {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

function shortSentence(value: string | undefined, fallback: string): string {
  const clean = value?.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  const first = clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  const out = first || clean;
  return out.length > 220 ? `${out.slice(0, 217).trim()}...` : out;
}

function strainProfile(type: string | undefined): string {
  const fallback = type ? `${type} profile` : "balanced profile";
  return STRAIN_TYPE_PROFILE[type as StrainType] ?? fallback;
}

export function cleanProductName(raw: string): string {
  if (!raw) return raw;
  let s = raw.trim().replace(/\s+/g, " ");

  const parts = s
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    const cleanedParts = parts.filter((part, idx) => {
      const lower = part.toLowerCase();
      const isSize =
        /^\d+(?:\.\d+)?\s*(?:g|gram|grams|mg|oz|ounce|ounces|ml)\b/.test(lower) ||
        /^\d+\s*(?:pk|pack|ct|count)\b/.test(lower);
      const isContainer =
        /^(?:jar|bag|tin|box|cart|cartridge|vape|disposable|pre-?roll|preroll)$/i.test(part);
      const isLikelyPrefix = idx === 0 && /^[A-Z0-9]{2,5}$/i.test(part);
      return !isSize && !isContainer && !isLikelyPrefix;
    });
    if (cleanedParts.length > 0) s = cleanedParts.join(" ");
  }

  return s
    .replace(/\s*-\s*\d+(?:\.\d+)?\s*(?:g|mg|oz|ml)\b.*$/i, "")
    .replace(/\s+\d+(?:\.\d+)?\s*(?:g|mg|oz|ml)\b.*$/i, "")
    .replace(/\s*\((?:indica|sativa|hybrid|cbd)\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeImportedProductName(raw: string): string {
  return raw ? raw.trim().replace(/\s+/g, " ") : "";
}

export function seoTitleCase(s: string): string {
  return normalizeAcronyms(titleCase(cleanProductName(s)));
}

export function buildProductSearchPhrase(product: ProductForSeo): string {
  const display = seoTitleCase(product.name);
  const category = product.category || "product";
  const brand = product.brand ? ` by ${normalizeAcronyms(titleCase(product.brand))}` : "";
  const strain = product.strainName
    ? ` ${normalizeAcronyms(titleCase(product.strainName))}`
    : "";
  return `${display}${brand} ${product.strainType}${strain} ${category}`
    .replace(/\s+/g, " ")
    .trim();
}

const CATEGORY_PITCH: Record<string, string[]> = {
  Flower: [
    "Hand-trimmed buds",
    "Top-shelf craft flower",
    "Slow-cured premium flower",
    "Lab-tested top-shelf bud",
  ],
  "Pre-Rolls": [
    "Ready-to-light premium prerolls",
    "Hand-rolled with whole-flower",
    "Convenient prerolls",
    "Quick-light artisan prerolls",
  ],
  Edibles: [
    "Precisely dosed edibles",
    "Small-batch artisan edibles",
    "Lab-verified dosing",
    "Consistent, accurate dosing",
  ],
  Concentrates: [
    "High-potency extract",
    "Premium full-spectrum extract",
    "Top-shelf concentrate",
    "Carefully selected extract",
  ],
  Capsules: [
    "Microdose-friendly capsules",
    "Discreet, precise dosing",
    "Easy-swallow capsules",
    "Consistent capsules",
  ],
};

const STRAIN_TYPE_PROFILE: Record<StrainType, string> = {
  Sativa: "energizing, uplifting Sativa",
  Indica: "relaxing, body-forward Indica",
  Hybrid: "balanced Hybrid",
  CBD: "wellness-focused CBD",
};

type DescTemplate = (p: {
  display: string;
  category: string;
  type: StrainType;
  strainNote: string;
  thcNote: string;
  cbdNote: string;
  brandNote: string;
  storeName: string;
  city: string;
  state: string;
  legalModelName: string;
}) => string;

const DESC_TEMPLATES: DescTemplate[] = [
  ({ display, category, type, strainNote, thcNote, cbdNote, brandNote, storeName, city, state, legalModelName }) =>
    `${display} is a ${STRAIN_TYPE_PROFILE[type]} ${category.toLowerCase()}${brandNote}${strainNote}${thcNote}${cbdNote}. Shop ${display} at ${storeName} in ${city}${state ? `, ${state}` : ""}, available under the ${legalModelName}. Must be 21+ with valid ID.`,

  ({ display, category, type, strainNote, thcNote, cbdNote, brandNote, storeName, city }) => {
    const pitchOptions = CATEGORY_PITCH[category] ?? CATEGORY_PITCH.Flower;
    const pitch = pitchOptions[hashString(display) % pitchOptions.length];
    return `${pitch}. ${display}${brandNote} delivers a ${STRAIN_TYPE_PROFILE[type]} experience${strainNote}${thcNote}${cbdNote}. Browse ${category.toLowerCase()} at ${storeName} in ${city} and order from the live menu. 21+ only.`;
  },

  ({ display, category, type, strainNote, thcNote, cbdNote, brandNote, storeName, city, legalModelName }) =>
    `Looking for a top-shelf ${type} ${category.toLowerCase().replace(/s$/, "")} in ${city}? ${display}${brandNote} offers a ${STRAIN_TYPE_PROFILE[type]} profile${strainNote}${thcNote}${cbdNote}. Add it to your ${storeName} order under the ${legalModelName}. Adults 21+ with ID.`,

  ({ display, category, type, strainNote, thcNote, cbdNote, brandNote, storeName, city, legalModelName }) =>
    `Discover ${display}${brandNote} at ${storeName} in ${city}. This ${STRAIN_TYPE_PROFILE[type]} ${category.toLowerCase()}${strainNote}${thcNote}${cbdNote} is listed on the live menu under the ${legalModelName}. Visit the menu, must be 21+.`,
];

export function generateSeoDescription(
  product: ProductForSeo,
  ctx: SeoContext = {}
): string {
  const storeName = ctx.storeName || DEFAULTS.storeName;
  const city = ctx.city || DEFAULTS.city;
  const state = ctx.state || DEFAULTS.state;
  const legalModelName = resolveLegalModelName(ctx);
  const display = seoTitleCase(product.name);
  const category = product.category || "Flower";
  const type = product.strainType;

  const cleanedStrain = product.strainName
    ? normalizeAcronyms(titleCase(product.strainName.replace(/no strain/i, "").trim()))
    : "";
  const strainNote =
    cleanedStrain && cleanedStrain.toLowerCase() !== display.toLowerCase()
      ? ` featuring the ${cleanedStrain} strain`
      : "";

  const thcNote = hasSeoValue(product.thc) ? ` with ${product.thc} THC` : "";
  const cbdNote =
    hasSeoValue(product.cbd) && product.cbd !== "0%"
      ? ` and ${product.cbd} CBD`
      : "";
  const brandNote = product.brand
    ? ` by ${normalizeAcronyms(titleCase(product.brand))}`
    : "";

  const tplIdx = hashString(display) % DESC_TEMPLATES.length;
  const out = DESC_TEMPLATES[tplIdx]({
    display,
    category,
    type,
    strainNote,
    thcNote,
    cbdNote,
    brandNote,
    storeName,
    city,
    state,
    legalModelName,
  });

  return out.replace(/\s+/g, " ").replace(/\s+([.,])/g, "$1").trim();
}

export function generateSeoTitle(
  product: ProductForSeo,
  ctx: SeoContext = {}
): string {
  const storeName = ctx.storeName || DEFAULTS.storeName;
  const city = ctx.city || DEFAULTS.city;
  const display = seoTitleCase(product.name);
  const category = product.category || "";

  const parts: string[] = [];
  parts.push(category ? `${display} ${category}` : display);
  if (hasSeoValue(product.thc)) parts[parts.length - 1] += ` - ${product.thc} THC`;
  if (product.brand) parts.push(normalizeAcronyms(titleCase(product.brand)));
  parts.push(`${storeName} ${city}`);

  let title = parts.join(" | ");
  if (title.length > 70) title = parts.slice(0, -1).join(" | ") + ` | ${storeName}`;
  if (title.length > 70) title = `${display} ${category} | ${storeName}`.trim();
  return title;
}

export interface ProductPageSeoCopy {
  displayName: string;
  shortDescription: string;
  aboutHeading: string;
  aboutBody: string;
  profileHeading: string;
  profileBody: string;
  localHeading: string;
  localBody: string;
  detailFacts: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
}

export function generateProductPageSeoCopy(
  product: ProductForSeo,
  ctx: SeoContext = {}
): ProductPageSeoCopy {
  const storeName = ctx.storeName || DEFAULTS.storeName;
  const city = ctx.city || DEFAULTS.city;
  const state = ctx.state || DEFAULTS.state;
  const legalModelName = resolveLegalModelName(ctx);
  const display = seoTitleCase(product.name);
  const category = product.category || "product";
  const categoryLower = category.toLowerCase();
  const brand = product.brand ? normalizeAcronyms(titleCase(product.brand)) : "";
  const type = product.strainType;
  const profile = strainProfile(type);
  const cityState = state ? `${city}, ${state}` : city;
  const sourceDescription = isStaleGeneratedSeoCopy(product.description)
    ? undefined
    : product.description;
  const shortDescription = shortSentence(
    sourceDescription,
    `${display} is a ${profile} ${categoryLower} listed on the ${storeName} menu in ${cityState}.`
  );

  const effectText = sentenceList(product.effects ?? []);
  const terpeneText = sentenceList(product.terpenes ?? []);
  const flavorText = sentenceList(product.flavors ?? []);
  const potencyParts: string[] = [];
  if (hasSeoValue(product.thc)) potencyParts.push(`${product.thc} THC`);
  if (hasSeoValue(product.cbd) && product.cbd !== "0%") {
    potencyParts.push(`${product.cbd} CBD`);
  }

  const brandPhrase = brand ? ` from ${brand}` : "";
  const potencyPhrase = potencyParts.length
    ? ` Current product details list ${sentenceList(potencyParts)}.`
    : "";
  const stockPhrase =
    product.inStock === false
      ? " This item is currently marked out of stock on the live menu."
      : " Check the live menu for current availability before checkout.";

  const profileBits = [
    `${display} is listed as a ${profile} ${categoryLower}${brandPhrase}.`,
    effectText ? `Effects listed for this product include ${effectText}.` : "",
    terpeneText ? `Terpene notes include ${terpeneText}.` : "",
    flavorText ? `Flavor notes include ${flavorText}.` : "",
    potencyPhrase.trim(),
  ].filter(Boolean);

  const detailFacts = [
    { label: "Product", value: display },
    brand ? { label: "Brand", value: brand } : null,
    { label: "Category", value: category },
    type ? { label: "Strain type", value: type } : null,
    hasSeoValue(product.thc) ? { label: "THC", value: product.thc } : null,
    hasSeoValue(product.cbd) ? { label: "CBD", value: product.cbd } : null,
    hasSeoValue(product.weight) ? { label: "Weight", value: product.weight } : null,
    {
      label: "Availability",
      value: product.inStock === false ? "Out of stock" : "In stock",
    },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return {
    displayName: display,
    shortDescription,
    aboutHeading: `About ${display} in ${city}`,
    aboutBody: `${shortDescription} Shop ${display} at ${storeName} in ${cityState} and compare product details before placing a local order under the ${legalModelName}.`,
    profileHeading: `${display} product profile`,
    profileBody: `${profileBits.join(" ")}${stockPhrase}`.replace(/\s+/g, " ").trim(),
    localHeading: `Shop ${category} at ${storeName}`,
    localBody: `${storeName} keeps this ${categoryLower} page updated with product information for customers in ${city}. Browse related ${categoryLower}, compare strain type, potency, flavor notes, and effects, then continue through the compliant local checkout flow. Adults 21+ only.`,
    detailFacts,
    faqs: [
      {
        question: `Where can I find ${display} in ${city}?`,
        answer: `${display} is listed on the ${storeName} online menu for customers in ${cityState}. Availability can change, so check the live menu before ordering.`,
      },
      {
        question: `What kind of product is ${display}?`,
        answer: `${display} is a ${profile} ${categoryLower}${brand ? ` from ${brand}` : ""}. The product page includes current details such as category, potency, and available effects when provided by the store.`,
      },
      {
        question: `Does ${display} have THC or CBD information?`,
        answer: potencyParts.length
          ? `The current listing shows ${sentenceList(potencyParts)} for ${display}. Product details can vary by batch, so review the package label at pickup.`
          : `No specific THC or CBD value is listed for ${display} yet. Review the product label at pickup for batch-specific information.`,
      },
    ],
  };
}

export function generateCategorySeoDescription(input: {
  category: string;
  storeName?: string;
  city?: string;
  legalModelName?: string;
}): string {
  const category = input.category || "Products";
  const storeName = input.storeName || DEFAULTS.storeName;
  const city = input.city || DEFAULTS.city;
  const legalModelName = resolveLegalModelName({
    city,
    legalModelName: input.legalModelName,
  });
  return `Shop ${category.toLowerCase()} at ${storeName} in ${city}. Browse live inventory, compare product details, and place a local order under the ${legalModelName}.`;
}

export function generateBrandSeoDescription(input: {
  brand: string;
  storeName?: string;
  city?: string;
}): string {
  const brand = input.brand || "This brand";
  const storeName = input.storeName || DEFAULTS.storeName;
  const city = input.city || DEFAULTS.city;
  return `Browse ${brand} products available at ${storeName} in ${city}. Explore current menu items, prices, product details, and availability.`;
}

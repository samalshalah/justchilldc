import type { Product } from "./data";

export const STRAIN_TYPES = ["All", "Indica", "Sativa", "Hybrid", "CBD"] as const;
export type StrainFilter = (typeof STRAIN_TYPES)[number];

export const FEELINGS = ["Calm", "Sleep", "Energize", "Focus", "Creative", "Balanced"] as const;

const FEELING_ALIASES: Record<string, (typeof FEELINGS)[number]> = {
  relax: "Calm",
  relaxed: "Calm",
  relaxing: "Calm",
  calm: "Calm",
  calming: "Calm",
  mellow: "Calm",
  sleep: "Sleep",
  sleepy: "Sleep",
  slumber: "Sleep",
  sedate: "Sleep",
  nighttime: "Sleep",
  night: "Sleep",
  energize: "Energize",
  energized: "Energize",
  energy: "Energize",
  uplifting: "Energize",
  uplift: "Energize",
  focus: "Focus",
  focused: "Focus",
  alert: "Focus",
  clarity: "Focus",
  creative: "Creative",
  creativity: "Creative",
  inspired: "Creative",
  balanced: "Balanced",
  balance: "Balanced",
};

export function parseProductListField(value: string | undefined | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  } catch {
    return value
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function canonicalFeeling(value: string): (typeof FEELINGS)[number] | null {
  const key = value.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  if (!key) return null;
  if ((FEELINGS as readonly string[]).includes(value)) {
    return value as (typeof FEELINGS)[number];
  }

  for (const part of key.split(/\s+/)) {
    const found = FEELING_ALIASES[part];
    if (found) return found;
  }
  return FEELING_ALIASES[key] ?? null;
}

export function getProductFeelings(product: Product): string[] {
  const out = new Set<string>();
  for (const effect of parseProductListField(product.effects)) {
    const found = canonicalFeeling(effect);
    if (found) out.add(found);
  }

  const text = `${product.name} ${product.description} ${product.strain} ${product.cbd}`.toLowerCase();
  for (const [alias, feeling] of Object.entries(FEELING_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`, "i").test(text)) out.add(feeling);
  }

  if (product.strain === "Indica") {
    out.add("Calm");
    out.add("Sleep");
  } else if (product.strain === "Sativa") {
    out.add("Energize");
    out.add("Focus");
  } else if (product.strain === "Hybrid" || product.strain === "CBD") {
    out.add("Balanced");
  }

  return FEELINGS.filter((feeling) => out.has(feeling));
}

export function getAvailableFeelings(products: Product[]): string[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    for (const feeling of getProductFeelings(product)) {
      counts.set(feeling, (counts.get(feeling) ?? 0) + 1);
    }
  }
  return FEELINGS.filter((feeling) => (counts.get(feeling) ?? 0) > 0);
}

export function getAvailableStrains(products: Product[]): string[] {
  const present = new Set(products.map((product) => product.strain).filter(Boolean));
  return STRAIN_TYPES.filter((strain) => strain !== "All" && present.has(strain));
}

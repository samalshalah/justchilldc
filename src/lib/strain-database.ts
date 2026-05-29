/**
 * strain-database.ts — strain name → Indica/Sativa/Hybrid/CBD inference.
 *
 * Three layers, in order of confidence:
 *   1. Exact match in the curated dictionary below
 *   2. Substring match against the dictionary (e.g. "DC | Gelato Cake | 3.5g" → "Gelato Cake")
 *   3. Extract from the name itself (e.g. "BLOOMIEZ INDICA" → Indica)
 *   4. Default: Hybrid (the safe answer for ambiguous strains)
 *
 * The dictionary is hand-built from public Leafly/Wikileaf data and is
 * deliberately conservative — when in doubt about lineage, we mark it
 * Hybrid rather than guess. Easy to extend; the lookup is by lowercased
 * normalized strain name.
 */

export type StrainType = "Indica" | "Sativa" | "Hybrid" | "CBD";

/**
 * Known strain genetics. Keys are lowercased.
 * Sources: Leafly, Wikileaf, breeder consensus circa 2025.
 */
const STRAIN_DB: Record<string, StrainType> = {
  // Sativa-dominant
  "blue dream": "Sativa",
  "sour diesel": "Sativa",
  "jack herer": "Sativa",
  "green crack": "Sativa",
  "durban poison": "Sativa",
  "acapulco gold": "Sativa",
  "panama red": "Sativa",
  "super silver haze": "Sativa",
  "super silver dawg": "Sativa",
  "maui wowie": "Sativa",
  "lemon haze": "Sativa",
  "super lemon haze": "Sativa",
  "strawberry cough": "Sativa",
  "ghost train haze": "Sativa",
  "tangie": "Sativa",
  "candyland": "Sativa",
  "trainwreck": "Sativa",
  "amnesia haze": "Sativa",
  "chocolope": "Sativa",
  "harlequin": "Sativa",
  "moroccan mint": "Sativa",
  "hella honeydew": "Sativa",
  "cherry lemonade": "Sativa",
  "cherry limeade": "Sativa",
  "cherry limeade cake": "Sativa",
  "watermelon ice": "Sativa",
  "sour candlope": "Sativa",
  "sour cantaloupe": "Sativa",
  "dream machine": "Sativa",
  "rainbow belts": "Sativa",
  "rainbow belts 2.0": "Sativa",
  "cherry pie": "Sativa",
  "lemon cherry gelato": "Sativa",

  // Indica-dominant
  "og kush": "Indica",
  "granddaddy purple": "Indica",
  "grand daddy purple": "Indica",
  "northern lights": "Indica",
  "purple kush": "Indica",
  "blueberry": "Indica",
  "bubba kush": "Indica",
  "afghan kush": "Indica",
  "hindu kush": "Indica",
  "master kush": "Indica",
  "skywalker og": "Indica",
  "skywalker": "Indica",
  "do-si-dos": "Indica",
  "dosi-dos": "Indica",
  "9 pound hammer": "Indica",
  "ice cream cake": "Indica",
  "wedding cake": "Indica",
  "florida wedding cake": "Indica",
  "platinum og": "Indica",
  "platinum kush": "Indica",
  "platinum tk": "Indica",
  "kush mints": "Indica",
  "khalifa kush": "Indica",
  "khalifa mints": "Indica",
  "biscuit blues": "Indica",
  "fuel biscuits": "Indica",
  "petrol potion": "Indica",
  "petro chem": "Indica",
  "motor breath": "Indica",
  "duct tape": "Indica",
  "black russian": "Indica",
  "black n blue": "Indica",
  "blueberry kush": "Indica",
  "midnight berry": "Indica",
  "purple punch": "Indica",
  "grape ape": "Indica",
  "snow glovez": "Indica",
  "snow gloves": "Indica",
  "cap'd out": "Indica",
  "capd out": "Indica",
  "luna": "Indica",
  "vice city": "Indica",
  "blue cheese": "Indica",
  "lava cake": "Indica",
  "frosted skywalker": "Indica",

  // Hybrid (genuinely balanced or 50/50)
  "girl scout cookies": "Hybrid",
  "gsc": "Hybrid",
  "animal cookies": "Hybrid",
  "thin mint": "Hybrid",
  "thin mints": "Hybrid",
  "wedding crasher": "Hybrid",
  "gelato": "Hybrid",
  "gelato cake": "Hybrid",
  "gelatti mintz": "Hybrid",
  "white runtz": "Hybrid",
  "runtz": "Hybrid",
  "zkittlez": "Hybrid",
  "zkittles": "Hybrid",
  "skittles": "Hybrid",
  "ak-47": "Hybrid",
  "white widow": "Hybrid",
  "pineapple express": "Hybrid",
  "headband": "Hybrid",
  "sunset sherbet": "Hybrid",
  "sherbet": "Hybrid",
  "bruce banner": "Hybrid",
  "fire og": "Hybrid",
  "gorilla glue": "Hybrid",
  "gorilla glue #4": "Hybrid",
  "gg4": "Hybrid",
  "gorilla glue#4": "Hybrid",
  "chemdog": "Hybrid",
  "chem dog": "Hybrid",
  "chem 91": "Hybrid",
  "91 octane": "Hybrid",
  "permanent marker": "Hybrid",
  "hash burger": "Hybrid",
  "triple burger": "Hybrid",
  "juicee j": "Hybrid",
  "beach cake": "Hybrid",
  "coco chanel": "Hybrid",
  "pave": "Hybrid",
  "point breeze": "Hybrid",
  "strawberry banana": "Hybrid",
  "banana acai mints": "Hybrid",
  "sour puss": "Hybrid",
  "zack's cake": "Hybrid",
  "zacks cake": "Hybrid",
  "honey citrus": "Hybrid",
  "royal medic": "Hybrid",

  // CBD-dominant
  "harle-tsu": "CBD",
  "ringo's gift": "CBD",
  "ringos gift": "CBD",
  "acdc": "CBD",
  "ac/dc": "CBD",
  "charlotte's web": "CBD",
  "charlottes web": "CBD",
  "cannatonic": "CBD",
};

/**
 * Words that imply strain type when present in a product/strain name.
 * Tested as whole-word case-insensitive. Order matters — first match wins.
 */
const NAME_HINTS: { pattern: RegExp; type: StrainType }[] = [
  { pattern: /\b(sativa)\b/i, type: "Sativa" },
  { pattern: /\b(indica)\b/i, type: "Indica" },
  { pattern: /\b(hybrid)\b/i, type: "Hybrid" },
  { pattern: /\b(cbd)\b/i, type: "CBD" },
];

/** Lowercase + collapse whitespace + strip surrounding punctuation. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[|()\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Infer strain type from any combination of strain name and product name.
 * Both fields are searched — a product like
 *   name="MW | SOUR WATERMELON 10mg | SATIVA", strainName="No Strain"
 * still resolves to Sativa via the name hint.
 */
export function inferStrainType(opts: {
  strainName?: string;
  productName?: string;
}): {
  type: StrainType;
  confidence: "high" | "medium" | "low";
  reason: string;
} {
  const strain = normalize(opts.strainName ?? "");
  const product = normalize(opts.productName ?? "");
  const haystack = `${strain} ${product}`;

  // 1. Exact strain match
  if (strain && STRAIN_DB[strain]) {
    return {
      type: STRAIN_DB[strain],
      confidence: "high",
      reason: `Known strain: ${opts.strainName}`,
    };
  }

  // 2. Substring of strain DB key inside the strain field
  if (strain) {
    for (const [key, type] of Object.entries(STRAIN_DB)) {
      // Multi-word strain names should match as a whole within the strain field
      if (strain.includes(key)) {
        return {
          type,
          confidence: "high",
          reason: `Matched known strain "${key}"`,
        };
      }
    }
  }

  // 3. Substring inside the full product name
  for (const [key, type] of Object.entries(STRAIN_DB)) {
    if (product.includes(key)) {
      return {
        type,
        confidence: "medium",
        reason: `Matched "${key}" in product name`,
      };
    }
  }

  // 4. Explicit type word in either name
  for (const { pattern, type } of NAME_HINTS) {
    if (pattern.test(haystack)) {
      return {
        type,
        confidence: "medium",
        reason: `Name contains "${type}"`,
      };
    }
  }

  // 5. Default
  return {
    type: "Hybrid",
    confidence: "low",
    reason: "No match — defaulted to Hybrid",
  };
}

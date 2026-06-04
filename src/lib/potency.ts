export interface ImportedThcInput {
  category: string;
  productName: string;
  thcRaw?: string;
  calculatedThcRaw?: string;
}

function cleanRaw(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function numeric(value: string | undefined): number | null {
  const n = parseFloat(cleanRaw(value).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatNumber(value: number, maxDecimals = 1): string {
  return value
    .toFixed(maxDecimals)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

export function extractGramWeight(productName: string, category: string): number | null {
  const name = productName.toLowerCase();
  const explicit = name.match(/(\d+(?:\.\d+)?|\.\d+)\s*g\b/);
  if (explicit) {
    const grams = parseFloat(explicit[1]);
    return Number.isFinite(grams) && grams > 0 ? grams : null;
  }

  if (category === "Pre-Rolls") {
    const pack = name.match(/\b(\d+)\s*pk\b/);
    if (pack) {
      const count = parseInt(pack[1], 10);
      if (count === 3) return 2.1;
      if (count === 5) return 2.5;
      if (count > 0) return count * 0.5;
    }
    if (/\bpre-?rolls?\b/.test(name)) return 1;
  }

  return null;
}

export function extractNamedMg(productName: string): number | null {
  const name = productName.replace(/\s+/g, " ");

  const thcRatio = name.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*mg\s*THC\s*:\s*CBD/i);
  if (thcRatio) return numeric(thcRatio[1]);

  const thcBefore = name.match(/(\d+(?:\.\d+)?)\s*mg\s*THC\b/i);
  if (thcBefore) return numeric(thcBefore[1]);

  const thcAfter = name.match(/\bTHC\s*(\d+(?:\.\d+)?)\s*mg\b/i);
  if (thcAfter) return numeric(thcAfter[1]);

  const general = name.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
  return general ? numeric(general[1]) : null;
}

export function formatImportedThc(input: ImportedThcInput): string {
  const category = input.category;
  const raw = cleanRaw(input.thcRaw);
  if (!raw) return "";

  if (/%/.test(raw)) {
    const pct = numeric(raw);
    return pct ? `${formatNumber(pct)}%` : raw.replace(/\s+/g, "");
  }

  if (/\bmg\b/i.test(raw) && category !== "Flower" && category !== "Pre-Rolls" && category !== "Concentrates") {
    const mg = numeric(raw);
    return mg ? `${formatNumber(mg)}mg` : raw.replace(/\s+/g, "");
  }

  if (category === "Edibles" || category === "Capsules") {
    const namedMg = extractNamedMg(input.productName);
    const mg = namedMg ?? numeric(input.calculatedThcRaw) ?? numeric(raw);
    return mg ? `${formatNumber(mg)}mg` : "";
  }

  const mg = numeric(input.calculatedThcRaw) ?? numeric(raw);
  const grams = extractGramWeight(input.productName, category);
  if (mg && grams) {
    const pct = (mg / (grams * 1000)) * 100;
    if (pct > 0 && pct <= 100) return `${formatNumber(pct)}%`;
  }

  if (mg && mg <= 100) return `${formatNumber(mg)}%`;
  return mg ? `${formatNumber(mg)}mg` : "";
}

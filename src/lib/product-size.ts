export interface PackageSizeInput {
  category: string;
  productName: string;
  thc?: string;
}

function formatNumber(value: number): string {
  return value
    .toFixed(1)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

function numeric(value: string | undefined): number | null {
  const n = parseFloat((value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeCategory(category: string): string {
  return category.toLowerCase().trim();
}

function extractGramSize(productName: string): string {
  const match = productName.match(/(\d+(?:\.\d+)?|\.\d+)\s*g\b/i);
  if (!match) return "";
  const grams = numeric(match[1]);
  return grams ? `${formatNumber(grams)}g` : "";
}

function extractPackSize(productName: string): string {
  const match = productName.match(/\b(\d+)\s*(?:pk|pack)\b/i);
  if (!match) return "";
  const count = parseInt(match[1], 10);
  return Number.isFinite(count) && count > 0 ? `${count}-pack` : "";
}

function extractNamedMg(productName: string): string {
  const name = productName.replace(/\s+/g, " ");
  const ratio = name.match(
    /(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*mg\s*THC\s*:\s*(CBD|CBG|CBN)/i
  );
  if (ratio) return `${formatNumber(Number(ratio[1]))}mg THC`;

  const thcBefore = name.match(/(\d+(?:\.\d+)?)\s*mg\s*THC\b/i);
  if (thcBefore) return `${formatNumber(Number(thcBefore[1]))}mg THC`;

  const thcAfter = name.match(/\bTHC\s*(\d+(?:\.\d+)?)\s*mg\b/i);
  if (thcAfter) return `${formatNumber(Number(thcAfter[1]))}mg THC`;

  const general = name.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
  return general ? `${formatNumber(Number(general[1]))}mg THC` : "";
}

export function formatImportedPackageSize(input: PackageSizeInput): string {
  const grams = extractGramSize(input.productName);
  if (grams) return grams;

  const category = normalizeCategory(input.category);
  const name = input.productName.toLowerCase();
  if (category.includes("pre-roll") || category.includes("preroll")) {
    const pack = extractPackSize(input.productName);
    if (pack) return pack;
  }

  if (
    category.includes("edible") ||
    category.includes("capsule") ||
    category.includes("tincture") ||
    /\b(tincture|gumm(?:y|ies)|capsules?)\b/.test(name)
  ) {
    const namedMg = extractNamedMg(input.productName);
    if (namedMg) return namedMg;
    const thcMg = input.thc?.match(/^(\d+(?:\.\d+)?)mg$/i);
    if (thcMg) return `${formatNumber(Number(thcMg[1]))}mg THC`;
  }

  return "";
}

function parsePackageSize(value: string): { unit: "g" | "mg" | "pack" | "other"; value: number } {
  const trimmed = value.trim().toLowerCase();
  const grams = trimmed.match(/^(\d+(?:\.\d+)?)g$/);
  if (grams) return { unit: "g", value: Number(grams[1]) };
  const mg = trimmed.match(/^(\d+(?:\.\d+)?)mg\b/);
  if (mg) return { unit: "mg", value: Number(mg[1]) };
  const pack = trimmed.match(/^(\d+)-pack$/);
  if (pack) return { unit: "pack", value: Number(pack[1]) };
  return { unit: "other", value: Number.POSITIVE_INFINITY };
}

export function comparePackageSizes(a: string, b: string): number {
  const unitOrder = { g: 0, pack: 1, mg: 2, other: 3 };
  const left = parsePackageSize(a);
  const right = parsePackageSize(b);
  if (left.unit !== right.unit) return unitOrder[left.unit] - unitOrder[right.unit];
  if (left.value !== right.value) return left.value - right.value;
  return a.localeCompare(b);
}

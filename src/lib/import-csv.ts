/**
 * import-csv.ts — CSV parsing for product imports.
 *
 * Built around the Dutchie-style POS export format the client sent us, but
 * the column-name detection is loose enough to handle similar exports from
 * Flowhub, Treez, etc.
 *
 * Quirks of the Dutchie format we handle:
 *   - Every cell is wrapped as `="value"` (Excel-quoted, preserves leading
 *     zeros on SKUs). We strip the leading `=` before unquoting.
 *   - "Calculated THC (mg)" is not used as display THC. The import only
 *     displays THC when the file includes an explicit THC column.
 *   - "Strain" holds the strain *name*, not Indica/Sativa/Hybrid. We
 *     default everything to Hybrid and let the admin fix in bulk.
 */

import "server-only";
import { formatImportedThc } from "./potency";
import { formatImportedPackageSize } from "./product-size";
import { normalizeImportedProductName } from "./seo-generator";

export interface ParsedRow {
  sku: string;
  name: string;
  category: string;
  brand: string;
  strainName: string;
  price: number;
  quantity: number;
  thc: string;
  cbd: string;
  weight: string;
  inStock: boolean;
  rawIndex: number;
  warnings: string[];
}

const HEADER_ALIASES: Record<
  keyof Omit<ParsedRow, "rawIndex" | "warnings" | "weight">,
  string[]
> = {
  sku: ["sku", "id", "product id"],
  name: ["product", "name", "product name", "online title"],
  category: ["category", "master category"],
  brand: ["brand", "vendor"],
  strainName: ["strain"],
  price: ["current price", "price", "price (catalog)", "unit price (inventory)"],
  quantity: ["available", "quantity", "qty"],
  thc: [
    "thc",
    "thc %",
    "thc (%)",
    "thc percent",
    "total thc",
    "total thc %",
    "total thc (%)",
    "total thc percent",
  ],
  cbd: ["cbd"],
  inStock: ["is available online", "is pos available"],
};

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function unwrapCell(raw: string): string {
  let v = raw.trim();
  if (v.startsWith('="') && v.endsWith('"')) v = v.slice(2, -1);
  else if (v.startsWith("=")) v = v.slice(1);
  return v.trim();
}

function findHeaderIndex(headers: string[], aliases: string[]): number {
  const norm = (s: string) => s.toLowerCase().trim();
  const lower = headers.map(norm);
  for (const alias of aliases) {
    const idx = lower.indexOf(norm(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}

export function titleCase(s: string): string {
  if (!s) return s;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function normalizeCategory(raw: string): string {
  const c = raw.toLowerCase().trim();
  if (c.startsWith("flower")) return "Flower";
  if (c.startsWith("pre-roll") || c === "prerolls" || c === "preroll") return "Pre-Rolls";
  if (c.startsWith("edible")) return "Edibles";
  if (c.startsWith("concentrate") || c.startsWith("vape") || c.startsWith("cartridge"))
    return "Concentrates";
  if (c.startsWith("capsule") || c.startsWith("tincture")) return "Capsules";
  if (c.startsWith("topical")) return "Topicals";
  return titleCase(raw);
}

function normalizeBrand(raw: string, productName: string): string {
  if (/\balt\s*sol\b|altsol/i.test(productName)) return "AltSol";
  return raw;
}

function mergeDuplicateSkuRows(rows: ParsedRow[]): ParsedRow[] {
  const bySku = new Map<string, ParsedRow>();

  for (const row of rows) {
    const existing = bySku.get(row.sku);
    if (!existing) {
      bySku.set(row.sku, { ...row, warnings: [...row.warnings] });
      continue;
    }

    existing.quantity += row.quantity;
    existing.inStock = existing.quantity > 0 && (existing.inStock || row.inStock);
    existing.warnings.push(
      `Duplicate SKU row ${row.rawIndex} combined; quantity was summed.`
    );

    const comparableFields: Array<keyof Pick<
      ParsedRow,
      "name" | "category" | "brand" | "strainName" | "price" | "thc" | "cbd" | "weight"
    >> = ["name", "category", "brand", "strainName", "price", "thc", "cbd", "weight"];

    for (const field of comparableFields) {
      if (String(existing[field]) !== String(row[field])) {
        existing.warnings.push(
          `Duplicate SKU row ${row.rawIndex} had a different ${field}; kept the first value.`
        );
      }
    }
  }

  return Array.from(bySku.values());
}

interface ParseResult {
  rows: ParsedRow[];
  errors: { row: number; message: string }[];
  detectedColumns: Partial<Record<keyof ParsedRow, string>>;
}

export function parseInventoryCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], errors: [{ row: 0, message: "CSV is empty or missing rows" }], detectedColumns: {} };
  }

  const headers = parseLine(lines[0]).map(unwrapCell);
  const colIdx: Record<string, number> = {};
  const detected: Partial<Record<keyof ParsedRow, string>> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = findHeaderIndex(headers, aliases);
    colIdx[field] = idx;
    if (idx >= 0) detected[field as keyof ParsedRow] = headers[idx];
  }

  const errors: { row: number; message: string }[] = [];
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]).map(unwrapCell);
    const get = (field: string): string => {
      const idx = colIdx[field];
      return idx >= 0 ? cells[idx] ?? "" : "";
    };

    const sku = get("sku");
    const name = normalizeImportedProductName(get("name"));
    const rawCategory = get("category");
    const rawBrand = normalizeBrand(get("brand"), name);
    const strainName = get("strainName");
    const priceStr = get("price");
    const qtyStr = get("quantity");
    const thcRaw = get("thc");
    const cbdRaw = get("cbd");
    const inStockRaw = get("inStock");

    const warnings: string[] = [];

    if (!sku) {
      errors.push({ row: i + 1, message: "Missing SKU" });
      continue;
    }
    if (!name) {
      errors.push({ row: i + 1, message: `Row ${i + 1} (SKU ${sku}): missing name` });
      continue;
    }
    const price = Math.round(parseFloat(priceStr) || 0);
    if (price <= 0) {
      errors.push({
        row: i + 1,
        message: `Row ${i + 1} (${name}): no price found; skipped`,
      });
      continue;
    }

    const quantity = parseInt(qtyStr, 10);
    const finalQty = isNaN(quantity) ? 0 : quantity;

    const category = normalizeCategory(rawCategory);
    const thc = formatImportedThc({
      category,
      productName: name,
      thcRaw,
    });
    if (!thc) {
      warnings.push("THC value missing; left blank");
    }
    const weight = formatImportedPackageSize({
      category,
      productName: name,
      thc,
    });

    let cbd = "0%";
    if (cbdRaw) {
      const cleaned = cbdRaw.replace(/\s+/g, "").trim();
      if (cleaned && cleaned !== "0.00%" && cleaned !== "0%") cbd = cleaned;
    }

    let inStock = finalQty > 0;
    if (inStockRaw) {
      const v = inStockRaw.toLowerCase();
      if (v === "false" || v === "no" || v === "0") inStock = false;
    }

    rows.push({
      sku,
      name,
      category,
      brand: rawBrand,
      strainName: strainName || "",
      price,
      quantity: finalQty,
      thc,
      cbd,
      weight,
      inStock,
      rawIndex: i + 1,
      warnings,
    });
  }

  return { rows: mergeDuplicateSkuRows(rows), errors, detectedColumns: detected };
}

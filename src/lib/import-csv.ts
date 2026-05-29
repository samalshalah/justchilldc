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
 *   - THC is a percent string for flower ("21.82 %") and mg/g for edibles
 *     ("0.06 mg/g"). For edibles we prefer "Calculated THC (mg)" instead.
 *   - "Strain" holds the strain *name*, not Indica/Sativa/Hybrid. We
 *     default everything to Hybrid and let the admin fix in bulk.
 */

import "server-only";
import { cleanProductName, seoTitleCase } from "./seo-generator";

export interface ParsedRow {
  sku: string;
  name: string;
  category: string;
  brand: string;
  strainName: string;
  donation: number;
  quantity: number;
  thc: string;
  cbd: string;
  inStock: boolean;
  rawIndex: number;
  warnings: string[];
}

const HEADER_ALIASES: Record<keyof Omit<ParsedRow, "rawIndex" | "warnings">, string[]> = {
  sku: ["sku", "id", "product id"],
  name: ["product", "name", "product name", "online title"],
  category: ["category", "master category"],
  brand: ["brand", "vendor"],
  strainName: ["strain"],
  donation: ["current price", "price", "price (catalog)", "unit price (inventory)"],
  quantity: ["available", "quantity", "qty"],
  thc: ["thc", "calculated thc (mg)"],
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
    const name = seoTitleCase(cleanProductName(get("name")));
    const rawCategory = get("category");
    const rawBrand = get("brand");
    const strainName = get("strainName");
    const priceStr = get("donation");
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
    const donation = Math.round(parseFloat(priceStr) || 0);
    if (donation <= 0) {
      errors.push({
        row: i + 1,
        message: `Row ${i + 1} (${name}): no price found; skipped`,
      });
      continue;
    }

    const quantity = parseInt(qtyStr, 10);
    const finalQty = isNaN(quantity) ? 0 : quantity;

    const category = normalizeCategory(rawCategory);
    let thc = "";
    if (thcRaw) {
      thc = thcRaw.replace(/\s+/g, "").replace("%", "%").trim();
      if (category === "Edibles" || category === "Capsules") {
        const mgIdx = findHeaderIndex(headers, ["calculated thc (mg)"]);
        if (mgIdx >= 0) {
          const mg = parseFloat(unwrapCell(cells[mgIdx] ?? ""));
          if (!isNaN(mg) && mg > 0) thc = `${Math.round(mg)}mg`;
          else thc = "";
        } else if (thcRaw.includes("mg/g")) {
          thc = "";
        }
      }
    }
    if (!thc) {
      warnings.push("THC value missing; left blank");
    }

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
      donation,
      quantity: finalQty,
      thc,
      cbd,
      inStock,
      rawIndex: i + 1,
      warnings,
    });
  }

  return { rows, errors, detectedColumns: detected };
}

"use server";

/**
 * import-actions.ts — server-side import logic.
 *
 * Workflow:
 *   1. Parse CSV (already done client-side; we receive the parsed rows back)
 *   2. Auto-create missing brands and categories
 *   3. For each row: find product by SKU → update if exists, insert if not
 *
 * We deliberately do NOT wrap the entire import in a single transaction —
 * if row 50 of 200 fails, we want rows 1-49 saved. Each product is its own
 * unit of work. Failures are reported but don't roll back successes.
 */

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { titleCase } from "@/lib/import-csv";
import { formatImportedPackageSize } from "@/lib/product-size";
import {
  generateBrandSeoDescription,
  generateCategorySeoDescription,
  generateSeoDescription,
  normalizeImportedProductName,
} from "@/lib/seo-generator";
import { DEFAULTS } from "@/lib/defaults";
import { isLocalPreviewMode } from "@/lib/preview";
import { importPreviewProducts } from "@/lib/preview-data";

const COOKIE_NAME = "jc_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function hmacHex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

async function assertAdmin() {
  const c = await cookies();
  const cookie = c.get(COOKIE_NAME);
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD not configured");
  if (!cookie?.value) throw new Error("Not authenticated");
  const [issuedAtStr, sig] = cookie.value.split(".");
  if (!issuedAtStr || !sig) throw new Error("Bad session");
  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) throw new Error("Bad session");
  const ageSec = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSec < 0 || ageSec > SESSION_MAX_AGE_SEC) throw new Error("Expired");
  if (hmacHex(secret, issuedAtStr) !== sig) throw new Error("Bad sig");
}

// What the client sends us per-row after preview tweaks
export interface ImportRowInput {
  sku: string;
  name: string;
  category: string;
  brand: string;
  strainName: string;
  price: number;
  quantity: number;
  thc: string;
  cbd: string;
  weight?: string;
  inStock: boolean;
  /** "Indica" | "Sativa" | "Hybrid" | "CBD" — defaulted to Hybrid in client */
  strainType: "Indica" | "Sativa" | "Hybrid" | "CBD";
  /** True if user unchecked the row in preview */
  skip?: boolean;
  /** Description override; defaults to a generated string */
  description?: string;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; sku: string; message: string }[];
  brandsCreated: string[];
  categoriesCreated: string[];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function imageTypeFor(category: string): string {
  switch (category) {
    case "Edibles":
      return "edible";
    case "Concentrates":
    case "Capsules":
      return "vape";
    default:
      return "flower";
  }
}

export async function runImport(rows: ImportRowInput[]): Promise<ImportResult> {
  await assertAdmin();
  const [
    { db, productsTable, brandsTable, categoriesTable },
    { invalidateSettings, getSiteSettings },
  ] = await Promise.all([import("@/lib/db"), import("@/lib/settings")]);

  if (isLocalPreviewMode()) {
    const result = importPreviewProducts(rows);
    invalidateSettings();
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/brands");
    revalidatePath("/shop");
    revalidatePath("/");
    return result;
  }

  const settings = await getSiteSettings();
  const ctx = {
    storeName: settings.store?.name,
    city: settings.location?.city || settings.seo?.city,
    state: settings.location?.state,
    legalModelName: DEFAULTS.legalModelName,
  };

  const result: ImportResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    brandsCreated: [],
    categoriesCreated: [],
  };

  // Pre-load brands and categories so we don't hammer the DB on every row.
  const existingBrands = await db.select().from(brandsTable);
  const brandByName = new Map(
    existingBrands.map((b) => [b.name.toLowerCase(), b])
  );
  const existingCats = await db.select().from(categoriesTable);
  const catByName = new Map(
    existingCats.map((c) => [c.name.toLowerCase(), c])
  );

  // First pass: collect unique brands + categories, auto-create missing ones.
  const brandsToCreate = new Set<string>();
  const catsToCreate = new Set<string>();
  for (const row of rows) {
    if (row.skip) continue;
    if (row.brand && !brandByName.has(row.brand.toLowerCase())) {
      brandsToCreate.add(titleCase(row.brand));
    }
    if (row.category && !catByName.has(row.category.toLowerCase())) {
      catsToCreate.add(row.category);
    }
  }

  for (const name of brandsToCreate) {
    try {
      const [created] = await db
        .insert(brandsTable)
        .values({
          name,
          description: generateBrandSeoDescription({
            brand: name,
            storeName: ctx.storeName,
            city: ctx.city,
          }),
          website: "",
          logoUrl: null,
          featured: false,
        })
        .returning();
      brandByName.set(name.toLowerCase(), created);
      result.brandsCreated.push(name);
    } catch (err) {
      console.warn(`[import] could not auto-create brand "${name}":`, err);
    }
  }

  for (const name of catsToCreate) {
    try {
      const [created] = await db
        .insert(categoriesTable)
        .values({
          name,
          slug: slugify(name),
          description: generateCategorySeoDescription({
            category: name,
            storeName: ctx.storeName,
            city: ctx.city,
            legalModelName: ctx.legalModelName,
          }),
          imageUrl: null,
        })
        .returning();
      catByName.set(name.toLowerCase(), created);
      result.categoriesCreated.push(name);
    } catch (err) {
      console.warn(`[import] could not auto-create category "${name}":`, err);
    }
  }

  // Second pass: upsert each product
  for (const row of rows) {
    if (row.skip) {
      result.skipped++;
      continue;
    }

    try {
      const brand = row.brand
        ? brandByName.get(row.brand.toLowerCase())
        : undefined;

      const productName = normalizeImportedProductName(row.name);
      const description = generateSeoDescription(
        {
          name: productName,
          category: row.category,
          strainType: row.strainType,
          strainName: row.strainName,
          thc: row.thc,
          cbd: row.cbd,
          brand: row.brand,
        },
        ctx
      );

      const baseValues = {
        name: productName,
        category: row.category,
        brandId: brand?.id ?? null,
        strain: row.strainType,
        thc: row.thc || "—",
        cbd: row.cbd || "0%",
        price: Math.max(0, Math.round(row.price)),
        imageType: imageTypeFor(row.category),
        description,
        weight:
          row.weight?.trim() ||
          formatImportedPackageSize({
            category: row.category,
            productName,
            thc: row.thc,
          }),
        sku: row.sku,
        quantity: row.quantity,
        inStock: row.inStock && row.quantity > 0,
        archivedAt: null,
      };

      // Find existing by SKU (latest insertion wins on dupes)
      const existing = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(eq(productsTable.sku, row.sku))
        .orderBy(sql`${productsTable.createdAt} DESC`)
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(productsTable)
          .set(baseValues)
          .where(eq(productsTable.id, existing[0].id));
        result.updated++;
      } else {
        await db.insert(productsTable).values(baseValues);
        result.inserted++;
      }
    } catch (err) {
      result.errors.push({
        row: result.inserted + result.updated + result.skipped + result.errors.length + 2,
        sku: row.sku,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  invalidateSettings();
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/brands");
  revalidatePath("/shop");
  revalidatePath("/");

  return result;
}

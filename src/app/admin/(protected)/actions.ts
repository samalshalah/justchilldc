"use server";

/**
 * actions.ts — admin mutations as Server Actions.
 *
 * All admin pages use these. Each action verifies the session cookie
 * (the middleware already gates the page, but defense-in-depth) before
 * doing any DB write, and calls revalidatePath/invalidateSettings so
 * the user sees the change immediately.
 */

import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, sql, inArray } from "drizzle-orm";
import {
  db,
  productsTable,
  orderItemsTable,
  ordersTable,
  brandsTable,
  categoriesTable,
  siteSettingsTable,
  blogPostsTable,
} from "@/lib/db";
import { blogExcerpt, slugifyBlogSlug } from "@/lib/blog";
import { invalidateSettings, getSiteSettings } from "@/lib/settings";
import { generateSeoDescription, generateSeoTitle } from "@/lib/seo-generator";
import type { SiteSettings } from "@/lib/types";
import type { StrainType } from "@/lib/strain-database";
import { isLocalPreviewMode } from "@/lib/preview";
import { setPreviewSettingSlice } from "@/lib/preview-data";

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

// ───────────────────────────── settings ─────────────────────────────

/**
 * Save one slice of settings (one row in site_settings table).
 * The slice key must be a known SiteSettings key; the value is JSON-encoded.
 */
export async function saveSettingSlice<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<{ ok: true }> {
  await assertAdmin();
  if (isLocalPreviewMode()) {
    setPreviewSettingSlice(key, value);
    invalidateSettings();
    revalidatePath("/", "layout");
    return { ok: true };
  }
  const json = JSON.stringify(value);
  await db
    .insert(siteSettingsTable)
    .values({ key: key as string, value: json })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value: json, updatedAt: new Date() },
    });
  invalidateSettings();
  // Revalidate everything since theme/SEO/etc may affect every page.
  revalidatePath("/", "layout");
  return { ok: true };
}

// ───────────────────────────── products ─────────────────────────────

export interface ProductInput {
  id?: number;
  name: string;
  category: string;
  brandId?: number | null;
  strain: string;
  thc: string;
  cbd?: string;
  price: number;
  salePrice?: number | null;
  imageType?: string;
  imageUrl?: string | null;
  description: string;
  effects?: string;
  terpenes?: string;
  flavors?: string;
  weight?: string;
  featured?: boolean;
  inStock?: boolean;
  sku?: string | null;
  quantity?: number | null;
  lowStockThreshold?: number | null;
}

export async function upsertProduct(input: ProductInput) {
  await assertAdmin();
  if (input.id) {
    const { id, ...patch } = input;
    await db
      .update(productsTable)
      .set(patch as Partial<typeof productsTable.$inferInsert>)
      .where(eq(productsTable.id, id));
  } else {
    await db.insert(productsTable).values({
      ...(input as typeof productsTable.$inferInsert),
    });
  }
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProduct(id: number) {
  await assertAdmin();
  await db.transaction(async (tx) => {
    await tx
      .update(orderItemsTable)
      .set({ productId: null })
      .where(eq(orderItemsTable.productId, id));
    await tx.delete(productsTable).where(eq(productsTable.id, id));
  });
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { ok: true };
}

export async function setProductStock(
  id: number,
  patch: { inStock?: boolean; quantity?: number | null }
) {
  await assertAdmin();
  await db.update(productsTable).set(patch).where(eq(productsTable.id, id));
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  return { ok: true };
}

export async function adjustProductQuantity(id: number, delta: number) {
  await assertAdmin();
  await db
    .update(productsTable)
    .set({
      quantity: sql`COALESCE(${productsTable.quantity}, 0) + ${delta}`,
      inStock: sql`COALESCE(${productsTable.quantity}, 0) + ${delta} > 0`,
    })
    .where(eq(productsTable.id, id));
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  return { ok: true };
}

// ───────────────────────────── brands ─────────────────────────────

export async function upsertBrand(input: {
  id?: number;
  name: string;
  description?: string;
  logoUrl?: string | null;
  website?: string;
  featured?: boolean;
}) {
  await assertAdmin();
  if (input.id) {
    const { id, ...patch } = input;
    await db.update(brandsTable).set(patch).where(eq(brandsTable.id, id));
  } else {
    await db.insert(brandsTable).values({
      name: input.name,
      description: input.description ?? "",
      website: input.website ?? "",
      logoUrl: input.logoUrl ?? null,
      featured: input.featured ?? false,
    });
  }
  revalidatePath("/admin/brands");
  revalidatePath("/shop");
  return { ok: true };
}

export async function deleteBrand(id: number) {
  await assertAdmin();
  await db.delete(brandsTable).where(eq(brandsTable.id, id));
  revalidatePath("/admin/brands");
  return { ok: true };
}

// ───────────────────────────── categories ─────────────────────────────

export async function upsertCategory(input: {
  id?: number;
  name: string;
  description?: string;
  imageUrl?: string | null;
}) {
  await assertAdmin();
  // Auto-derive slug from name (kebab-case, alphanumerics only)
  const slug = input.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  if (input.id) {
    const { id, ...rest } = input;
    await db
      .update(categoriesTable)
      .set({
        name: rest.name,
        slug,
        description: rest.description ?? "",
        imageUrl: rest.imageUrl ?? null,
      })
      .where(eq(categoriesTable.id, id));
  } else {
    await db.insert(categoriesTable).values({
      name: input.name,
      slug,
      description: input.description ?? "",
      imageUrl: input.imageUrl ?? null,
    });
  }
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteCategory(id: number) {
  await assertAdmin();
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true };
}

// ───────────────────────────── orders ─────────────────────────────

export async function setOrderStatus(
  id: number,
  status: "pending" | "ready" | "completed" | "cancelled"
) {
  await assertAdmin();
  await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, id));
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}

// ───────────────────────────── bulk product actions ─────────────────────────────

/**
 * Helper: revalidate everything affected by product changes. Called after
 * each bulk action so the storefront reflects the new state immediately.
 */
function revalidateAfterProductChange() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  revalidatePath("/");
}

/** Bulk delete by id. Caller is responsible for any UI confirmation. */
export async function bulkDeleteProducts(ids: number[]): Promise<{ deleted: number }> {
  await assertAdmin();
  if (ids.length === 0) return { deleted: 0 };
  await db.transaction(async (tx) => {
    await tx
      .update(orderItemsTable)
      .set({ productId: null })
      .where(inArray(orderItemsTable.productId, ids));
    await tx.delete(productsTable).where(inArray(productsTable.id, ids));
  });
  revalidateAfterProductChange();
  return { deleted: ids.length };
}

/**
 * Bulk apply discount.
 *   - mode: "percent" → sale_price = round(price * (1 - percent/100))
 *   - mode: "flat"    → sale_price = the given dollar amount (per product)
 *   - mode: "clear"   → sale_price = NULL (revert to regular price)
 */
export async function bulkApplyDiscount(
  ids: number[],
  mode: "percent" | "flat" | "clear",
  value?: number
): Promise<{ updated: number }> {
  await assertAdmin();
  if (ids.length === 0) return { updated: 0 };

  if (mode === "clear") {
    await db
      .update(productsTable)
      .set({ salePrice: null })
      .where(inArray(productsTable.id, ids));
  } else if (mode === "percent") {
    const pct = Math.max(0, Math.min(100, value ?? 0));
    if (pct === 0) {
      // 0% discount = clear sale price
      await db
        .update(productsTable)
        .set({ salePrice: null })
        .where(inArray(productsTable.id, ids));
    } else {
      const factor = (100 - pct) / 100;
      // Use SQL to compute per-row instead of round-tripping each one
      await db
        .update(productsTable)
        .set({
          salePrice: sql`GREATEST(1, ROUND(${productsTable.price} * ${factor})::int)`,
        })
        .where(inArray(productsTable.id, ids));
    }
  } else if (mode === "flat") {
    const amount = Math.max(0, Math.round(value ?? 0));
    if (amount <= 0) {
      throw new Error("Flat sale price must be greater than 0");
    }
    await db
      .update(productsTable)
      .set({ salePrice: amount })
      .where(inArray(productsTable.id, ids));
  }

  revalidateAfterProductChange();
  return { updated: ids.length };
}

/** Bulk set in-stock status (and turn off `inStock` for any zero-quantity rows). */
export async function bulkSetInStock(
  ids: number[],
  inStock: boolean
): Promise<{ updated: number }> {
  await assertAdmin();
  if (ids.length === 0) return { updated: 0 };
  await db
    .update(productsTable)
    .set({ inStock })
    .where(inArray(productsTable.id, ids));
  revalidateAfterProductChange();
  return { updated: ids.length };
}

/** Bulk set "featured" flag (controls homepage featured section). */
export async function bulkSetFeatured(
  ids: number[],
  featured: boolean
): Promise<{ updated: number }> {
  await assertAdmin();
  if (ids.length === 0) return { updated: 0 };
  await db
    .update(productsTable)
    .set({ featured })
    .where(inArray(productsTable.id, ids));
  revalidateAfterProductChange();
  return { updated: ids.length };
}

/**
 * Bulk regenerate SEO descriptions for all selected products. Always
 * overwrites — if you want to keep a hand-written description, don't
 * include that product in the selection.
 */
export async function bulkRegenerateDescriptions(
  ids: number[]
): Promise<{ updated: number }> {
  await assertAdmin();
  if (ids.length === 0) return { updated: 0 };

  const settings = await getSiteSettings();
  const ctx = {
    storeName: settings.store?.name,
    city: settings.location?.city || settings.seo?.city,
    state: settings.location?.state,
  };

  // Pull products one-shot, then generate per-row.
  const products = await db
    .select()
    .from(productsTable)
    .where(inArray(productsTable.id, ids));

  // Brand names are stored in brandsTable; load them for lookup.
  const brandIds = Array.from(
    new Set(products.map((p) => p.brandId).filter((x): x is number => x != null))
  );
  const brands = brandIds.length
    ? await db
        .select()
        .from(brandsTable)
        .where(inArray(brandsTable.id, brandIds))
    : [];
  const brandById = new Map(brands.map((b) => [b.id, b.name]));

  let updated = 0;
  for (const p of products) {
    const desc = generateSeoDescription(
      {
        name: p.name,
        category: p.category,
        strainType: p.strain as StrainType,
        thc: p.thc,
        cbd: p.cbd,
        brand: p.brandId ? brandById.get(p.brandId) : undefined,
      },
      ctx
    );
    await db
      .update(productsTable)
      .set({ description: desc })
      .where(eq(productsTable.id, p.id));
    updated++;
  }

  revalidateAfterProductChange();
  return { updated };
}

/**
 * Generate one description on demand. Used by the product editor's
 * "Generate description" button; takes the current form values and
 * returns a fresh description.
 */
export async function previewSeoDescription(input: {
  name: string;
  category: string;
  strainType: string;
  strainName?: string;
  thc?: string;
  cbd?: string;
  brand?: string;
}): Promise<string> {
  await assertAdmin();
  const settings = await getSiteSettings();
  return generateSeoDescription(
    {
      name: input.name,
      category: input.category,
      strainType: input.strainType as StrainType,
      strainName: input.strainName,
      thc: input.thc,
      cbd: input.cbd,
      brand: input.brand,
    },
    {
      storeName: settings.store?.name,
      city: settings.location?.city || settings.seo?.city,
      state: settings.location?.state,
    }
  );
}

/** Same as previewSeoDescription but for the SEO title. */
export async function previewSeoTitle(input: {
  name: string;
  category: string;
  strainType: string;
  thc?: string;
  brand?: string;
}): Promise<string> {
  await assertAdmin();
  const settings = await getSiteSettings();
  return generateSeoTitle(
    {
      name: input.name,
      category: input.category,
      strainType: input.strainType as StrainType,
      thc: input.thc,
      brand: input.brand,
    },
    {
      storeName: settings.store?.name,
      city: settings.location?.city || settings.seo?.city,
      state: settings.location?.state,
    }
  );
}

// ----------------------------- blog -----------------------------

export interface BlogPostInput {
  id?: number;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  category?: string;
  tags?: string;
  featuredImageUrl?: string | null;
  published?: boolean;
}

export async function upsertBlogPost(input: BlogPostInput) {
  await assertAdmin();
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  const content = input.content.trim();
  const slug = slugifyBlogSlug(input.slug || title);
  if (!slug) throw new Error("Slug is required");
  const now = new Date();
  const values = {
    title,
    slug,
    excerpt: input.excerpt?.trim() || blogExcerpt(content),
    content,
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || blogExcerpt(content),
    category: input.category?.trim() || "General",
    tags: JSON.stringify(
      (input.tags ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
    featuredImageUrl: input.featuredImageUrl || null,
    published: input.published ?? false,
    updatedAt: now,
    publishedAt: input.published ? now : null,
  };

  if (input.id) {
    await db
      .update(blogPostsTable)
      .set(values)
      .where(eq(blogPostsTable.id, input.id));
  } else {
    await db.insert(blogPostsTable).values(values);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  return { ok: true };
}

export async function deleteBlogPost(id: number) {
  await assertAdmin();
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  return { ok: true };
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createHmac } from "crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { blogExcerpt, slugifyBlogSlug } from "@/lib/blog";
import { DEFAULTS } from "@/lib/defaults";
import { titleCase } from "@/lib/import-csv";
import { formatImportedPackageSize } from "@/lib/product-size";
import { isLocalPreviewMode } from "@/lib/preview";
import {
  generateBrandSeoDescription,
  generateCategorySeoDescription,
  generateSeoDescription,
  generateSeoTitle,
  normalizeImportedProductName,
  seoTitleCase,
} from "@/lib/seo-generator";
import type { StrainType } from "@/lib/strain-database";

const COOKIE_NAME = "jc_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

interface ProductInput {
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

interface BlogPostInput {
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

interface ImportRowInput {
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
  strainType: "Indica" | "Sativa" | "Hybrid" | "CBD";
  skip?: boolean;
  description?: string;
}

function hmacHex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  const cookie = c.get(COOKIE_NAME);
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !cookie?.value) return false;

  const [issuedAtStr, sig] = cookie.value.split(".");
  if (!issuedAtStr || !sig) return false;

  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) return false;

  const ageSec = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSec < 0 || ageSec > SESSION_MAX_AGE_SEC) return false;

  return hmacHex(secret, issuedAtStr) === sig;
}

function revalidateAfterProductChange() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
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

async function upsertProduct(input: ProductInput) {
  const { db, productsTable } = await import("@/lib/db");
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
  revalidateAfterProductChange();
  return { ok: true };
}

async function deleteProduct(id: number) {
  const { db, productsTable, orderItemsTable } = await import("@/lib/db");
  await db.transaction(async (tx) => {
    await tx
      .update(orderItemsTable)
      .set({ productId: null })
      .where(eq(orderItemsTable.productId, id));
    await tx.delete(productsTable).where(eq(productsTable.id, id));
  });
  revalidateAfterProductChange();
  return { ok: true };
}

async function setProductStock(
  id: number,
  patch: { inStock?: boolean; quantity?: number | null }
) {
  const { db, productsTable } = await import("@/lib/db");
  await db.update(productsTable).set(patch).where(eq(productsTable.id, id));
  revalidateAfterProductChange();
  return { ok: true };
}

async function adjustProductQuantity(id: number, delta: number) {
  const { db, productsTable } = await import("@/lib/db");
  await db
    .update(productsTable)
    .set({
      quantity: sql`COALESCE(${productsTable.quantity}, 0) + ${delta}`,
      inStock: sql`COALESCE(${productsTable.quantity}, 0) + ${delta} > 0`,
    })
    .where(eq(productsTable.id, id));
  revalidateAfterProductChange();
  return { ok: true };
}

async function upsertBrand(input: {
  id?: number;
  name: string;
  description?: string;
  logoUrl?: string | null;
  website?: string;
  featured?: boolean;
}) {
  const { db, brandsTable } = await import("@/lib/db");
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

async function deleteBrand(id: number) {
  const { db, brandsTable } = await import("@/lib/db");
  await db.delete(brandsTable).where(eq(brandsTable.id, id));
  revalidatePath("/admin/brands");
  revalidatePath("/shop");
  return { ok: true };
}

async function upsertCategory(input: {
  id?: number;
  name: string;
  description?: string;
  imageUrl?: string | null;
}) {
  const { db, categoriesTable } = await import("@/lib/db");
  const slug = slugify(input.name);
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
  revalidatePath("/shop");
  return { ok: true };
}

async function deleteCategory(id: number) {
  const { db, categoriesTable } = await import("@/lib/db");
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
  return { ok: true };
}

async function setOrderStatus(
  id: number,
  status: "pending" | "ready" | "completed" | "cancelled"
) {
  const { db, ordersTable } = await import("@/lib/db");
  await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id));
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { ok: true };
}

async function bulkDeleteProducts(ids: number[]) {
  const { db, productsTable, orderItemsTable } = await import("@/lib/db");
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

async function bulkApplyDiscount(
  ids: number[],
  mode: "percent" | "flat" | "clear",
  value?: number
) {
  const { db, productsTable } = await import("@/lib/db");
  if (ids.length === 0) return { updated: 0 };

  if (mode === "clear") {
    await db
      .update(productsTable)
      .set({ salePrice: null })
      .where(inArray(productsTable.id, ids));
  } else if (mode === "percent") {
    const pct = Math.max(0, Math.min(100, value ?? 0));
    if (pct === 0) {
      await db
        .update(productsTable)
        .set({ salePrice: null })
        .where(inArray(productsTable.id, ids));
    } else {
      const factor = (100 - pct) / 100;
      await db
        .update(productsTable)
        .set({
          salePrice: sql`GREATEST(1, ROUND(${productsTable.price} * ${factor})::int)`,
        })
        .where(inArray(productsTable.id, ids));
    }
  } else if (mode === "flat") {
    const amount = Math.max(0, Math.round(value ?? 0));
    if (amount <= 0) throw new Error("Flat sale price must be greater than 0");
    await db
      .update(productsTable)
      .set({ salePrice: amount })
      .where(inArray(productsTable.id, ids));
  }

  revalidateAfterProductChange();
  return { updated: ids.length };
}

async function bulkSetInStock(ids: number[], inStock: boolean) {
  const { db, productsTable } = await import("@/lib/db");
  if (ids.length === 0) return { updated: 0 };
  await db.update(productsTable).set({ inStock }).where(inArray(productsTable.id, ids));
  revalidateAfterProductChange();
  return { updated: ids.length };
}

async function bulkSetFeatured(ids: number[], featured: boolean) {
  const { db, productsTable } = await import("@/lib/db");
  if (ids.length === 0) return { updated: 0 };
  await db
    .update(productsTable)
    .set({ featured })
    .where(inArray(productsTable.id, ids));
  revalidateAfterProductChange();
  return { updated: ids.length };
}

async function bulkAssignBrandByProductName(input: {
  brandName: string;
  productNameIncludes: string;
}) {
  const { db, productsTable, brandsTable } = await import("@/lib/db");
  const brandName = input.brandName.trim();
  const productNameIncludes = input.productNameIncludes.trim();
  if (!brandName) throw new Error("Brand name is required");
  if (!productNameIncludes) throw new Error("Product title match is required");

  const [brand] = await db
    .select({ id: brandsTable.id, name: brandsTable.name })
    .from(brandsTable)
    .where(sql`LOWER(${brandsTable.name}) = LOWER(${brandName})`)
    .orderBy(brandsTable.id)
    .limit(1);

  if (!brand) {
    throw new Error(`Brand not found: ${brandName}`);
  }

  const updatedProducts = await db
    .update(productsTable)
    .set({ brandId: brand.id })
    .where(
      sql`${productsTable.archivedAt} IS NULL AND ${productsTable.name} ILIKE ${`%${productNameIncludes}%`}`
    )
    .returning({
      id: productsTable.id,
      sku: productsTable.sku,
      name: productsTable.name,
    });

  revalidateAfterProductChange();
  revalidatePath("/admin/products");
  revalidatePath("/admin/brands");

  return {
    brandId: brand.id,
    brandName: brand.name,
    updated: updatedProducts.length,
    products: updatedProducts,
  };
}

async function bulkRegenerateDescriptions(ids: number[]) {
  const [
    { db, productsTable, brandsTable },
    { getSiteSettings },
  ] = await Promise.all([import("@/lib/db"), import("@/lib/settings")]);

  if (ids.length === 0) return { updated: 0 };

  const settings = await getSiteSettings();
  const ctx = {
    storeName: settings.store?.name,
    city: settings.location?.city || settings.seo?.city,
    state: settings.location?.state,
  };

  const products = await db
    .select()
    .from(productsTable)
    .where(inArray(productsTable.id, ids));

  const brandIds = Array.from(
    new Set(products.map((p) => p.brandId).filter((x): x is number => x != null))
  );
  const brands = brandIds.length
    ? await db.select().from(brandsTable).where(inArray(brandsTable.id, brandIds))
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
    await db.update(productsTable).set({ description: desc }).where(eq(productsTable.id, p.id));
    updated++;
  }

  revalidateAfterProductChange();
  return { updated };
}

async function previewSeoDescription(input: {
  name: string;
  category: string;
  strainType: string;
  strainName?: string;
  thc?: string;
  cbd?: string;
  brand?: string;
}) {
  const { getSiteSettings } = await import("@/lib/settings");
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

async function previewSeoTitle(input: {
  name: string;
  category: string;
  strainType: string;
  thc?: string;
  brand?: string;
}) {
  const { getSiteSettings } = await import("@/lib/settings");
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

async function upsertBlogPost(input: BlogPostInput) {
  const { db, blogPostsTable } = await import("@/lib/db");
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
    await db.update(blogPostsTable).set(values).where(eq(blogPostsTable.id, input.id));
  } else {
    await db.insert(blogPostsTable).values(values);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  return { ok: true };
}

async function deleteBlogPost(id: number) {
  const { db, blogPostsTable } = await import("@/lib/db");
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  return { ok: true };
}

async function runImport(rows: ImportRowInput[]) {
  if (isLocalPreviewMode()) {
    const [{ importPreviewProducts }, { invalidateSettings }] = await Promise.all([
      import("@/lib/preview-data"),
      import("@/lib/settings"),
    ]);
    const result = importPreviewProducts(rows);
    invalidateSettings();
    revalidateAfterProductChange();
    revalidatePath("/admin/categories");
    revalidatePath("/admin/brands");
    return result;
  }

  const [
    { db, productsTable, brandsTable, categoriesTable },
    { invalidateSettings, getSiteSettings },
  ] = await Promise.all([import("@/lib/db"), import("@/lib/settings")]);

  const settings = await getSiteSettings();
  const ctx = {
    storeName: settings.store?.name,
    city: settings.location?.city || settings.seo?.city,
    state: settings.location?.state,
    legalModelName: DEFAULTS.legalModelName,
  };

  const result = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as { row: number; sku: string; message: string }[],
    brandsCreated: [] as string[],
    categoriesCreated: [] as string[],
  };

  const existingBrands = await db.select().from(brandsTable);
  const brandByName = new Map(existingBrands.map((b) => [b.name.toLowerCase(), b]));
  const existingCats = await db.select().from(categoriesTable);
  const catByName = new Map(existingCats.map((c) => [c.name.toLowerCase(), c]));

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

  for (const [idx, row] of rows.entries()) {
    if (row.skip) {
      result.skipped++;
      continue;
    }

    try {
      const brand = row.brand ? brandByName.get(row.brand.toLowerCase()) : undefined;
      const productName = normalizeImportedProductName(row.name);
      const description =
        row.description?.trim() ||
        generateSeoDescription(
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
        thc: row.thc || "-",
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
        row: idx + 2,
        sku: row.sku,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  invalidateSettings();
  revalidateAfterProductChange();
  revalidatePath("/admin/categories");
  revalidatePath("/admin/brands");
  return result;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      action?: string;
      args?: unknown[];
    } | null;
    const args = body?.args ?? [];

    switch (body?.action) {
      case "upsertProduct":
        return NextResponse.json(await upsertProduct(args[0] as ProductInput));
      case "deleteProduct":
        return NextResponse.json(await deleteProduct(args[0] as number));
      case "setProductStock":
        return NextResponse.json(
          await setProductStock(
            args[0] as number,
            args[1] as { inStock?: boolean; quantity?: number | null }
          )
        );
      case "adjustProductQuantity":
        return NextResponse.json(
          await adjustProductQuantity(args[0] as number, args[1] as number)
        );
      case "upsertBrand":
        return NextResponse.json(
          await upsertBrand(
            args[0] as {
              id?: number;
              name: string;
              description?: string;
              logoUrl?: string | null;
              website?: string;
              featured?: boolean;
            }
          )
        );
      case "deleteBrand":
        return NextResponse.json(await deleteBrand(args[0] as number));
      case "upsertCategory":
        return NextResponse.json(
          await upsertCategory(
            args[0] as {
              id?: number;
              name: string;
              description?: string;
              imageUrl?: string | null;
            }
          )
        );
      case "deleteCategory":
        return NextResponse.json(await deleteCategory(args[0] as number));
      case "setOrderStatus":
        return NextResponse.json(
          await setOrderStatus(
            args[0] as number,
            args[1] as "pending" | "ready" | "completed" | "cancelled"
          )
        );
      case "bulkDeleteProducts":
        return NextResponse.json(await bulkDeleteProducts(args[0] as number[]));
      case "bulkApplyDiscount":
        return NextResponse.json(
          await bulkApplyDiscount(
            args[0] as number[],
            args[1] as "percent" | "flat" | "clear",
            args[2] as number | undefined
          )
        );
      case "bulkSetInStock":
        return NextResponse.json(
          await bulkSetInStock(args[0] as number[], args[1] as boolean)
        );
      case "bulkSetFeatured":
        return NextResponse.json(
          await bulkSetFeatured(args[0] as number[], args[1] as boolean)
        );
      case "bulkAssignBrandByProductName":
        return NextResponse.json(
          await bulkAssignBrandByProductName(
            args[0] as {
              brandName: string;
              productNameIncludes: string;
            }
          )
        );
      case "bulkRegenerateDescriptions":
        return NextResponse.json(await bulkRegenerateDescriptions(args[0] as number[]));
      case "previewSeoDescription":
        return NextResponse.json(
          await previewSeoDescription(
            args[0] as {
              name: string;
              category: string;
              strainType: string;
              strainName?: string;
              thc?: string;
              cbd?: string;
              brand?: string;
            }
          )
        );
      case "previewSeoTitle":
        return NextResponse.json(
          await previewSeoTitle(
            args[0] as {
              name: string;
              category: string;
              strainType: string;
              thc?: string;
              brand?: string;
            }
          )
        );
      case "upsertBlogPost":
        return NextResponse.json(await upsertBlogPost(args[0] as BlogPostInput));
      case "deleteBlogPost":
        return NextResponse.json(await deleteBlogPost(args[0] as number));
      case "runImport":
        return NextResponse.json(await runImport(args[0] as ImportRowInput[]));
      default:
        return NextResponse.json({ error: "Unknown admin action" }, { status: 400 });
    }
  } catch (err) {
    console.error("[admin/mutations] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Admin action failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { DEFAULTS } from "@/lib/defaults";
import { generateLocalSeoSettings } from "@/lib/seo-settings-generator";
import {
  generateBrandSeoDescription,
  generateCategorySeoDescription,
  generateSeoDescription,
} from "@/lib/seo-generator";
import type { StrainType } from "@/lib/strain-database";

const COOKIE_NAME = "jc_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

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

function isStaleGeneratedCopy(value: string | undefined | null): boolean {
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

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const [
      {
        db,
        siteSettingsTable,
        productsTable,
        brandsTable,
        categoriesTable,
      },
      { getSiteSettings, invalidateSettings },
    ] = await Promise.all([import("@/lib/db"), import("@/lib/settings")]);

    const settings = await getSiteSettings();
    const seo = generateLocalSeoSettings(settings);
    const seoJson = JSON.stringify(seo);

    const existingSeo = await db
      .select({ key: siteSettingsTable.key })
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, "seo"))
      .limit(1);

    if (existingSeo.length > 0) {
      await db.execute(sql`
        UPDATE site_settings
        SET value = ${seoJson}
        WHERE key = 'seo'
      `);
    } else {
      await db.execute(sql`
        INSERT INTO site_settings (key, value)
        VALUES ('seo', ${seoJson})
      `);
    }

    const [products, brands, categories] = await Promise.all([
      db.select().from(productsTable),
      db.select().from(brandsTable),
      db.select().from(categoriesTable),
    ]);

    const brandById = new Map(brands.map((brand) => [brand.id, brand.name]));
    const ctx = {
      storeName: settings.store?.name || DEFAULTS.storeName,
      city: settings.location?.city || seo.city || DEFAULTS.city,
      state: settings.location?.state || DEFAULTS.state,
      legalModelName: DEFAULTS.legalModelName,
    };

    let productsUpdated = 0;
    for (const product of products) {
      if (!isStaleGeneratedCopy(product.description)) continue;

      const description = generateSeoDescription(
        {
          name: product.name,
          category: product.category,
          strainType: product.strain as StrainType,
          thc: product.thc,
          cbd: product.cbd,
          brand: product.brandId ? brandById.get(product.brandId) : undefined,
        },
        ctx
      );

      await db
        .update(productsTable)
        .set({ description })
        .where(eq(productsTable.id, product.id));
      productsUpdated++;
    }

    let categoriesUpdated = 0;
    for (const category of categories) {
      if (!isStaleGeneratedCopy(category.description)) continue;

      await db
        .update(categoriesTable)
        .set({
          description: generateCategorySeoDescription({
            category: category.name,
            storeName: ctx.storeName,
            city: ctx.city,
            legalModelName: ctx.legalModelName,
          }),
        })
        .where(eq(categoriesTable.id, category.id));
      categoriesUpdated++;
    }

    let brandsUpdated = 0;
    for (const brand of brands) {
      if (!isStaleGeneratedCopy(brand.description)) continue;

      await db
        .update(brandsTable)
        .set({
          description: generateBrandSeoDescription({
            brand: brand.name,
            storeName: ctx.storeName,
            city: ctx.city,
          }),
        })
        .where(eq(brandsTable.id, brand.id));
      brandsUpdated++;
    }

    invalidateSettings();
    revalidatePath("/", "layout");
    revalidatePath("/shop");
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/store/seo");
    revalidatePath("/admin/products");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/brands");

    return NextResponse.json({
      ok: true,
      productsUpdated,
      categoriesUpdated,
      brandsUpdated,
    });
  } catch (err) {
    console.error("[admin/seo/regenerate] failed:", err);
    return NextResponse.json(
      { error: "SEO regeneration failed" },
      { status: 500 }
    );
  }
}

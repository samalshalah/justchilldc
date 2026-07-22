import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { getProducts, getCategories, getBrands } from "@/lib/data";
import { resolveShopConfig } from "@/lib/shop-config";
import { ShopClient } from "@/components/ShopClient";
import { DEFAULTS } from "@/lib/defaults";
import { complianceModelName } from "@/lib/compliance";
import { openGraphImages } from "@/lib/metadata-images";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    strain?: string;
    brand?: string;
    effect?: string;
    size?: string;
  }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const [settings, brands] = await Promise.all([getSiteSettings(), getBrands()]);
  const seo = settings.seo ?? {};
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = seo.city || DEFAULTS.city;
  const brandName = sp.brand
    ? brands.find((brand) => brand.id === Number(sp.brand))?.name
    : undefined;

  let pageLabel = "Shop";
  if (sp.category) pageLabel = `${sp.category}`;
  if (sp.strain) pageLabel = `${sp.strain} ${pageLabel}`;
  if (sp.effect) pageLabel = `${sp.effect} ${pageLabel}`;
  if (sp.size) pageLabel = `${sp.size} ${pageLabel}`;
  if (brandName) pageLabel = `${brandName} ${pageLabel}`;

  const titleRaw = seo.page_shop?.title || seo.title_template || DEFAULTS.seoTitleTemplate;
  const title = titleRaw
    .replace("{page}", pageLabel)
    .replace("{store}", storeName)
    .replace("{city}", city);

  const description =
    seo.page_shop?.description ||
    `Browse ${storeName}'s curated menu by category, brand, strain type, and feel with simple local ordering.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/shop" },
    openGraph: { title, description, url: "/shop", images: openGraphImages(settings) },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    strain?: string;
    effect?: string;
    brand?: string;
    size?: string;
    q?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const sp = await searchParams;
  const [settings, products, categories, brands] = await Promise.all([
    getSiteSettings(),
    getProducts({}),
    getCategories(),
    getBrands(),
  ]);

  const config = resolveShopConfig(settings);
  const storeName = settings.store?.name || DEFAULTS.storeName;

  return (
    <>
      <section className="bg-card border-b border-border/50 pt-12 pb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
            {config.h1}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {config.subtitle ||
              `Curated premium products from ${storeName}, available under ${complianceModelName(settings)}.`}
          </p>
        </div>
      </section>
      <ShopClient
        products={products}
        categories={categories}
        brands={brands}
        initialCategory={sp.category}
        initialStrain={sp.strain}
        initialEffect={sp.effect}
        initialBrand={sp.brand}
        initialSize={sp.size}
        initialSearch={sp.q}
        initialSort={sp.sort}
        initialPage={sp.page ? parseInt(sp.page, 10) : 1}
        initialMinPrice={sp.minPrice ? parseInt(sp.minPrice, 10) : undefined}
        initialMaxPrice={sp.maxPrice ? parseInt(sp.maxPrice, 10) : undefined}
        config={config}
      />
    </>
  );
}

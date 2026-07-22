import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrands, getCategories, getProducts } from "@/lib/data";
import { getSiteSettings } from "@/lib/settings";
import { resolveShopConfig } from "@/lib/shop-config";
import { ShopClient } from "@/components/ShopClient";
import { FaqJsonLd, FaqSection } from "@/components/FaqJsonLd";
import { DEFAULTS } from "@/lib/defaults";
import { generateCategorySeoDescription } from "@/lib/seo-generator";
import { buildCategoryFaqs } from "@/lib/seo-faq";
import { categoryPath, findCategoryBySlug } from "@/lib/url";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ category: slug }, settings, categories] = await Promise.all([
    params,
    getSiteSettings(),
    getCategories(),
  ]);
  const category = findCategoryBySlug(categories, slug);
  if (!category) return { title: "Category not found" };

  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const title = `${category.name} in ${city} | ${storeName}`;
  const description =
    category.description ||
    generateCategorySeoDescription({
      category: category.name,
      storeName,
      city,
      legalModelName: DEFAULTS.legalModelName,
    });

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: categoryPath(category.name) },
    openGraph: { title, description, url: categoryPath(category.name) },
  };
}

export default async function CategoryShopPage({ params, searchParams }: Props) {
  const [{ category: slug }, sp] = await Promise.all([params, searchParams]);
  const [settings, products, categories, brands] = await Promise.all([
    getSiteSettings(),
    getProducts({}),
    getCategories(),
    getBrands(),
  ]);

  const category = findCategoryBySlug(categories, slug);
  if (!category) notFound();

  const config = resolveShopConfig(settings);
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const categoryProducts = products.filter((product) => product.category === category.name);
  const description =
    category.description ||
    generateCategorySeoDescription({
      category: category.name,
      storeName,
      city,
      legalModelName: DEFAULTS.legalModelName,
    });
  const faqs = buildCategoryFaqs(settings, category.name);

  return (
    <>
      <FaqJsonLd items={faqs} />
      <section className="bg-card border-b border-border/50 pt-12 pb-8">
        <div className="container mx-auto px-4">
          <Link
            href="/shop"
            className="text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            Back to all products
          </Link>
          <div className="mt-4 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
              {category.name} in {city}
            </h1>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
            <p className="text-sm text-muted-foreground/70 mt-3">
              {categoryProducts.length} product{categoryProducts.length === 1 ? "" : "s"} available
            </p>
          </div>
        </div>
      </section>
      <ShopClient
        products={products}
        categories={categories}
        brands={brands}
        initialCategory={category.name}
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
      <FaqSection items={faqs} />
    </>
  );
}

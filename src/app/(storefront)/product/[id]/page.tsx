import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Leaf, ShieldCheck, Star, Truck, Info } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { getBrands, getProductById, getProducts } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { AddToCartButton } from "@/components/AddToCartButton";
import {
  isProductLogoFallback,
  isStorageImageUrl,
  productImageFitClass,
  productImageUrl,
} from "@/lib/images";
import { resolvePdpConfig } from "@/lib/shop-config";
import { DEFAULTS } from "@/lib/defaults";
import { complianceFooterText } from "@/lib/compliance";
import { getProductFeelings } from "@/lib/product-facets";
import {
  generateProductPageSeoCopy,
  generateSeoDescription,
  generateSeoTitle,
  seoTitleCase,
} from "@/lib/seo-generator";
import type { StrainType } from "@/lib/strain-database";

function parseJsonArr(s: string | undefined | null): string[] {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasDetailValue(value: string | undefined | null): value is string {
  const v = value?.trim();
  return Boolean(v) && v !== "-" && v !== "\u2014" && v !== "â€”";
}

type ProductSeoTemplateContext = {
  product: string;
  store: string;
  city: string;
  state: string;
  category: string;
  strain: string;
  thc: string;
  cbd: string;
};

function applyProductSeoTemplate(
  template: string,
  context: ProductSeoTemplateContext
): string {
  const replacements: Record<string, string> = {
    product: context.product,
    page: context.product,
    store: context.store,
    city: context.city,
    state: context.state,
    category: context.category,
    strain: context.strain,
    thc: context.thc,
    cbd: context.cbd,
  };

  return template
    .replace(
      /\{(product|page|store|city|state|category|strain|thc|cbd)\}/g,
      (_match, key: string) => replacements[key] ?? ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const productId = parseInt(id, 10);
  const [settings, product, brands] = await Promise.all([
    getSiteSettings(),
    getProductById(productId),
    getBrands(),
  ]);

  if (!product) return { title: "Product not found" };

  const brand = brands.find((item) => item.id === product.brandId);
  const seo = settings.seo ?? {};
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || seo.city || DEFAULTS.city;
  const state = settings.location?.state || DEFAULTS.state;
  const seoCtx = {
    storeName,
    city,
    state,
    legalModelName: DEFAULTS.legalModelName,
  };
  const productThc = hasDetailValue(product.thc) ? product.thc : "";
  const productCbd = hasDetailValue(product.cbd) ? product.cbd : "";
  const productSeoTitle = generateSeoTitle(
    {
      name: product.name,
      category: product.category,
      strainType: product.strain as StrainType,
      thc: productThc,
      cbd: productCbd,
      brand: brand?.name,
    },
    seoCtx
  );
  const productDisplayName = seoTitleCase(product.name);
  const productTemplateContext: ProductSeoTemplateContext = {
    product: productDisplayName,
    store: storeName,
    city,
    state,
    category: product.category,
    strain: product.strain,
    thc: productThc,
    cbd: productCbd,
  };

  const titleOverride = seo.page_product?.title?.trim();
  const title = titleOverride
    ? applyProductSeoTemplate(titleOverride, productTemplateContext)
    : productSeoTitle;

  const descriptionOverride = seo.page_product?.description?.trim();
  const description = descriptionOverride
    ? applyProductSeoTemplate(descriptionOverride, productTemplateContext)
    : generateSeoDescription(
      {
        name: product.name,
        category: product.category,
        strainType: product.strain as StrainType,
        thc: productThc,
        cbd: productCbd,
        brand: brand?.name,
      },
      seoCtx
    );

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title,
      description,
      url: `/product/${product.id}`,
      type: "website",
      images: [{ url: productImageUrl(product) }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!productId || isNaN(productId)) notFound();

  const [settings, productOrNull, related, brands] = await Promise.all([
    getSiteSettings(),
    getProductById(productId),
    getProducts({ inStockOnly: true }),
    getBrands(),
  ]);
  const product = productOrNull ?? notFound();

  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const state = settings.location?.state || DEFAULTS.state;
  const seoCtx = {
    storeName,
    city,
    state,
    legalModelName: DEFAULTS.legalModelName,
  };
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (settings.seo?.canonical_domain
      ? `https://${settings.seo.canonical_domain}`
      : undefined);

  const brand = brands.find((item) => item.id === product.brandId);
  const brandName = brand?.name;
  const effects = parseJsonArr(product.effects);
  const terpenes = parseJsonArr(product.terpenes);
  const flavors = parseJsonArr(product.flavors);
  const feelings = getProductFeelings(product);
  const imageUrl = productImageUrl(product);
  const logoFallback = isProductLogoFallback(product);
  const productThc = hasDetailValue(product.thc) ? product.thc : "";
  const productCbd = hasDetailValue(product.cbd) ? product.cbd : "";
  const seoCopy = generateProductPageSeoCopy(
    {
      name: product.name,
      category: product.category,
      strainType: product.strain as StrainType,
      thc: productThc,
      cbd: productCbd,
      brand: brandName,
      description: product.description,
      effects,
      terpenes,
      flavors,
      weight: product.weight,
      inStock: product.inStock,
    },
    seoCtx
  );
  const displayName = product.name;
  const categoryHref = `/shop?category=${encodeURIComponent(product.category)}`;
  const strainHref = `/shop?strain=${encodeURIComponent(product.strain)}`;
  const brandHref = product.brandId ? `/shop?brand=${product.brandId}` : null;

  const pdp = resolvePdpConfig(settings);

  // Algorithm-based related products selection
  const relatedPool = related.filter((p) => p.id !== product.id);
  let relatedProducts: typeof relatedPool = [];
  switch (pdp.relatedSource) {
    case "same_strain":
      relatedProducts = relatedPool.filter((p) => p.strain === product.strain);
      break;
    case "featured":
      relatedProducts = relatedPool.filter((p) => p.featured);
      break;
    case "newest":
      relatedProducts = [...relatedPool].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "same_category":
    default:
      relatedProducts = relatedPool.filter((p) => p.category === product.category);
      break;
  }
  // Sort featured-first within the matched pool, then trim
  relatedProducts = [...relatedProducts]
    .sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1))
    .slice(0, pdp.relatedCount);

  const showSpecs = pdp.showSpecs;
  const showEffects = pdp.showEffects;
  const showTerpenes = pdp.showTerpenes;
  const showFlavors = pdp.showFlavors;
  const showTrustBadges = pdp.showTrustBadges;
  const showRelated = pdp.showRelated;
  const showBreadcrumb = pdp.showBreadcrumb;
  const showImageGradient = settings.theme_config?.product_image_gradient ?? true;

  // Product JSON-LD
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: displayName,
    description: seoCopy.shortDescription,
    image: siteUrl ? `${siteUrl}${imageUrl}` : imageUrl,
    sku: product.sku || `JC-${product.id}`,
    category: product.category,
    ...(brandName ? { brand: { "@type": "Brand", name: brandName } } : {}),
    offers: {
      "@type": "Offer",
      price: product.salePrice ?? product.price,
      priceCurrency: "USD",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: siteUrl ? `${siteUrl}/product/${product.id}` : `/product/${product.id}`,
      seller: { "@type": "Store", name: storeName },
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Strain", value: product.strain },
      ...(productThc ? [{ "@type": "PropertyValue", name: "THC", value: productThc }] : []),
      ...(productCbd ? [{ "@type": "PropertyValue", name: "CBD", value: productCbd }] : []),
      ...(product.weight
        ? [{ "@type": "PropertyValue", name: "Weight", value: product.weight }]
        : []),
      ...(effects.length
        ? [{ "@type": "PropertyValue", name: "Effects", value: effects.join(", ") }]
        : []),
      ...(terpenes.length
        ? [{ "@type": "PropertyValue", name: "Terpenes", value: terpenes.join(", ") }]
        : []),
      ...(flavors.length
        ? [{ "@type": "PropertyValue", name: "Flavors", value: flavors.join(", ") }]
        : []),
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seoCopy.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl ?? "/" },
      { "@type": "ListItem", position: 2, name: "Shop", item: siteUrl ? `${siteUrl}/shop` : "/shop" },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category,
        item: siteUrl
          ? `${siteUrl}/shop?category=${encodeURIComponent(product.category)}`
          : `/shop?category=${encodeURIComponent(product.category)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: displayName,
        item: siteUrl ? `${siteUrl}/product/${product.id}` : `/product/${product.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {showBreadcrumb && (
        <section className="bg-card border-b border-border/50 pt-8 pb-4">
          <div className="container mx-auto px-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Link>
          </div>
        </section>
      )}

      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image */}
            <div
              className={`relative aspect-square overflow-hidden rounded-3xl border border-border/50 ${
                logoFallback ? "bg-white" : "bg-card"
              }`}
            >
              {showImageGradient && !logoFallback && (
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent z-10" />
              )}
              <Image
                src={imageUrl}
                alt={displayName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized={isStorageImageUrl(imageUrl)}
                className={productImageFitClass(product)}
              />
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link
                  href={categoryHref}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors"
                >
                  {product.category}
                </Link>
                <Link
                  href={strainHref}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-foreground border border-primary/30 hover:bg-primary/30 transition-colors"
                >
                  {product.strain}
                </Link>
                {brandHref && brandName && (
                  <Link
                    href={brandHref}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-card text-muted-foreground border border-border hover:text-foreground hover:border-accent transition-colors"
                  >
                    {brandName}
                  </Link>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
                {displayName}
              </h1>
              <p className="text-muted-foreground text-base mb-5 leading-relaxed">
                {seoCopy.shortDescription}
              </p>

              <div className="flex items-baseline gap-3 mb-6">
                {product.salePrice ? (
                  <>
                    <span className="text-4xl font-bold text-accent">
                      ${product.salePrice}
                    </span>
                    <span className="text-2xl text-foreground/40 line-through">
                      ${product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-accent">
                    ${product.price}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  Price
                </span>
              </div>

              {showSpecs && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {productThc && (
                    <div className="bg-card border border-border rounded-xl p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        THC
                      </p>
                      <p className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-accent" />
                        {productThc}
                      </p>
                    </div>
                  )}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      CBD
                    </p>
                    <p className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-accent" />
                      {product.cbd}
                    </p>
                  </div>
                  {product.weight && (
                    <div className="bg-card border border-border rounded-xl p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Size
                      </p>
                      <p className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Info className="w-4 h-4 text-accent" />
                        {product.weight}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {showEffects && effects.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                    Effects
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {effects.map((eff) => (
                      <span
                        key={eff}
                        className="px-3 py-1 rounded-full text-sm bg-card border border-border text-foreground"
                      >
                        {eff}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {showTerpenes && terpenes.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                    Terpenes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {terpenes.map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1 rounded-full text-sm bg-card border border-border text-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {showFlavors && flavors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider mb-2">
                    Flavors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {flavors.map((f) => (
                      <span
                        key={f}
                        className="px-3 py-1 rounded-full text-sm bg-card border border-border text-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <AddToCartButton product={product} />

              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {complianceFooterText(settings)}
              </p>

              {showTrustBadges && (
                <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-border">
                  <div className="text-center">
                    <ShieldCheck className="w-6 h-6 mx-auto text-accent mb-1" />
                    <p className="text-xs text-muted-foreground">Lab Tested</p>
                  </div>
                  <div className="text-center">
                    <Star className="w-6 h-6 mx-auto text-accent mb-1" />
                    <p className="text-xs text-muted-foreground">Top Shelf</p>
                  </div>
                  <div className="text-center">
                    <Truck className="w-6 h-6 mx-auto text-accent mb-1" />
                    <p className="text-xs text-muted-foreground">Fast Pickup</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-card/20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8">
            <article className="space-y-7">
              <div>
                <p className="text-xs uppercase tracking-widest text-accent font-bold mb-2">
                  Product guide
                </p>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                  {seoCopy.aboutHeading}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {seoCopy.aboutBody}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">
                  {seoCopy.profileHeading}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {seoCopy.profileBody}
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                  {seoCopy.localHeading}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {seoCopy.localBody}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={categoryHref}
                  className="px-4 py-2 rounded-full bg-card border border-border text-sm text-foreground hover:border-accent transition-colors"
                >
                  Shop more {product.category}
                </Link>
                <Link
                  href={strainHref}
                  className="px-4 py-2 rounded-full bg-card border border-border text-sm text-foreground hover:border-accent transition-colors"
                >
                  Shop {product.strain} products
                </Link>
                {brandHref && brandName && (
                  <Link
                    href={brandHref}
                    className="px-4 py-2 rounded-full bg-card border border-border text-sm text-foreground hover:border-accent transition-colors"
                  >
                    Shop {brandName}
                  </Link>
                )}
              </div>
            </article>

            <aside className="bg-card border border-border rounded-2xl p-5 self-start">
              <h2 className="text-xl font-display font-bold text-foreground mb-4">
                Product details
              </h2>
              <dl className="divide-y divide-border">
                {seoCopy.detailFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="py-3 grid grid-cols-[110px_1fr] gap-4"
                  >
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      {fact.label}
                    </dt>
                    <dd className="text-sm text-foreground font-medium">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {feelings.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-bold mb-2">
                    Shop by feel
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {feelings.slice(0, 8).map((effect) => (
                      <Link
                        key={effect}
                        href={`/shop?effect=${encodeURIComponent(effect)}`}
                        className="px-3 py-1.5 rounded-full bg-background border border-border text-xs text-foreground hover:border-accent transition-colors"
                      >
                        {effect}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-widest text-accent font-bold mb-2">
              Product FAQs
            </p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
              Questions about {displayName}
            </h2>
            <div className="grid gap-4">
              {seoCopy.faqs.map((faq) => (
                <div key={faq.question} className="border-b border-border pb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showRelated && relatedProducts.length > 0 && (
        <section className="py-12 bg-card/30 border-t border-border/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">
              You may also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p, idx) => (
                <ProductCard key={p.id} product={p} index={idx} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

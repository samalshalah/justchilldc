import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Phone, ShoppingBag } from "lucide-react";
import { getProducts } from "@/lib/data";
import { getSiteSettings } from "@/lib/settings";
import { getLocalSeoPageBySlug } from "@/lib/local-seo-pages";
import { DEFAULTS } from "@/lib/defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, settings] = await Promise.all([params, getSiteSettings()]);
  const page = getLocalSeoPageBySlug(settings, slug);
  if (!page) return { title: "Area not found" };

  return {
    title: { absolute: page.title },
    description: page.metaDescription,
    alternates: { canonical: `/areas/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: `/areas/${page.slug}`,
      type: "website",
    },
  };
}

export default async function LocalSeoAreaPage({ params }: Props) {
  const { slug } = await params;
  const [settings, products] = await Promise.all([
    getSiteSettings(),
    getProducts({ inStockOnly: true }),
  ]);
  const page = getLocalSeoPageBySlug(settings, slug);
  if (!page) notFound();

  const storeName = settings.store?.name || DEFAULTS.storeName;
  const address = settings.store?.address || settings.location?.address;
  const phone = settings.store?.phone || settings.location?.phone;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (settings.seo?.canonical_domain
      ? `https://${settings.seo.canonical_domain}`
      : undefined);
  const categories = Array.from(new Set(products.map((product) => product.category)))
    .filter(Boolean)
    .slice(0, 8);
  const brands = Array.from(new Set(products.map((product) => product.brandName).filter(Boolean)))
    .slice(0, 8);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: page.metaDescription,
    url: siteUrl ? `${siteUrl}/areas/${page.slug}` : `/areas/${page.slug}`,
    about: {
      "@type": "LocalBusiness",
      name: storeName,
      address,
      telephone: phone,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <article className="bg-background">
        <header className="border-b border-border/50 bg-card py-12">
          <div className="container mx-auto max-w-4xl px-4">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Local Cannabis Menu
            </p>
            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-6xl">
              {page.h1}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              {page.intro}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-accent-foreground hover:bg-accent/90"
              >
                Browse live menu <ArrowRight className="h-4 w-4" />
              </Link>
              {phone && (
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3 font-bold text-foreground hover:border-accent/60"
                >
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              )}
            </div>
          </div>
        </header>

        <section className="py-12">
          <div className="container mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {page.sections.map((section) => (
                <section
                  key={section.heading}
                  className="rounded-xl border border-border/60 bg-card p-6"
                >
                  <h2 className="text-2xl font-bold text-foreground">
                    {section.heading}
                  </h2>
                  <p className="mt-3 leading-8 text-muted-foreground">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>

            <aside className="h-fit rounded-xl border border-border/60 bg-card p-5">
              <div className="mb-5 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-bold text-foreground">Menu highlights</h2>
              </div>
              {categories.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Categories
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Link
                        key={category}
                        href={`/shop?category=${encodeURIComponent(category)}`}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground/85 hover:border-accent/60 hover:text-accent"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {brands.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Brands
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {brands.map((brand) => (
                      <span
                        key={brand}
                        className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground/85"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      </article>
    </>
  );
}

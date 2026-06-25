import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, UserCheck, Star, Truck, Sparkles } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { getProducts, getCategories, getBrands } from "@/lib/data";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { HomeProductTabsCarousel, type HomeProductTabGroup } from "@/components/HomeProductTabsCarousel";
import { TESTIMONIALS } from "@/lib/testimonials";
import { categoryImageUrl, isStorageImageUrl } from "@/lib/images";
import { NewsletterForm } from "@/components/NewsletterForm";
import { DEFAULTS } from "@/lib/defaults";
import { getAvailableFeelings, getAvailableStrains, getProductFeelings } from "@/lib/product-facets";
import { categoryPath } from "@/lib/url";
import { openGraphImages } from "@/lib/metadata-images";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = settings.seo ?? {};
  const storeName = settings.store?.name || DEFAULTS.storeName;

  if (settings.maintenance_mode) {
    const title = `Site Maintenance | ${storeName}`;
    const description =
      settings.maintenance_message ||
      "The site is currently under maintenance. Please check back soon.";

    return {
      title: { absolute: title },
      description,
      alternates: { canonical: "/" },
      openGraph: { title, description, url: "/", images: openGraphImages(settings) },
      robots: { index: false, follow: false },
    };
  }

  const city = seo.city || DEFAULTS.city;

  const titleRaw = seo.page_home?.title || seo.title_template || DEFAULTS.seoTitleTemplate;
  const title = titleRaw
    .replace("{page}", "Home")
    .replace("{store}", storeName)
    .replace("{city}", city);
  const description =
    seo.page_home?.description ||
    seo.meta_description ||
    DEFAULTS.seoMetaDescription
      .replace("{store}", storeName)
      .replace("{city}", city);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", images: openGraphImages(settings) },
  };
}

const HERO_OVERLAYS: Record<string, string> = {
  theme1: "bg-gradient-to-b from-yellow-900/30 via-background/60 to-background",
  theme2: "bg-gradient-to-b from-emerald-900/30 via-background/60 to-background",
  theme3: "bg-gradient-to-b from-purple-900/30 via-background/60 to-background",
};

function t(val: string | undefined, fallback: string) {
  return val && val.trim() ? val : fallback;
}

export default async function HomePage() {
  const [settings, featured, allProducts, categories, brands] = await Promise.all([
    getSiteSettings(),
    getProducts({ featured: true, inStockOnly: true }),
    getProducts({ inStockOnly: true }),
    getCategories(),
    getBrands(),
  ]);

  const sec = settings.homepage_sections ?? {};
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const heroHeadlineFallback =
    storeName !== DEFAULTS.storeName ? storeName : DEFAULTS.heroHeadline;
  const heroSubheadlineFallback =
    settings.store?.tagline || DEFAULTS.heroSubheadline;
  const show = {
    hero: sec.hero?.visible !== false,
    categories: sec.categories?.visible !== false,
    featured: sec.featured?.visible !== false,
    why_us: sec.why_us?.visible !== false,
    testimonials: sec.testimonials?.visible !== false,
    newsletter: sec.newsletter?.visible !== false,
  };
  const sectionOrder: string[] = settings.homepage_section_order?.length
    ? settings.homepage_section_order
    : ["hero", "categories", "featured", "why_us", "testimonials", "newsletter"];

  const heroOverlay = HERO_OVERLAYS[settings.homepage_theme ?? "theme1"] ?? HERO_OVERLAYS.theme1;
  const heroBgUrl = sec.hero?.bannerImageUrl
    ? `/api/storage${sec.hero.bannerImageUrl}`
    : "/images/store/store-exterior-mural.webp";
  const heroBgUnoptimized = isStorageImageUrl(heroBgUrl);

  const categoriesWithCounts = categories.map((cat) => ({
    name: cat.name,
    imageUrl: categoryImageUrl(cat.imageUrl, cat.name),
    count: allProducts.filter((p) => p.category === cat.name).length,
  }));

  const productCountByBrand = new Map<number, number>();
  for (const product of allProducts) {
    if (product.brandId) {
      productCountByBrand.set(
        product.brandId,
        (productCountByBrand.get(product.brandId) ?? 0) + 1
      );
    }
  }
  const brandLinks = brands
    .map((brand) => ({
      name: brand.name,
      href: `/shop?brand=${brand.id}`,
      count: productCountByBrand.get(brand.id) ?? 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 6);
  const strainLinks = getAvailableStrains(allProducts)
    .map((strain) => ({
      name: strain,
      href: `/shop?strain=${encodeURIComponent(strain)}`,
      count: allProducts.filter((product) => product.strain === strain).length,
    }))
    .slice(0, 6);
  const feelingLinks = getAvailableFeelings(allProducts)
    .map((feeling) => ({
      name: feeling,
      href: `/shop?effect=${encodeURIComponent(feeling)}`,
      count: allProducts.filter((product) => getProductFeelings(product).includes(feeling)).length,
    }))
    .slice(0, 6);
  const brandProductGroups: HomeProductTabGroup[] = brands
    .map((brand) => {
      const products = allProducts
        .filter((product) => product.brandId === brand.id)
        .slice(0, 16);
      return {
        id: `brand-${brand.id}`,
        label: brand.name,
        href: `/shop?brand=${brand.id}`,
        count: productCountByBrand.get(brand.id) ?? 0,
        products,
      };
    })
    .filter((group) => group.count > 0 && group.products.length > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
  const feelingProductGroups: HomeProductTabGroup[] = feelingLinks
    .map((feeling) => {
      const products = allProducts
        .filter((product) => getProductFeelings(product).includes(feeling.name))
        .slice(0, 16);
      return {
        id: `feel-${feeling.name}`,
        label: feeling.name,
        href: feeling.href,
        count: feeling.count,
        products,
      };
    })
    .filter((group) => group.count > 0 && group.products.length > 0);
  const strainProductGroups: HomeProductTabGroup[] = strainLinks
    .map((strain) => {
      const products = allProducts
        .filter((product) => product.strain === strain.name)
        .slice(0, 16);
      return {
        id: `strain-${strain.name}`,
        label: strain.name,
        href: strain.href,
        count: strain.count,
        products,
      };
    })
    .filter((group) => group.count > 0 && group.products.length > 0);
  const heroStats = [
    { value: allProducts.length.toString(), label: "In-stock items" },
    { value: categoriesWithCounts.filter((cat) => cat.count > 0).length.toString(), label: "Menu categories" },
    { value: brandLinks.length.toString(), label: "Featured brands" },
  ];

  const features = [
    { icon: ShieldCheck, title: "Lab Tested", desc: "Every product is rigorously tested for purity and potency." },
    { icon: UserCheck, title: "Expert Team", desc: "Our staff is trained to guide customers with clear, useful product information." },
    { icon: Star, title: "Premium Quality", desc: "We source thoughtfully and keep the menu focused on trusted products." },
    { icon: Truck, title: "Fast & Discreet", desc: "Secure, private, and efficient service every single time." },
  ];

  const heroSection = show.hero && (
    <section key="hero" className="relative min-h-[72vh] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={heroBgUrl}
          alt=""
          fill
          sizes="100vw"
          priority
          unoptimized={heroBgUnoptimized}
          className="object-cover object-center"
        />
        <div className={`absolute inset-0 ${heroOverlay}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--background)/0.34)_0%,hsl(var(--background)/0.62)_58%,hsl(var(--background)/0.92)_100%)]" />
      </div>
      <div className="container relative z-10 mx-auto flex min-h-[72vh] items-center justify-center px-4 py-12 text-center">
        <div className="mx-auto flex max-w-4xl flex-col items-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t(sec.hero?.badge, DEFAULTS.heroBadge)}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.02] text-foreground md:text-6xl lg:text-7xl">
            {t(sec.hero?.headline, heroHeadlineFallback)}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-foreground/80 md:text-lg">
            {t(sec.hero?.subheadline, heroSubheadlineFallback)}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={sec.hero?.cta_primary_link || "/shop"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-accent-foreground shadow-[0_18px_45px_-22px_hsl(var(--accent))] transition duration-300 hover:-translate-y-0.5 hover:bg-accent/90 sm:w-auto"
            >
              {t(sec.hero?.cta_primary, DEFAULTS.heroCtaPrimary)}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={sec.hero?.cta_secondary_link || "/about"}
              className="inline-flex w-full items-center justify-center rounded-full border border-border bg-background/55 px-6 py-3 font-bold text-foreground backdrop-blur transition duration-300 hover:border-accent/50 hover:bg-card sm:w-auto"
            >
              {t(sec.hero?.cta_secondary, DEFAULTS.heroCtaSecondary)}
            </Link>
          </div>
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-lg border border-border/70 bg-background/75 backdrop-blur">
            {heroStats.map((stat) => (
              <div key={stat.label} className="border-r border-border/60 px-4 py-3 last:border-r-0">
                <p className="text-xl font-bold text-foreground md:text-2xl">{stat.value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const categoriesSection = show.categories && categoriesWithCounts.length > 0 && (
    <section key="categories" id="shop-categories" className="relative bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              {t(sec.categories?.label, DEFAULTS.categoriesLabel)}
            </span>
            <h2 className="mt-2 text-2xl font-bold md:text-4xl">
              {t(sec.categories?.title, DEFAULTS.categoriesTitle)}
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/85 transition-colors hover:text-accent"
          >
            Open full menu <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max snap-x snap-mandatory gap-3 md:gap-4">
            {categoriesWithCounts.map((cat) => (
              <Link
                key={cat.name}
                href={categoryPath(cat.name)}
                className="group block w-[142px] shrink-0 snap-start overflow-hidden rounded-lg border border-border/60 bg-card text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10 md:w-[170px]"
              >
                {cat.imageUrl ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      unoptimized={isStorageImageUrl(cat.imageUrl)}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="p-4 pb-0">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-accent transition-all duration-300 group-hover:scale-105 group-hover:bg-accent/20">
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-accent md:text-base">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{cat.count} Products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const brandTabsSection = brandProductGroups.length > 0 && (
    <HomeProductTabsCarousel
      key="brand_tabs"
      eyebrow="Shop by Brand"
      title="Browse Products by Brand"
      subtitle="Choose a trusted brand and quickly scan the products available now."
      groups={brandProductGroups}
    />
  );

  const feelingTabsSection = feelingProductGroups.length > 0 && (
    <HomeProductTabsCarousel
      key="feel_tabs"
      eyebrow="Shop by Feel"
      title="Shop by the Experience You Want"
      subtitle="Find products grouped by common effects like calm, sleep, focus, and energy."
      groups={feelingProductGroups}
    />
  );

  const strainTabsSection = strainProductGroups.length > 0 && (
    <HomeProductTabsCarousel
      key="strain_tabs"
      eyebrow="Shop by Strain"
      title="Explore Products by Strain Type"
      subtitle="Browse Indica, Sativa, Hybrid, and CBD products from the live menu."
      groups={strainProductGroups}
    />
  );

  const featuredSection = show.featured && (
    <section key="featured" className="py-14 bg-card/30 border-y border-border/50 relative">
      <div className="absolute top-0 left-0 w-full h-[200px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-accent font-bold tracking-widest uppercase text-xs">
              {t(sec.featured?.label, "Top Shelf")}
            </span>
            <h2 className="text-3xl md:text-4xl font-display mt-2">
              {t(sec.featured?.title, "Featured Strains")}
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden md:flex items-center gap-2 text-foreground hover:text-accent font-semibold transition-colors"
          >
            View All Products <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No featured products yet — add some from the admin panel.
          </p>
        ) : (
          <FeaturedCarousel products={featured.slice(0, 12)} />
        )}
        <div className="mt-12 text-center md:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-foreground hover:text-accent font-semibold transition-colors"
          >
            View All Products <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );

  const whyUsSection = show.why_us && (
    <section key="why_us" className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/images/store/store-interior-mural.webp"
              alt="Store interior"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
          </div>
          <div>
            <span className="text-accent font-bold tracking-widest uppercase text-xs">
              {t(sec.why_us?.label, DEFAULTS.whyUsLabel)}
            </span>
            <h2 className="text-3xl md:text-4xl font-display mt-2 mb-4">
              {t(sec.why_us?.title, DEFAULTS.whyUsTitle)}
            </h2>
            <p className="text-muted-foreground mb-8 text-base">
              {t(sec.why_us?.subtitle, DEFAULTS.whyUsSubtitle)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/20 flex items-center justify-center text-accent">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-1">{feature.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const testimonialsSection = show.testimonials && (
    <section key="testimonials" className="py-14 bg-primary relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <span className="text-accent font-bold tracking-widest uppercase text-xs">
            {t(sec.testimonials?.label, DEFAULTS.testimonialsLabel)}
          </span>
          <h2 className="text-3xl md:text-4xl font-display mt-2 text-foreground">
            {t(sec.testimonials?.title, DEFAULTS.testimonialsTitle)}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t2) => (
            <div key={t2.id} className="bg-background/40 backdrop-blur-lg p-6 rounded-2xl border border-border">
              <div className="flex gap-1 mb-4 text-accent" aria-label={`${t2.rating} stars`}>
                {Array.from({ length: t2.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-base text-foreground/90 italic mb-5 leading-relaxed">
                &ldquo;{t2.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center text-lg font-bold text-foreground">
                  {t2.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{t2.name}</h4>
                  <p className="text-xs text-accent">{t2.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const newsletterSection = show.newsletter && (
    <section key="newsletter" className="py-14 bg-background">
      <div className="container mx-auto px-4">
        <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-10 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto">
            <span className="text-accent font-bold tracking-widest uppercase text-xs mb-3 block">
              {t(sec.newsletter?.label, DEFAULTS.newsletterLabel)}
            </span>
            <h2 className="text-3xl md:text-4xl font-display mb-4">
              {t(sec.newsletter?.title, DEFAULTS.newsletterTitle)}
            </h2>
            <p className="text-muted-foreground text-base mb-7">
              {t(sec.newsletter?.subtitle, DEFAULTS.newsletterSubtitle)}
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );

  const sectionMap: Record<string, React.ReactNode> = {
    hero: heroSection,
    categories: categoriesSection,
    brand_tabs: brandTabsSection,
    feel_tabs: feelingTabsSection,
    strain_tabs: strainTabsSection,
    featured: featuredSection,
    why_us: whyUsSection,
    testimonials: testimonialsSection,
    newsletter: newsletterSection,
  };

  const browseSections = [brandTabsSection, feelingTabsSection, strainTabsSection];
  const renderedSections: React.ReactNode[] = [];
  let insertedBrowseSections = false;

  for (const id of sectionOrder) {
    renderedSections.push(sectionMap[id] ?? null);
    if (id === "categories" && !insertedBrowseSections) {
      renderedSections.push(...browseSections);
      insertedBrowseSections = true;
    }
  }

  if (!insertedBrowseSections) {
    const heroIndex = sectionOrder.indexOf("hero");
    if (heroIndex >= 0) {
      renderedSections.splice(heroIndex + 1, 0, categoriesSection, ...browseSections);
    } else {
      renderedSections.unshift(categoriesSection, ...browseSections);
    }
  }

  return <>{renderedSections}</>;
}

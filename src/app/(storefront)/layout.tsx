import type { ReactNode } from "react";
import { Clock3, LockKeyhole, MapPin, Phone, ShieldCheck } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { getBrands, getCategories, getProducts } from "@/lib/data";
import { SettingsProvider } from "@/components/SettingsProvider";
import { CartProvider } from "@/components/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AgeGateModal } from "@/components/AgeGateModal";
import { StoreJsonLd } from "@/components/StoreJsonLd";
import { ToasterProvider } from "@/components/ToasterProvider";
import { DEFAULTS } from "@/lib/defaults";
import { getAvailableFeelings, getAvailableStrains, getProductFeelings } from "@/lib/product-facets";
import { categoryPath } from "@/lib/url";
import type { ShopNavData } from "@/components/Navbar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Storefront layout — wraps every public page (home, shop, product, about,
 * etc.). Loads site settings server-side and pipes them down to all
 * client components via SettingsProvider, so no client component ever
 * needs to fetch them again.
 *
 * Maintenance mode is enforced here: if the admin has flipped the switch,
 * we render only the launch page and never load the storefront.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;

  if (settings.maintenance_mode) {
    return (
      <ComingSoonLanding
        storeName={storeName}
        message={settings.maintenance_message}
        logoPath={settings.store?.logo_light || settings.store?.logo_dark}
        address={settings.store?.address || settings.location?.address}
        phone={settings.store?.phone || settings.location?.phone}
      />
    );
  }

  const [categories, brands, products] = await Promise.all([
    getCategories(),
    getBrands(),
    getProducts({ inStockOnly: true }),
  ]);

  const productCountByCategory = new Map<string, number>();
  const productCountByBrand = new Map<number, number>();
  for (const product of products) {
    productCountByCategory.set(
      product.category,
      (productCountByCategory.get(product.category) ?? 0) + 1
    );
    if (product.brandId) {
      productCountByBrand.set(
        product.brandId,
        (productCountByBrand.get(product.brandId) ?? 0) + 1
      );
    }
  }

  const shopNav: ShopNavData = {
    categories: categories
      .map((category) => ({
        name: category.name,
        href: categoryPath(category.name),
        count: productCountByCategory.get(category.name) ?? 0,
      }))
      .filter((item) => item.count > 0)
      .slice(0, 8),
    brands: brands
      .map((brand) => ({
        name: brand.name,
        href: `/shop?brand=${brand.id}`,
        count: productCountByBrand.get(brand.id) ?? 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8),
    strains: getAvailableStrains(products).map((strain) => ({
      name: strain,
      href: `/shop?strain=${encodeURIComponent(strain)}`,
      count: products.filter((product) => product.strain === strain).length,
    })),
    feelings: getAvailableFeelings(products).map((feeling) => ({
      name: feeling,
      href: `/shop?effect=${encodeURIComponent(feeling)}`,
      count: products.filter((product) => getProductFeelings(product).includes(feeling)).length,
    })),
  };

  return (
    <SettingsProvider settings={settings}>
      <CartProvider>
        <StoreJsonLd />
        <div className="min-h-screen flex flex-col bg-background selection:bg-accent selection:text-accent-foreground">
          <AgeGateModal />
          <Navbar shopNav={shopNav} />
          <main className="flex-grow pt-[88px] md:pt-[104px]">{children}</main>
          <Footer />
          <ToasterProvider />
        </div>
      </CartProvider>
    </SettingsProvider>
  );
}

function ComingSoonLanding({
  storeName,
  message,
  logoPath,
  address,
  phone,
}: {
  storeName: string;
  message?: string;
  logoPath?: string;
  address?: string;
  phone?: string;
}) {
  const displayMessage =
    message?.trim() ||
    "Our online menu is being prepared now. Inventory, categories, and checkout will be available here shortly.";
  const logoUrl = logoPath ? `/api/storage${logoPath}` : null;

  return (
    <main className="min-h-screen bg-[#07120d] text-white">
      <div className="min-h-screen bg-[linear-gradient(135deg,#07120d_0%,#0f2118_52%,#09100d_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8">
          <header className="flex items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${storeName} logo`}
                  className="h-11 w-11 rounded-lg bg-white object-contain p-1.5"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d8b95a]/40 bg-[#d8b95a]/10 text-sm font-semibold text-[#f1d77d]">
                  JC
                </div>
              )}
              <span className="truncate text-lg font-semibold tracking-wide">
                {storeName}
              </span>
            </div>
            <a
              href="/admin/login"
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:border-[#d8b95a]/60 hover:text-white"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Admin
            </a>
          </header>

          <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
            <div className="max-w-3xl">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-[#d8b95a]">
                Online menu opening soon
              </p>
              <h1 className="max-w-4xl text-4xl font-bold leading-[1.03] text-white sm:text-6xl lg:text-7xl">
                {storeName} is getting the menu ready.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                {displayMessage}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#d8b95a] px-5 py-3 text-sm font-bold text-[#07120d] transition-transform hover:-translate-y-0.5"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Call the store
                  </a>
                ) : null}
                {address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/18 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-[#d8b95a]/70"
                  >
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    Get directions
                  </a>
                ) : null}
              </div>
            </div>

            <aside className="rounded-xl border border-white/12 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="border-b border-white/10 pb-5">
                <div className="flex items-center gap-3 text-[#f1d77d]">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                  <h2 className="text-xl font-semibold text-white">
                    Launch status
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/64">
                  We are finishing inventory setup before opening the online
                  shopping experience.
                </p>
              </div>

              <div className="space-y-4 py-5">
                {[
                  "Store information connected",
                  "Inventory import in progress",
                  "SEO pages preparing",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d8b95a]" />
                    <span className="text-sm font-medium text-white/78">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-black/20 p-4 text-sm leading-6 text-white/66">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#d8b95a]"
                  aria-hidden="true"
                />
                <p>
                  For adults 21+ with valid ID. Please consume responsibly and
                  follow all local laws.
                </p>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

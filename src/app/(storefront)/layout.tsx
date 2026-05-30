import type { ReactNode } from "react";
import { MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { getBrands, getCategories, getProducts } from "@/lib/data";
import { SettingsProvider } from "@/components/SettingsProvider";
import { CartProvider } from "@/components/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AgeGateModal } from "@/components/AgeGateModal";
import { StoreJsonLd } from "@/components/StoreJsonLd";
import { ToasterProvider } from "@/components/ToasterProvider";
import { MobileStickyActions } from "@/components/MobileStickyActions";
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
  const storefrontPhone =
    settings.location?.phone ||
    settings.contact?.phone ||
    settings.store?.phone;
  const storefrontAddress = settings.location?.address || settings.store?.address;
  const showStickyActions = Boolean(storefrontPhone || storefrontAddress);

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
        <div
          className={`min-h-screen flex flex-col bg-background selection:bg-accent selection:text-accent-foreground ${
            showStickyActions ? "pb-24 md:pb-0" : ""
          }`}
        >
          <AgeGateModal />
          <Navbar shopNav={shopNav} />
          <main className="flex-grow pt-[88px] md:pt-[104px]">{children}</main>
          <Footer />
          {showStickyActions && (
            <MobileStickyActions
              storeName={storeName}
              phone={storefrontPhone}
              address={storefrontAddress}
              city={settings.location?.city}
              state={settings.location?.state}
              zip={settings.location?.zip}
              placeId={settings.integrations?.google_business_profile_place_id}
            />
          )}
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
    "Our site is currently under maintenance. Please check back soon.";
  const logoUrl = logoPath ? `/api/storage${logoPath}` : null;
  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return (
    <main className="min-h-screen bg-[#07120d] text-white">
      <div className="min-h-screen bg-[linear-gradient(135deg,#07120d_0%,#0f2118_52%,#09100d_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-5 sm:px-8">
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
          </header>

          <section className="flex flex-1 flex-col items-center justify-center py-14 text-center">
            <div className="max-w-3xl">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-[#d8b95a]">
                Site under maintenance
              </p>
              <h1 className="max-w-4xl text-4xl font-bold leading-[1.03] text-white sm:text-6xl lg:text-7xl">
                We will be back soon.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                {displayMessage}
              </p>
            </div>

            <div className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {mapsUrl && address ? (
                <a
                  href={mapsUrl}
                  className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] p-5 text-white transition-colors hover:border-[#d8b95a]/70"
                >
                  <MapPin className="mb-3 h-5 w-5 text-[#d8b95a]" aria-hidden="true" />
                  <span className="text-sm font-semibold">Google Maps</span>
                  <span className="mt-2 text-sm leading-6 text-white/68">{address}</span>
                </a>
              ) : null}
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] p-5 text-white transition-colors hover:border-[#d8b95a]/70"
                >
                  <Phone className="mb-3 h-5 w-5 text-[#d8b95a]" aria-hidden="true" />
                  <span className="text-sm font-semibold">Phone</span>
                  <span className="mt-2 text-sm leading-6 text-white/68">{phone}</span>
                </a>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

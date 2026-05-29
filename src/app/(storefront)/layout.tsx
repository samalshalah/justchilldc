import type { ReactNode } from "react";
import { Construction } from "lucide-react";
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
 * we render only a maintenance message and never load the storefront.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, categories, brands, products] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getBrands(),
    getProducts({ inStockOnly: true }),
  ]);
  const storeName = settings.store?.name || DEFAULTS.storeName;

  if (settings.maintenance_mode) {
    const message =
      settings.maintenance_message ||
      "We're performing scheduled maintenance. We'll be back shortly!";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-card border border-border/50 flex items-center justify-center mb-6 text-accent">
          <Construction className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">
          {storeName}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">{message}</p>
      </div>
    );
  }

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

import { DEFAULTS } from "./defaults";
import type { Brand, Category, Product } from "./data";
import type { SiteSettings } from "./types";
import { getLocalSeoPages } from "./local-seo-pages";
import { isStaleGeneratedSeoCopy } from "./seo-generator";

export type SeoHealthStatus = "good" | "warning" | "missing";

export interface SeoHealthItem {
  label: string;
  detail: string;
  status: SeoHealthStatus;
  href?: string;
}

export interface SeoHealthReport {
  score: number;
  items: SeoHealthItem[];
}

function hasValue(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function isGeneratedPlaceholder(value: string | undefined, fallback: string): boolean {
  return !value || value.trim() === fallback || value.includes("example.com");
}

export function buildSeoHealthReport(input: {
  settings: SiteSettings;
  products: Product[];
  categories: Category[];
  brands: Brand[];
}): SeoHealthReport {
  const { settings, products, categories, brands } = input;
  const store = settings.store ?? {};
  const seo = settings.seo ?? {};
  const location = settings.location ?? {};
  const staleProductCount = products.filter((p) =>
    isStaleGeneratedSeoCopy(p.description)
  ).length;
  const localSeoPageCount = getLocalSeoPages(settings).length;

  const items: SeoHealthItem[] = [
    {
      label: "Store name",
      detail: hasValue(store.name)
        ? `Using "${store.name}"`
        : "Set the public store name so every title and schema tag has the right brand.",
      status: hasValue(store.name) && store.name !== DEFAULTS.storeName ? "good" : "missing",
      href: "/admin/store/info",
    },
    {
      label: "City and state",
      detail: hasValue(location.city) || hasValue(seo.city)
        ? `Local SEO city: ${location.city || seo.city}`
        : "Add the primary city so product and category copy can target local searches.",
      status: hasValue(location.city) || hasValue(seo.city) ? "good" : "missing",
      href: "/admin/store/info",
    },
    {
      label: "Canonical domain",
      detail: isGeneratedPlaceholder(seo.canonical_domain, "")
        ? "Add the final domain without https:// after DNS is ready."
        : `Canonical domain: ${seo.canonical_domain}`,
      status: isGeneratedPlaceholder(seo.canonical_domain, "") ? "warning" : "good",
      href: "/admin/store/seo",
    },
    {
      label: "Indexing",
      detail: seo.robots_noindex
        ? "Search engines are currently blocked from indexing the site."
        : "Search engines are allowed to index public pages.",
      status: seo.robots_noindex ? "missing" : "good",
      href: "/admin/store/seo",
    },
    {
      label: "Structured data",
      detail: seo.auto_structured_data === false
        ? "JSON-LD structured data is disabled."
        : "Store and product structured data is enabled.",
      status: seo.auto_structured_data === false ? "warning" : "good",
      href: "/admin/store/seo",
    },
    {
      label: "Products",
      detail: products.length > 0
        ? `${products.length} products available for sitemap and product SEO.`
        : "Import products so the site can generate product pages, product schema, and menu content.",
      status: products.length > 0 ? "good" : "missing",
      href: "/admin/products/import",
    },
    {
      label: "Product descriptions",
      detail: products.length === 0
        ? "No products to check yet."
        : staleProductCount > 0
        ? `${staleProductCount}/${products.length} products still contain generic white-label SEO copy.`
        : `${products.filter((p) => hasValue(p.description)).length}/${products.length} products have localized descriptions.`,
      status:
        products.length === 0
          ? "warning"
          : products.every((p) => hasValue(p.description)) && staleProductCount === 0
          ? "good"
          : "warning",
      href: "/admin/products",
    },
    {
      label: "Local SEO pages",
      detail: `${localSeoPageCount} hidden service-area pages are available for sitemap indexing.`,
      status: localSeoPageCount >= 5 ? "good" : "warning",
      href: "/sitemap.xml",
    },
    {
      label: "Categories",
      detail: categories.length > 0
        ? `${categories.length} crawlable category pages can be generated.`
        : "Create or import categories so Google can crawl category landing pages.",
      status: categories.length > 0 ? "good" : "missing",
      href: "/admin/categories",
    },
    {
      label: "Brands",
      detail: brands.length > 0
        ? `${brands.length} brands available for product filtering and generated copy.`
        : "Brands are optional, but they help product titles and descriptions look more specific.",
      status: brands.length > 0 ? "good" : "warning",
      href: "/admin/brands",
    },
    {
      label: "Google verification",
      detail: hasValue(seo.google_site_verification)
        ? "Search Console verification token is saved."
        : "Add the Google Search Console verification token before launch.",
      status: hasValue(seo.google_site_verification) ? "good" : "warning",
      href: "/admin/store/seo",
    },
  ];

  const good = items.filter((item) => item.status === "good").length;
  const score = Math.round((good / items.length) * 100);
  return { score, items };
}

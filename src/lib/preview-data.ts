import "server-only";
import type { Brand, Category, Product } from "./data";
import type { SiteSettings } from "./types";
import {
  generateBrandSeoDescription,
  generateCategorySeoDescription,
  generateSeoDescription,
  normalizeImportedProductName,
  seoTitleCase,
} from "./seo-generator";
import { DEFAULTS } from "./defaults";
import { formatImportedPackageSize } from "./product-size";

type ImportRow = {
  sku: string;
  name: string;
  category: string;
  brand: string;
  strainName: string;
  price: number;
  quantity: number;
  thc: string;
  cbd: string;
  weight?: string;
  inStock: boolean;
  strainType: "Indica" | "Sativa" | "Hybrid" | "CBD";
  skip?: boolean;
};

type PreviewStore = {
  settings: SiteSettings;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  nextProductId: number;
  nextCategoryId: number;
  nextBrandId: number;
};

declare global {
  var __jc_previewStore: PreviewStore | undefined;
}

function now(): Date {
  return new Date();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function imageTypeFor(category: string): string {
  switch (category) {
    case "Edibles":
      return "edible";
    case "Concentrates":
    case "Capsules":
      return "vape";
    default:
      return "flower";
  }
}

function store(): PreviewStore {
  if (!globalThis.__jc_previewStore) {
    globalThis.__jc_previewStore = {
      settings: {},
      products: [],
      categories: [],
      brands: [],
      nextProductId: 1,
      nextCategoryId: 1,
      nextBrandId: 1,
    };
  }
  return globalThis.__jc_previewStore;
}

export function getPreviewSettings(): SiteSettings {
  return store().settings;
}

export function setPreviewSettingSlice<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): void {
  const s = store();
  s.settings = { ...s.settings, [key]: value };
}

export function getPreviewProducts(opts: {
  featured?: boolean;
  category?: string;
  inStockOnly?: boolean;
} = {}): Product[] {
  let rows = [...store().products];
  if (opts.category) rows = rows.filter((p) => p.category === opts.category);
  if (opts.featured !== undefined) rows = rows.filter((p) => p.featured === opts.featured);
  if (opts.inStockOnly) rows = rows.filter((p) => p.inStock);
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getPreviewProductById(id: number): Product | null {
  return store().products.find((p) => p.id === id) ?? null;
}

export function getPreviewCategories(): Category[] {
  return [...store().categories].sort((a, b) => a.id - b.id);
}

export function getPreviewBrands(): Brand[] {
  return [...store().brands].sort((a, b) => a.name.localeCompare(b.name));
}

function ensurePreviewBrand(name: string): Brand {
  const s = store();
  const existing = s.brands.find((b) => b.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const settings = s.settings;
  const brand: Brand = {
    id: s.nextBrandId++,
    name,
    description: generateBrandSeoDescription({
      brand: name,
      storeName: settings.store?.name,
      city: settings.location?.city || settings.seo?.city,
    }),
    website: "",
    logoUrl: null,
    featured: false,
    createdAt: now(),
  };
  s.brands.push(brand);
  return brand;
}

function ensurePreviewCategory(name: string): Category {
  const s = store();
  const existing = s.categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const settings = s.settings;
  const category: Category = {
    id: s.nextCategoryId++,
    name,
    slug: slugify(name),
    description: generateCategorySeoDescription({
      category: name,
      storeName: settings.store?.name,
      city: settings.location?.city || settings.seo?.city,
      legalModelName: DEFAULTS.legalModelName,
    }),
    imageUrl: null,
    createdAt: now(),
  };
  s.categories.push(category);
  return category;
}

export function importPreviewProducts(rows: ImportRow[]) {
  const s = store();
  const settings = s.settings;
  const ctx = {
    storeName: settings.store?.name,
    city: settings.location?.city || settings.seo?.city,
    state: settings.location?.state,
    legalModelName: DEFAULTS.legalModelName,
  };
  const result = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [] as { row: number; sku: string; message: string }[],
    brandsCreated: [] as string[],
    categoriesCreated: [] as string[],
  };

  rows.forEach((row, idx) => {
    if (row.skip) {
      result.skipped++;
      return;
    }
    try {
      const beforeBrands = s.brands.length;
      const beforeCategories = s.categories.length;
      const brand = row.brand ? ensurePreviewBrand(seoTitleCase(row.brand)) : undefined;
      const category = ensurePreviewCategory(row.category);
      if (brand && s.brands.length > beforeBrands) result.brandsCreated.push(brand.name);
      if (s.categories.length > beforeCategories) result.categoriesCreated.push(category.name);

      const productName = normalizeImportedProductName(row.name);
      const weight =
        row.weight?.trim() ||
        formatImportedPackageSize({
          category: category.name,
          productName,
          thc: row.thc,
        });
      const productValues = {
        name: productName,
        category: category.name,
        brandId: brand?.id ?? null,
        strain: row.strainType,
        thc: row.thc || "-",
        cbd: row.cbd || "0%",
        price: Math.max(0, Math.round(row.price)),
        salePrice: null,
        imageType: imageTypeFor(category.name),
        description: generateSeoDescription(
          {
            name: productName,
            category: category.name,
            strainType: row.strainType,
            strainName: row.strainName,
            thc: row.thc,
            cbd: row.cbd,
            brand: brand?.name,
          },
          ctx
        ),
        effects: "[]",
        terpenes: "[]",
        flavors: "[]",
        weight,
        featured: false,
        inStock: row.inStock && row.quantity > 0,
        sku: row.sku,
        quantity: row.quantity,
        lowStockThreshold: 5,
        archivedAt: null,
      };

      const existingIdx = s.products.findIndex((p) => p.sku === row.sku);
      if (existingIdx >= 0) {
        s.products[existingIdx] = { ...s.products[existingIdx], ...productValues };
        result.updated++;
      } else {
        s.products.push({
          id: s.nextProductId++,
          ...productValues,
          imageUrl: null,
          createdAt: now(),
        });
        result.inserted++;
      }
    } catch (err) {
      result.errors.push({
        row: idx + 2,
        sku: row.sku,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  return result;
}

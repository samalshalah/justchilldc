/**
 * Resolve a product's display image URL. Returns either:
 *   - the storage-proxy path for an admin-uploaded image, or
 *   - a stock placeholder PNG matching the product's imageType
 *
 * The placeholders live in /public/images/ and are bundled with the
 * site. Admin-uploaded images go through `/api/storage/...` which
 * proxies to configured object storage.
 */

export function productImageUrl(product: {
  imageUrl?: string | null;
  imageType?: string | null;
}): string {
  if (product.imageUrl) {
    if (
      product.imageUrl.startsWith("/api/storage/") ||
      product.imageUrl.startsWith("http://") ||
      product.imageUrl.startsWith("https://")
    ) {
      return product.imageUrl;
    }
    return `/api/storage${product.imageUrl}`;
  }
  switch (product.imageType) {
    case "edible":
      return "/images/product-edible.webp";
    case "vape":
      return "/images/product-vape.webp";
    case "flower":
    default:
      return "/images/product-flower.webp";
  }
}

/**
 * Map from lowercase category name keywords to a bundled default image.
 * The images live in /public/images/categories/ and are served statically.
 */
const CATEGORY_DEFAULTS: Array<[string[], string]> = [
  [["flower", "flowers", "bud", "buds"], "/images/categories/flower.jpg"],
  [["edible", "edibles", "chocolate", "gummy", "gummies", "food", "capsule", "capsules", "soft gel", "softgel"], "/images/categories/edibles.jpg"],
  [["pre-roll", "pre-rolls", "preroll", "prerolls", "joint", "joints", "cone", "cones"], "/images/categories/pre-roll.jpg"],
  [["concentrate", "concentrates", "wax", "shatter", "rosin", "resin", "dab", "dabs", "hash"], "/images/categories/concentrates.jpg"],
  [["vape", "vapes", "vaporizer", "vaporizers", "cartridge", "cartridges", "cart", "carts", "pen", "pens"], "/images/categories/vaporizer.jpg"],
  [["tincture", "tinctures", "drops", "sublingual"], "/images/categories/tinctures.jpg"],
  [["topical", "topicals", "cream", "creams", "lotion", "lotions", "balm", "balms", "salve", "salves"], "/images/categories/topicals.jpg"],
  [["cbd", "hemp"], "/images/categories/cbd.jpg"],
  [["seed", "seeds"], "/images/categories/seeds.jpg"],
  [["clone", "clones", "plant", "plants", "seedling", "seedlings"], "/images/categories/clones.jpg"],
  [["accessory", "accessories", "gear", "pipe", "pipes", "grinder", "grinders", "glass"], "/images/categories/accessories.jpg"],
  [["apparel", "clothing", "merch", "merchandise", "shirt", "shirts", "hat", "hats"], "/images/categories/apparel.jpg"],
];

function defaultCategoryImage(name: string): string | null {
  const lower = name.toLowerCase().trim();
  for (const [keywords, url] of CATEGORY_DEFAULTS) {
    if (keywords.some((kw) => lower.includes(kw))) return url;
  }
  return null;
}

export function categoryImageUrl(
  imageUrl: string | null,
  categoryName?: string
): string | null {
  if (imageUrl) {
    if (
      imageUrl.startsWith("/api/storage/") ||
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }
    return `/api/storage${imageUrl}`;
  }
  if (categoryName) return defaultCategoryImage(categoryName);
  return null;
}

export function logoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("/api/storage/") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `/api/storage${path}`;
}

export function isStorageImageUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("/api/storage/");
}

export function slugifyPathSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function categoryPath(category: string): string {
  return `/shop/${slugifyPathSegment(category)}`;
}

export function findCategoryBySlug<T extends { name: string }>(
  categories: T[],
  slug: string
): T | undefined {
  return categories.find((category) => slugifyPathSegment(category.name) === slug);
}

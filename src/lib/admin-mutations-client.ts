import type { StrainType } from "@/lib/strain-database";

export interface ProductInput {
  id?: number;
  name: string;
  category: string;
  brandId?: number | null;
  strain: string;
  thc: string;
  cbd?: string;
  price: number;
  salePrice?: number | null;
  imageType?: string;
  imageUrl?: string | null;
  description: string;
  effects?: string;
  terpenes?: string;
  flavors?: string;
  weight?: string;
  featured?: boolean;
  inStock?: boolean;
  sku?: string | null;
  quantity?: number | null;
  lowStockThreshold?: number | null;
}

export interface BlogPostInput {
  id?: number;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  category?: string;
  tags?: string;
  featuredImageUrl?: string | null;
  published?: boolean;
}

export interface ImportRowInput {
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
  strainType: StrainType;
  skip?: boolean;
  description?: string;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; sku: string; message: string }[];
  brandsCreated: string[];
  categoriesCreated: string[];
}

async function callAdminMutation<T>(action: string, args: unknown[]): Promise<T> {
  const res = await fetch("/api/admin/mutations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, args }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Admin action failed (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

export function upsertProduct(input: ProductInput) {
  return callAdminMutation<{ ok: true }>("upsertProduct", [input]);
}

export function deleteProduct(id: number) {
  return callAdminMutation<{ ok: true }>("deleteProduct", [id]);
}

export function setProductStock(
  id: number,
  patch: { inStock?: boolean; quantity?: number | null }
) {
  return callAdminMutation<{ ok: true }>("setProductStock", [id, patch]);
}

export function adjustProductQuantity(id: number, delta: number) {
  return callAdminMutation<{ ok: true }>("adjustProductQuantity", [id, delta]);
}

export function upsertBrand(input: {
  id?: number;
  name: string;
  description?: string;
  logoUrl?: string | null;
  website?: string;
  featured?: boolean;
}) {
  return callAdminMutation<{ ok: true }>("upsertBrand", [input]);
}

export function deleteBrand(id: number) {
  return callAdminMutation<{ ok: true }>("deleteBrand", [id]);
}

export function upsertCategory(input: {
  id?: number;
  name: string;
  description?: string;
  imageUrl?: string | null;
}) {
  return callAdminMutation<{ ok: true }>("upsertCategory", [input]);
}

export function deleteCategory(id: number) {
  return callAdminMutation<{ ok: true }>("deleteCategory", [id]);
}

export function setOrderStatus(
  id: number,
  status: "pending" | "ready" | "completed" | "cancelled"
) {
  return callAdminMutation<{ ok: true }>("setOrderStatus", [id, status]);
}

export function bulkDeleteProducts(ids: number[]) {
  return callAdminMutation<{ deleted: number }>("bulkDeleteProducts", [ids]);
}

export function bulkApplyDiscount(
  ids: number[],
  mode: "percent" | "flat" | "clear",
  value?: number
) {
  return callAdminMutation<{ updated: number }>("bulkApplyDiscount", [
    ids,
    mode,
    value,
  ]);
}

export function bulkSetInStock(ids: number[], inStock: boolean) {
  return callAdminMutation<{ updated: number }>("bulkSetInStock", [ids, inStock]);
}

export function bulkSetFeatured(ids: number[], featured: boolean) {
  return callAdminMutation<{ updated: number }>("bulkSetFeatured", [
    ids,
    featured,
  ]);
}

export function bulkRegenerateDescriptions(ids: number[]) {
  return callAdminMutation<{ updated: number }>("bulkRegenerateDescriptions", [
    ids,
  ]);
}

export function previewSeoDescription(input: {
  name: string;
  category: string;
  strainType: string;
  strainName?: string;
  thc?: string;
  cbd?: string;
  brand?: string;
}) {
  return callAdminMutation<string>("previewSeoDescription", [input]);
}

export function previewSeoTitle(input: {
  name: string;
  category: string;
  strainType: string;
  thc?: string;
  brand?: string;
}) {
  return callAdminMutation<string>("previewSeoTitle", [input]);
}

export function upsertBlogPost(input: BlogPostInput) {
  return callAdminMutation<{ ok: true }>("upsertBlogPost", [input]);
}

export function deleteBlogPost(id: number) {
  return callAdminMutation<{ ok: true }>("deleteBlogPost", [id]);
}

export function runImport(rows: ImportRowInput[]) {
  return callAdminMutation<ImportResult>("runImport", [rows]);
}

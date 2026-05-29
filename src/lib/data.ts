/**
 * data.ts — server-side data fetchers used by Server Components.
 *
 * Client components still use React Query when they need real-time
 * mutations or polling, but for read-only public pages, fetching
 * directly from Drizzle is faster and ships zero JS.
 */

import "server-only";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  productsTable,
  categoriesTable,
  brandsTable,
  ordersTable,
  orderItemsTable,
} from "./db";
import { isLocalPreviewMode } from "./preview";
import {
  getPreviewBrands,
  getPreviewCategories,
  getPreviewProductById,
  getPreviewProducts,
} from "./preview-data";

export type Product = typeof productsTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;
export type Brand = typeof brandsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;

export async function getProducts(opts: {
  featured?: boolean;
  category?: string;
  inStockOnly?: boolean;
} = {}): Promise<Product[]> {
  if (isLocalPreviewMode()) return getPreviewProducts(opts);
  try {
    const conditions = [];
    if (opts.category) conditions.push(eq(productsTable.category, opts.category));
    if (opts.featured !== undefined)
      conditions.push(eq(productsTable.featured, opts.featured));
    if (opts.inStockOnly) conditions.push(eq(productsTable.inStock, true));

    const rows = conditions.length
      ? await db
          .select()
          .from(productsTable)
          .where(and(...conditions))
          .orderBy(desc(productsTable.createdAt))
      : await db
          .select()
          .from(productsTable)
          .orderBy(desc(productsTable.createdAt));
    return rows;
  } catch (err) {
    console.error("[data] getProducts failed:", err);
    return [];
  }
}

export async function getProductById(id: number): Promise<Product | null> {
  if (!id || isNaN(id)) return null;
  if (isLocalPreviewMode()) return getPreviewProductById(id);
  try {
    const [row] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);
    return row ?? null;
  } catch (err) {
    console.error("[data] getProductById failed:", err);
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  if (isLocalPreviewMode()) return getPreviewCategories();
  try {
    return await db.select().from(categoriesTable).orderBy(categoriesTable.id);
  } catch (err) {
    console.error("[data] getCategories failed:", err);
    return [];
  }
}

export async function getBrands(): Promise<Brand[]> {
  if (isLocalPreviewMode()) return getPreviewBrands();
  try {
    return await db.select().from(brandsTable).orderBy(brandsTable.name);
  } catch (err) {
    console.error("[data] getBrands failed:", err);
    return [];
  }
}

export async function getOrderById(id: number): Promise<
  (Order & { items: OrderItem[] }) | null
> {
  if (!id || isNaN(id)) return null;
  if (isLocalPreviewMode()) return null;
  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);
    if (!order) return null;
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));
    return { ...order, items };
  } catch (err) {
    console.error("[data] getOrderById failed:", err);
    return null;
  }
}

export async function getAllOrders(): Promise<
  (Order & { items: OrderItem[] })[]
> {
  if (isLocalPreviewMode()) return [];
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
    return await Promise.all(
      orders.map(async (o) => {
        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, o.id));
        return { ...o, items };
      })
    );
  } catch (err) {
    console.error("[data] getAllOrders failed:", err);
    return [];
  }
}

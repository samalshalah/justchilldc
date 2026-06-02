import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { z } from "zod";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  brandId: integer("brand_id"),
  strain: text("strain").notNull(),
  thc: text("thc").notNull(),
  cbd: text("cbd").notNull().default("0%"),
  price: integer("price").notNull(),
  salePrice: integer("sale_price"),
  imageType: text("image_type").notNull().default("flower"),
  imageUrl: text("image_url"),
  description: text("description").notNull(),
  effects: text("effects").notNull().default("[]"),
  terpenes: text("terpenes").notNull().default("[]"),
  flavors: text("flavors").notNull().default("[]"),
  weight: text("weight").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  inStock: boolean("in_stock").notNull().default(true),
  sku: text("sku"),
  quantity: integer("quantity"),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const insertProductSchema = z.object({
  name: z.string(),
  category: z.string(),
  brandId: z.number().int().nullable().optional(),
  strain: z.string(),
  thc: z.string(),
  cbd: z.string().optional(),
  price: z.number().int(),
  salePrice: z.number().int().nullable().optional(),
  imageType: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  description: z.string(),
  effects: z.string().optional(),
  terpenes: z.string().optional(),
  flavors: z.string().optional(),
  weight: z.string().optional(),
  featured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  sku: z.string().nullable().optional(),
  quantity: z.number().int().nullable().optional(),
  lowStockThreshold: z.number().int().nullable().optional(),
  archivedAt: z.date().nullable().optional(),
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

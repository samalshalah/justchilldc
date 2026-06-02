import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { z } from "zod";
import { ordersTable } from "./orders";
import { productsTable } from "./products";

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  productId: integer("product_id").references(() => productsTable.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerItem: integer("price_per_item").notNull(),
});

export const insertOrderItemSchema = z.object({
  orderId: z.number().int(),
  productId: z.number().int().nullable(),
  productName: z.string(),
  quantity: z.number().int(),
  pricePerItem: z.number().int(),
});
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;

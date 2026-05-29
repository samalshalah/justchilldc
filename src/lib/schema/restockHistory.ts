import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { productsTable } from "./products";

export const restockHistoryTable = pgTable("restock_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  quantityAdded: integer("quantity_added").notNull(),
  previousQty: integer("previous_qty"),
  newQty: integer("new_qty"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RestockHistory = typeof restockHistoryTable.$inferSelect;

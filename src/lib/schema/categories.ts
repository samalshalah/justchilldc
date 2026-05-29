import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;

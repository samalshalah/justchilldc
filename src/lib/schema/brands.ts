import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod";

export const brandsTable = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  website: text("website").notNull().default(""),
  logoUrl: text("logo_url"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBrandSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  featured: z.boolean().optional(),
});
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brandsTable.$inferSelect;

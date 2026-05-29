import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("tablet"),
  token: text("token").notNull().unique(),
  active: boolean("active").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Device = typeof devicesTable.$inferSelect;
export type InsertDevice = typeof devicesTable.$inferInsert;

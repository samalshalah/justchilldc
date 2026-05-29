import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  category: text("category").notNull().default("General"),
  tags: text("tags").notNull().default("[]"),
  featuredImageUrl: text("featured_image_url"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export type BlogPost = typeof blogPostsTable.$inferSelect;
export type InsertBlogPost = typeof blogPostsTable.$inferInsert;

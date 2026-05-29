import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { blogPostsTable, type BlogPost } from "./schema/blogPosts";
import { isLocalPreviewMode } from "./preview";

export type { BlogPost };

export function slugifyBlogSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function blogExcerpt(content: string, max = 155): string {
  const plain = content.replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trim()}...`;
}

export async function getBlogPosts(opts: { publishedOnly?: boolean } = {}): Promise<BlogPost[]> {
  if (isLocalPreviewMode()) return [];
  try {
    const query = db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.updatedAt));
    if (opts.publishedOnly) {
      return await db
        .select()
        .from(blogPostsTable)
        .where(eq(blogPostsTable.published, true))
        .orderBy(desc(blogPostsTable.publishedAt), desc(blogPostsTable.updatedAt));
    }
    return await query;
  } catch (err) {
    console.error("[blog] getBlogPosts failed:", err);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isLocalPreviewMode()) return null;
  try {
    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, slug))
      .limit(1);
    return post ?? null;
  } catch (err) {
    console.error("[blog] getBlogPostBySlug failed:", err);
    return null;
  }
}

export async function getBlogPostById(id: number): Promise<BlogPost | null> {
  if (isLocalPreviewMode()) return null;
  try {
    const [post] = await db
      .select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, id))
      .limit(1);
    return post ?? null;
  } catch (err) {
    console.error("[blog] getBlogPostById failed:", err);
    return null;
  }
}

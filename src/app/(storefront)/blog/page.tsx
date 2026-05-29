import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/lib/blog";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const title = `Blog | ${storeName}`;
  return {
    title: { absolute: title },
    description: `Helpful articles, product education, and local updates from ${storeName}.`,
    alternates: { canonical: "/blog" },
  };
}

export default async function BlogIndexPage() {
  const posts = await getBlogPosts({ publishedOnly: true });

  return (
    <>
      <section className="bg-card border-b border-border/50 pt-12 pb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
            Blog
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Helpful guides, product education, store updates, and local search-friendly content.
          </p>
        </div>
      </section>
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Blog posts are coming soon.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-card border border-border rounded-xl p-5 hover:border-accent transition-colors"
                >
                  <p className="text-xs text-accent uppercase tracking-wider font-semibold mb-2">
                    {post.category}
                  </p>
                  <h2 className="text-xl font-display font-bold text-foreground mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

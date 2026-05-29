import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/blog";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, settings] = await Promise.all([params, getSiteSettings()]);
  const post = await getBlogPostBySlug(slug);
  if (!post || !post.published) return { title: "Post not found" };
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const title = post.seoTitle || `${post.title} | ${storeName}`;
  const description = post.seoDescription || post.excerpt;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title, description, url: `/blog/${post.slug}`, type: "article" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getBlogPostBySlug(slug),
    getSiteSettings(),
  ]);
  if (!post || !post.published) notFound();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (settings.seo?.canonical_domain ? `https://${settings.seo.canonical_domain}` : undefined);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: storeName },
    publisher: { "@type": "Organization", name: storeName },
    mainEntityOfPage: siteUrl ? `${siteUrl}/blog/${post.slug}` : `/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <article className="bg-background">
        <header className="bg-card border-b border-border/50 pt-10 pb-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <Link
              href="/blog"
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Back to blog
            </Link>
            <p className="text-xs text-accent uppercase tracking-wider font-semibold mt-5 mb-2">
              {post.category}
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed mt-4">
                {post.excerpt}
              </p>
            )}
          </div>
        </header>
        <div className="container mx-auto px-4 max-w-3xl py-10">
          <div className="prose prose-invert max-w-none">
            {post.content.split(/\n{2,}/).map((paragraph, idx) => (
              <p key={idx} className="text-muted-foreground leading-8 mb-5">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/blog";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";

interface Props {
  params: Promise<{ slug: string }>;
}

function renderContentBlock(block: string, idx: number) {
  const text = block.trim();
  if (text.startsWith("### ")) {
    return (
      <h3 key={idx} className="mb-3 mt-8 text-2xl font-bold text-foreground">
        {text.replace(/^###\s+/, "")}
      </h3>
    );
  }
  if (text.startsWith("## ")) {
    return (
      <h2 key={idx} className="mb-4 mt-10 text-3xl font-bold text-foreground">
        {text.replace(/^##\s+/, "")}
      </h2>
    );
  }
  if (text.startsWith("- ")) {
    const items = text
      .split(/\n+/)
      .map((line) => line.replace(/^-\s+/, "").trim())
      .filter(Boolean);
    return (
      <ul key={idx} className="mb-6 list-disc space-y-2 pl-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="leading-8">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p key={idx} className="mb-5 leading-8 text-muted-foreground">
      {text}
    </p>
  );
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
            {post.content.split(/\n{2,}/).map(renderContentBlock)}
          </div>
        </div>
      </article>
    </>
  );
}

import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/data";
import { getSiteSettings } from "@/lib/settings";
import { categoryPath } from "@/lib/url";
import { getBlogPosts } from "@/lib/blog";
import { getLocalSeoPages } from "@/lib/local-seo-pages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (settings.seo?.canonical_domain
      ? `https://${settings.seo.canonical_domain}`
      : "https://example.com");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/location`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/faqs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const [products, categories] = await Promise.all([
      getProducts({}),
      getCategories(),
    ]);
    categoryRoutes = categories.map((category) => ({
      url: `${baseUrl}${categoryPath(category.name)}`,
      lastModified: category.createdAt instanceof Date
        ? category.createdAt
        : new Date(category.createdAt),
      changeFrequency: "daily",
      priority: 0.85,
    }));
    productRoutes = products.map((p) => ({
      url: `${baseUrl}/product/${p.id}`,
      lastModified: p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // If DB unreachable, ship just static routes — better than crashing.
  }

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getBlogPosts({ publishedOnly: true });
    blogRoutes = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt instanceof Date
        ? post.updatedAt
        : new Date(post.updatedAt),
      changeFrequency: "monthly",
      priority: 0.65,
    }));
  } catch {
    // Blog table may not exist before the first schema push.
  }

  const localSeoRoutes: MetadataRoute.Sitemap = getLocalSeoPages(settings).map((page) => ({
    url: `${baseUrl}/areas/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.55,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...blogRoutes,
    ...localSeoRoutes,
  ];
}

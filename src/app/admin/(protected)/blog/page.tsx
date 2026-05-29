import Link from "next/link";
import { Plus } from "lucide-react";
import { getBlogPosts } from "@/lib/blog";
import { BlogList } from "./BlogList";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await getBlogPosts();
  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog</h1>
          <p className="text-zinc-400">
            Publish educational articles and local SEO content.
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg"
        >
          <Plus className="w-4 h-4" /> New post
        </Link>
      </div>
      <BlogList posts={posts} />
    </div>
  );
}

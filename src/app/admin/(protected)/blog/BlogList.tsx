"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteBlogPost } from "@/lib/admin-mutations-client";
import type { BlogPost } from "@/lib/blog";

export function BlogList({ posts }: { posts: BlogPost[] }) {
  const [pending, startTransition] = useTransition();

  const onDelete = (post: BlogPost) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteBlogPost(post.id);
    });
  };

  if (posts.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
        No blog posts yet. Add your first educational SEO article.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium truncate">{post.title}</p>
              <span
                className={`px-2 py-0.5 text-xs rounded border ${
                  post.published
                    ? "bg-emerald-950/30 text-emerald-300 border-emerald-900"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800"
                }`}
              >
                {post.published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="text-sm text-zinc-500 truncate">
              /blog/{post.slug} · {post.category}
            </p>
          </div>
          <Link
            href={`/admin/blog/${post.id}`}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => onDelete(post)}
            disabled={pending}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg disabled:opacity-50"
            aria-label={`Delete ${post.title}`}
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      ))}
    </div>
  );
}

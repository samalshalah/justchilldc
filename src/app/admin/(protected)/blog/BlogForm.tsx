"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { upsertBlogPost } from "@/lib/admin-mutations-client";
import { Checkbox, Field, Input, Textarea } from "@/components/AdminFormControls";
import { AdminImageUploader } from "@/components/AdminImageUploader";
import type { BlogPost } from "@/lib/blog";

function tagsToText(tags: string): string {
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.join(", ") : "";
  } catch {
    return "";
  }
}

export function BlogForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [category, setCategory] = useState(post?.category ?? "General");
  const [tags, setTags] = useState(post ? tagsToText(post.tags) : "");
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featuredImageUrl ?? "");
  const [published, setPublished] = useState(post?.published ?? false);

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await upsertBlogPost({
          ...(post ? { id: post.id } : {}),
          title,
          slug,
          excerpt,
          content,
          seoTitle,
          seoDescription,
          category,
          tags,
          featuredImageUrl: featuredImageUrl || null,
          published,
        });
        router.push("/admin/blog");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </Field>
          <Field label="Slug" hint="Leave blank to generate from title">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="how-to-order-online" />
          </Field>
        </div>
        <Field label="Excerpt">
          <Textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </Field>
        <Field label="Content">
          <Textarea rows={12} value={content} onChange={(e) => setContent(e.target.value)} />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">SEO and organization</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Category">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Tags" hint="Comma-separated">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>
        </div>
        <Field label="SEO title">
          <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </Field>
        <Field label="SEO description">
          <Textarea rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
        </Field>
        <Field label="Featured image">
          <AdminImageUploader value={featuredImageUrl} onChange={setFeaturedImageUrl} />
        </Field>
        <Checkbox
          label="Published"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
      </section>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg p-3">
          {error}
        </p>
      )}
      <div className="flex gap-2 sticky bottom-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 -mx-6 -mb-6 px-6 py-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save post
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="px-5 py-2.5 border border-zinc-700 hover:bg-zinc-800 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

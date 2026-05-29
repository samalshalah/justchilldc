import { notFound } from "next/navigation";
import { getBlogPostById } from "@/lib/blog";
import { BlogForm } from "../BlogForm";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (!postId || isNaN(postId)) notFound();
  const post = (await getBlogPostById(postId)) ?? notFound();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit: {post.title}</h1>
      <BlogForm post={post} />
    </div>
  );
}

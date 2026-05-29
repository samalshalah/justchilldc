import { BlogForm } from "../BlogForm";

export const dynamic = "force-dynamic";

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">New Blog Post</h1>
      <BlogForm />
    </div>
  );
}

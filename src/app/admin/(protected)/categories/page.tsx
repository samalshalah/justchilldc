import { getCategories } from "@/lib/data";
import { CategoriesAdmin } from "./CategoriesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Categories</h1>
      <p className="text-zinc-400 mb-6">
        Used to organize your menu and group products.
      </p>
      <CategoriesAdmin categories={categories} />
    </div>
  );
}

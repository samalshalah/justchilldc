import { getCategories, getBrands } from "@/lib/data";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">New Product</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}

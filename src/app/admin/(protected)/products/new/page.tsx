import { getCategories, getBrands } from "@/lib/data";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold leading-tight sm:text-3xl">
        New Product
      </h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}

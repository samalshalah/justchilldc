import { notFound } from "next/navigation";
import { getCategories, getBrands, getProductById } from "@/lib/data";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!productId || isNaN(productId)) {
    // /admin/products/new is handled by a separate page route
    notFound();
  }
  const [productOrNull, categories, brands] = await Promise.all([
    getProductById(productId),
    getCategories(),
    getBrands(),
  ]);
  const product = productOrNull ?? notFound();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit: {product.name}</h1>
      <ProductForm
        categories={categories}
        brands={brands}
        product={product}
      />
    </div>
  );
}

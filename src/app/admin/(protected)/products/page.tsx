import Link from "next/link";
import { Plus } from "lucide-react";
import { getProducts } from "@/lib/data";
import { ProductsList } from "./ProductsList";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts({});
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Products</h1>
          <p className="text-zinc-400">{products.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/import"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 font-medium rounded-lg transition-colors"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add product
          </Link>
        </div>
      </div>

      <ProductsList products={products} />
    </div>
  );
}

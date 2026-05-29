import { getProducts } from "@/lib/data";
import { InventoryRow } from "./InventoryRow";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const products = await getProducts({});
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Inventory</h1>
      <p className="text-zinc-400 mb-6">
        Quick stock adjustments. Use the product editor for full edits.
      </p>
      {products.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
          No products to manage.
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          {products.map((p) => (
            <InventoryRow key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

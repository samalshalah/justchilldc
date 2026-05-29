import { getBrands } from "@/lib/data";
import { BrandsAdmin } from "./BrandsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const brands = await getBrands();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Brands</h1>
      <p className="text-zinc-400 mb-6">Brand metadata for products.</p>
      <BrandsAdmin brands={brands} />
    </div>
  );
}

import { getSiteSettings } from "@/lib/settings";
import { getBrands, getCategories, getProducts } from "@/lib/data";
import { buildSeoHealthReport } from "@/lib/seo-health";
import { SeoForm } from "./SeoForm";
import { SeoHealthPanel } from "./SeoHealthPanel";

export const dynamic = "force-dynamic";

export default async function AdminStoreSeoPage() {
  const [settings, products, categories, brands] = await Promise.all([
    getSiteSettings(),
    getProducts({}),
    getCategories(),
    getBrands(),
  ]);
  const report = buildSeoHealthReport({ settings, products, categories, brands });
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">SEO</h1>
      <p className="text-zinc-400 mb-6">
        Search metadata, structured data, indexing, and owner-friendly launch checks.
      </p>
      <SeoHealthPanel report={report} />
      <SeoForm initial={settings.seo ?? {}} />
    </div>
  );
}

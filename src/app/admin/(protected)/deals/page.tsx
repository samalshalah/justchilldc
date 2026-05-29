import { getSiteSettings } from "@/lib/settings";
import { DealsAdmin } from "./DealsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminDealsPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Deal Rules</h1>
      <p className="text-zinc-400 mb-6">
        Automatic checkout discounts. Marketing copy for the Deals page lives
        under Website Pages &gt; Deals.
      </p>
      <DealsAdmin initialDeals={settings.deal_rules ?? []} />
    </div>
  );
}

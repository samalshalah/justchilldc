import { getSiteSettings } from "@/lib/settings";
import { HoursForm } from "./HoursForm";

export const dynamic = "force-dynamic";

export default async function AdminStoreHoursPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Store Hours</h1>
      <p className="text-zinc-400 mb-6">
        Used for the Location page and to generate available pickup time slots
        at checkout.
      </p>
      <HoursForm initial={settings.store_hours ?? {}} />
    </div>
  );
}

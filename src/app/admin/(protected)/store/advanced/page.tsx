import { getSiteSettings } from "@/lib/settings";
import { AdvancedForm } from "./AdvancedForm";

export const dynamic = "force-dynamic";

export default async function AdminStoreAdvancedPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Integrations & Safety</h1>
      <p className="text-zinc-400 mb-6">
        Maintenance mode, analytics IDs, listing links, and tax display settings.
      </p>
      <AdvancedForm
        maintenanceMode={settings.maintenance_mode ?? false}
        maintenanceMessage={settings.maintenance_message ?? ""}
        integrations={settings.integrations ?? {}}
        taxes={settings.taxes ?? {}}
      />
    </div>
  );
}

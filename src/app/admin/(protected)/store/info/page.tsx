import { getSiteSettings } from "@/lib/settings";
import { StoreInfoForm } from "./StoreInfoForm";

export const dynamic = "force-dynamic";

export default async function AdminStoreInfoPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Business Info</h1>
      <p className="text-zinc-400 mb-6">
        The facts used across the site: name, logo, address, contact details, and socials.
      </p>
      <StoreInfoForm
        store={settings.store ?? {}}
        location={settings.location ?? {}}
        contact={settings.contact ?? {}}
      />
    </div>
  );
}

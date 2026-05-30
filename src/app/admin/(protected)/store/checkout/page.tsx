import { getSiteSettings } from "@/lib/settings";
import { CheckoutSettingsForm } from "./CheckoutSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminStoreCheckoutPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Checkout & Ordering</h1>
      <p className="text-zinc-400 mb-6">
        Field requirements, order emails, terms, and order pause toggle.
      </p>
      <CheckoutSettingsForm
        checkout={settings.checkout_config ?? {}}
        ordering={settings.ordering ?? {}}
        store={settings.store ?? {}}
      />
    </div>
  );
}

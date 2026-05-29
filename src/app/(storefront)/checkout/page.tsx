import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { CheckoutClient } from "@/components/CheckoutClient";
import { DEFAULTS } from "@/lib/defaults";
import { checkoutTermsText, complianceFooterText } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order for local pickup.",
  robots: { index: false, follow: false }, // Don't index transactional page
  alternates: { canonical: "/checkout" },
};

export default async function CheckoutPage() {
  const settings = await getSiteSettings();

  const cc = settings.checkout_config ?? {};
  const ord = settings.ordering ?? {};
  const schedule = settings.store_hours;

  return (
    <CheckoutClient
      config={{
        ordersPaused: ord.pause_all_orders ?? false,
        showNotes: cc.order_notes ?? true,
        showTerms: cc.terms_required ?? true,
        termsText: cc.terms_text ?? checkoutTermsText(settings),
        minOrder: cc.min_order_amount ?? 0,
        tipEnabled: cc.tipping_enabled ?? false,
        tipPresets: cc.tip_presets ?? [10, 15, 20],
        cashOnlyNotice: DEFAULTS.cashOnlyNotice,
        compliantFooter: complianceFooterText(settings),
      }}
      schedule={schedule}
    />
  );
}

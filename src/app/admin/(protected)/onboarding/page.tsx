import { count } from "drizzle-orm";
import { db, productsTable } from "@/lib/db";
import { isLocalPreviewMode } from "@/lib/preview";
import { getSiteSettings } from "@/lib/settings";
import { OnboardingWizard } from "./OnboardingWizard";

export const dynamic = "force-dynamic";

async function getProductCount(): Promise<number> {
  if (isLocalPreviewMode()) return 0;

  try {
    const [row] = await db.select({ n: count() }).from(productsTable);
    return row?.n ?? 0;
  } catch (err) {
    console.error("[admin/onboarding] product count failed:", err);
    return 0;
  }
}

export default async function AdminOnboardingPage() {
  const [settings, productCount] = await Promise.all([
    getSiteSettings(),
    getProductCount(),
  ]);

  return <OnboardingWizard settings={settings} productCount={productCount} />;
}

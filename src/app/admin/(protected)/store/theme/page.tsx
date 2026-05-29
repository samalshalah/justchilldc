import { getSiteSettings } from "@/lib/settings";
import { ThemeForm } from "./ThemeForm";

export const dynamic = "force-dynamic";

export default async function AdminStoreThemePage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Design</h1>
      <p className="text-zinc-400 mb-6">
        Site-wide colors and typography. Product card layout stays under Website Pages &gt; Shop.
      </p>
      <ThemeForm initial={settings.theme_config ?? null} />
    </div>
  );
}

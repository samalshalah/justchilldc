import { getSiteSettings } from "@/lib/settings";
import { PagesEditor } from "./PagesEditor";

export const dynamic = "force-dynamic";

export default async function AdminStorePagesPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Website Pages</h1>
      <p className="text-zinc-400 mb-6">
        Edit visible page copy, homepage sections, shop layout, and page-specific content.
      </p>
      <PagesEditor settings={settings} />
    </div>
  );
}

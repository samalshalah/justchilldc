import { getSiteSettings } from "@/lib/settings";
import { FaqsAdmin } from "./FaqsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">FAQs</h1>
      <p className="text-zinc-400 mb-6">
        Add owner-friendly answers for customers and search engines. Published FAQs can appear on the public FAQ page and in FAQ schema.
      </p>
      <FaqsAdmin initial={settings.faqs ?? {}} />
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Textarea, Checkbox } from "@/components/AdminFormControls";
import type { SiteSettings } from "@/lib/types";

type SeoSlice = NonNullable<SiteSettings["seo"]>;

interface Props {
  initial: SeoSlice;
}

const PAGE_KEYS = ["page_home", "page_shop", "page_product"] as const;
type PageKey = (typeof PAGE_KEYS)[number];

const PAGE_LABELS: Record<PageKey, string> = {
  page_home: "Home page",
  page_shop: "Shop page",
  page_product: "Product page",
};

export function SeoForm({ initial }: Props) {
  const [v, setV] = useState<SeoSlice>(initial ?? {});
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<SeoSlice>) => setV((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    setV(initial ?? {});
  }, [initial]);

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("seo", v);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Site-wide</h2>
        <p className="text-sm text-zinc-500">
          This screen controls how Google sees the site. Visible page headings
          and homepage text live under Website Pages.
        </p>
        <Field label="Title template" hint="Use {page}, {store}, {city} as placeholders">
          <Input
            value={v.title_template ?? ""}
            onChange={(e) => set({ title_template: e.target.value })}
            placeholder="{page} | {store} — {city}"
          />
        </Field>
        <Field label="Default meta description">
          <Textarea
            rows={3}
            value={v.meta_description ?? ""}
            onChange={(e) => set({ meta_description: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
      <Field label="Canonical domain" hint="Without protocol, e.g. example.com">
            <Input
              value={v.canonical_domain ?? ""}
              onChange={(e) => set({ canonical_domain: e.target.value })}
            />
          </Field>
          <Field label="City">
            <Input
              value={v.city ?? ""}
              onChange={(e) => set({ city: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Google Site Verification token (optional)">
          <Input
            value={v.google_site_verification ?? ""}
            onChange={(e) => set({ google_site_verification: e.target.value })}
          />
        </Field>
        <Checkbox
          label="Hide site from search engines"
          checked={v.robots_noindex ?? false}
          onChange={(e) => set({ robots_noindex: e.target.checked })}
        />
        <Checkbox
          label="Enable structured data for rich search results"
          checked={v.auto_structured_data !== false}
          onChange={(e) => set({ auto_structured_data: e.target.checked })}
        />
      </section>

      {PAGE_KEYS.map((page) => (
        <section
          key={page}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3"
        >
          <h2 className="font-semibold text-zinc-200">{PAGE_LABELS[page]}</h2>
          <Field
            label="Search title override"
            hint={
              page === "page_product"
                ? "Use {product}, {store}, {city}, {category}, {strain}, {thc}"
                : "Use {page}, {store}, {city}"
            }
          >
            <Input
              value={v[page]?.title ?? ""}
              onChange={(e) =>
                set({ [page]: { ...(v[page] ?? {}), title: e.target.value } })
              }
            />
          </Field>
          <Field
            label="Search description override"
            hint={
              page === "page_product"
                ? "Product descriptions support the same product placeholders"
                : undefined
            }
          >
            <Textarea
              rows={2}
              value={v[page]?.description ?? ""}
              onChange={(e) =>
                set({ [page]: { ...(v[page] ?? {}), description: e.target.value } })
              }
            />
          </Field>
        </section>
      ))}

      <div className="flex items-center gap-3 sticky bottom-0 bg-zinc-950 border-t border-zinc-800 -mx-6 -mb-6 px-6 py-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save changes
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}

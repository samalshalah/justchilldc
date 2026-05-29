"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { resolvePdpConfig } from "@/lib/shop-config";
import { Field, Checkbox, Select } from "@/components/AdminFormControls";

type PdpConfig = NonNullable<SiteSettings["pdp_config"]>;

export function PdpEditor({ settings }: { settings: SiteSettings }) {
  const initial = resolvePdpConfig(settings);
  const [cfg, setCfg] = useState<PdpConfig>(() => ({
    show_specs: settings.pdp_config?.show_specs ?? initial.showSpecs,
    show_effects: settings.pdp_config?.show_effects ?? initial.showEffects,
    show_terpenes: settings.pdp_config?.show_terpenes ?? initial.showTerpenes,
    show_flavors: settings.pdp_config?.show_flavors ?? initial.showFlavors,
    show_trust_badges:
      settings.pdp_config?.show_trust_badges ?? initial.showTrustBadges,
    show_related: settings.pdp_config?.show_related ?? initial.showRelated,
    related_count: settings.pdp_config?.related_count ?? initial.relatedCount as 3 | 4 | 6 | 8,
    related_source:
      settings.pdp_config?.related_source ?? initial.relatedSource,
    show_breadcrumb:
      settings.pdp_config?.show_breadcrumb ?? initial.showBreadcrumb,
    image_gallery_style:
      settings.pdp_config?.image_gallery_style ?? initial.imageGalleryStyle,
  }));

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<PdpConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("pdp_config", cfg);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-5">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-zinc-200">Page sections</h3>
        <p className="text-xs text-zinc-500 mb-2">
          Toggle which information sections appear on each product&rsquo;s
          detail page. Sections are hidden automatically if a product has no
          data for them.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Checkbox
            label="Breadcrumb (Home / Shop / Product)"
            checked={cfg.show_breadcrumb ?? true}
            onChange={(e) => update({ show_breadcrumb: e.target.checked })}
          />
          <Checkbox
            label="Specs panel (THC, CBD, weight, etc)"
            checked={cfg.show_specs ?? true}
            onChange={(e) => update({ show_specs: e.target.checked })}
          />
          <Checkbox
            label="Effects pills"
            checked={cfg.show_effects ?? true}
            onChange={(e) => update({ show_effects: e.target.checked })}
          />
          <Checkbox
            label="Terpenes pills"
            checked={cfg.show_terpenes ?? true}
            onChange={(e) => update({ show_terpenes: e.target.checked })}
          />
          <Checkbox
            label="Flavors pills"
            checked={cfg.show_flavors ?? true}
            onChange={(e) => update({ show_flavors: e.target.checked })}
          />
          <Checkbox
            label="Trust badges (lab tested / fast pickup)"
            checked={cfg.show_trust_badges ?? true}
            onChange={(e) => update({ show_trust_badges: e.target.checked })}
          />
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-zinc-200">Related products</h3>
        <Checkbox
          label="Show related products section"
          checked={cfg.show_related ?? true}
          onChange={(e) => update({ show_related: e.target.checked })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="How many to show">
            <Select
              value={String(cfg.related_count ?? 3)}
              onChange={(e) =>
                update({
                  related_count: parseInt(e.target.value, 10) as 3 | 4 | 6 | 8,
                })
              }
            >
              <option value="3">3 products</option>
              <option value="4">4 products</option>
              <option value="6">6 products</option>
              <option value="8">8 products</option>
            </Select>
          </Field>
          <Field label="Selection algorithm">
            <Select
              value={cfg.related_source ?? "same_category"}
              onChange={(e) =>
                update({
                  related_source: e.target
                    .value as PdpConfig["related_source"],
                })
              }
            >
              <option value="same_category">Same category</option>
              <option value="same_strain">Same strain type</option>
              <option value="featured">Featured products</option>
              <option value="newest">Newest products</option>
            </Select>
          </Field>
        </div>
        <p className="text-xs text-zinc-500">
          In all cases, featured products are shown first within the matched
          pool.
        </p>
      </section>

      <SaveBar pending={pending} saved={saved} error={error} onSave={onSave} />
    </div>
  );
}

function SaveBar({
  pending,
  saved,
  error,
  onSave,
}: {
  pending: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3 sticky bottom-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 -mx-6 -mb-6 px-6 py-4 mt-6">
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
  );
}

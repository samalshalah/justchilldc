"use client";

import { useState, useTransition } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Textarea, Checkbox } from "@/components/AdminFormControls";
import type { SiteSettings } from "@/lib/types";

type Integrations = NonNullable<SiteSettings["integrations"]>;
type Taxes = NonNullable<SiteSettings["taxes"]>;

interface Props {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  integrations: Integrations;
  taxes: Taxes;
}

export function AdvancedForm({
  maintenanceMode: initMM,
  maintenanceMessage: initMsg,
  integrations: initInt,
  taxes: initTax,
}: Props) {
  const [mm, setMM] = useState(initMM);
  const [msg, setMsg] = useState(initMsg);
  const [integrations, setIntegrations] = useState<Integrations>(initInt);
  const [taxes, setTaxes] = useState<Taxes>(initTax);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("maintenance_mode", mm);
        await saveSettingSlice("maintenance_message", msg);
        await saveSettingSlice("integrations", integrations);
        await saveSettingSlice("taxes", taxes);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <section
        className={`bg-zinc-900 border-2 rounded-xl p-5 space-y-4 ${
          mm ? "border-amber-700" : "border-zinc-800"
        }`}
      >
        <h2 className="font-semibold text-zinc-200 flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${mm ? "text-amber-500" : "text-zinc-500"}`} />
          Coming Soon / Launch Mode
        </h2>
        <Checkbox
          label="Show coming soon page to visitors while the store is being set up"
          checked={mm}
          onChange={(e) => setMM(e.target.checked)}
        />
        <Field label="Coming soon message">
          <Textarea
            rows={3}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Our site is currently under maintenance. Please check back soon."
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Analytics</h2>
        <p className="text-sm text-zinc-500">
          IDs are pasted into the site head when set. Leave blank to disable.
        </p>
        <Field label="Google Analytics 4 measurement ID">
          <Input
            value={integrations.ga4_id ?? ""}
            onChange={(e) =>
              setIntegrations({ ...integrations, ga4_id: e.target.value })
            }
            placeholder="G-XXXXXXXXXX"
          />
        </Field>
        <Field label="Google Tag Manager container ID">
          <Input
            value={integrations.gtm_id ?? ""}
            onChange={(e) =>
              setIntegrations({ ...integrations, gtm_id: e.target.value })
            }
            placeholder="GTM-XXXXXXX"
          />
        </Field>
        <Field label="Meta (Facebook) Pixel ID">
          <Input
            value={integrations.meta_pixel_id ?? ""}
            onChange={(e) =>
              setIntegrations({ ...integrations, meta_pixel_id: e.target.value })
            }
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Listings</h2>
        <Field label="Weedmaps URL">
          <Input
            value={integrations.weedmaps_url ?? ""}
            onChange={(e) =>
              setIntegrations({ ...integrations, weedmaps_url: e.target.value })
            }
          />
        </Field>
        <Field label="Leafly URL">
          <Input
            value={integrations.leafly_url ?? ""}
            onChange={(e) =>
              setIntegrations({ ...integrations, leafly_url: e.target.value })
            }
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Taxes (display only)</h2>
        <p className="text-sm text-zinc-500">
                Keep disabled where taxes do not apply; enable only for markets where checkout tax display is required.
        </p>
        <Checkbox
          label="Show tax line at checkout"
          checked={taxes.enabled ?? false}
          onChange={(e) => setTaxes({ ...taxes, enabled: e.target.checked })}
        />
        {taxes.enabled && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Label">
              <Input
                value={taxes.label ?? "Tax"}
                onChange={(e) => setTaxes({ ...taxes, label: e.target.value })}
              />
            </Field>
            <Field label="Default rate (%)">
              <Input
                type="number"
                step="0.01"
                min={0}
                value={taxes.default_rate ?? 0}
                onChange={(e) =>
                  setTaxes({
                    ...taxes,
                    default_rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Field>
          </div>
        )}
      </section>

      <div className="flex items-center gap-3 sticky bottom-0 bg-zinc-950 border-t border-zinc-800 -mx-6 -mb-6 px-6 py-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save settings
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}

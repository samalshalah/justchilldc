"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Textarea, Checkbox } from "@/components/AdminFormControls";
import type { SiteSettings } from "@/lib/types";

type CO = NonNullable<SiteSettings["checkout_config"]>;
type OR = NonNullable<SiteSettings["ordering"]>;
type ST = NonNullable<SiteSettings["store"]>;

interface Props {
  checkout: CO;
  ordering: OR;
  store: ST;
}

export function CheckoutSettingsForm({
  checkout: initCO,
  ordering: initOR,
  store: initStore,
}: Props) {
  const [co, setCO] = useState<CO>(initCO);
  const [or, setOR] = useState<OR>(initOR);
  const [store, setStore] = useState<ST>(initStore);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("checkout_config", co);
        await saveSettingSlice("ordering", or);
        await saveSettingSlice("store", store);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  const tipPresets = co.tip_presets ?? [10, 15, 20];
  const updateTip = (idx: number, value: number) => {
    const next = [...tipPresets];
    next[idx] = value;
    setCO({ ...co, tip_presets: next });
  };
  const addTip = () => setCO({ ...co, tip_presets: [...tipPresets, 25] });
  const removeTip = (idx: number) =>
    setCO({ ...co, tip_presets: tipPresets.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Order intake</h2>
        <Checkbox
          label="🚨 PAUSE all new orders (emergency stop)"
          checked={or.pause_all_orders ?? false}
          onChange={(e) => setOR({ ...or, pause_all_orders: e.target.checked })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minimum order amount ($)">
            <Input
              type="number"
              min={0}
              value={co.min_order_amount ?? 0}
              onChange={(e) =>
                setCO({ ...co, min_order_amount: parseFloat(e.target.value) || 0 })
              }
            />
          </Field>
          <Field label="Pickup prep time (minutes)">
            <Input
              type="number"
              min={0}
              value={or.pickup_prep_time ?? 30}
              onChange={(e) =>
                setOR({ ...or, pickup_prep_time: parseInt(e.target.value, 10) || 30 })
              }
            />
          </Field>
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Order emails</h2>
        <Checkbox
          label="Send pickup order emails"
          checked={store.order_confirmation_enabled ?? false}
          onChange={(e) =>
            setStore({
              ...store,
              order_confirmation_enabled: e.target.checked,
            })
          }
        />
        <Field
          label="Store notification emails"
          hint="Customers always receive a confirmation when order emails are enabled. Add one or more staff emails separated by commas."
        >
          <Input
            type="email"
            value={store.order_confirmation_email ?? ""}
            onChange={(e) =>
              setStore({ ...store, order_confirmation_email: e.target.value })
            }
            placeholder="orders@justchilldc.com"
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Form fields</h2>
        <div className="grid grid-cols-2 gap-3">
          <Checkbox
            label="Show order notes field"
            checked={co.order_notes ?? true}
            onChange={(e) => setCO({ ...co, order_notes: e.target.checked })}
          />
          <Checkbox
            label="Allow guest checkout"
            checked={co.guest_checkout ?? true}
            onChange={(e) => setCO({ ...co, guest_checkout: e.target.checked })}
          />
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Tipping</h2>
        <Checkbox
          label="Enable tipping at checkout"
          checked={co.tipping_enabled ?? false}
          onChange={(e) => setCO({ ...co, tipping_enabled: e.target.checked })}
        />
        {co.tipping_enabled && (
          <Field label="Tip presets (%)">
            <div className="flex flex-wrap gap-2 items-center">
              {tipPresets.map((t, i) => (
                <div key={i} className="inline-flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    value={t}
                    onChange={(e) =>
                      updateTip(i, parseFloat(e.target.value) || 0)
                    }
                    className="!w-20"
                  />
                  <button
                    type="button"
                    onClick={() => removeTip(i)}
                    className="p-1 text-zinc-400 hover:text-red-400"
                    aria-label="Remove preset"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTip}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm text-zinc-300 border border-zinc-700 rounded hover:bg-zinc-800"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </Field>
        )}
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Terms & conditions</h2>
        <Checkbox
          label="Require customer to agree to terms before placing order"
          checked={co.terms_required ?? true}
          onChange={(e) => setCO({ ...co, terms_required: e.target.checked })}
        />
        <Field label="Terms text (shown next to checkbox)">
          <Textarea
            rows={3}
            value={co.terms_text ?? ""}
            onChange={(e) => setCO({ ...co, terms_text: e.target.value })}
            placeholder="I am 21 years or older and agree to..."
          />
        </Field>
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

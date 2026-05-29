"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import type { DealRule } from "@/lib/types";
import { Field, Input, Select, Checkbox } from "@/components/AdminFormControls";

const DAYS = [
  { id: 0, label: "Sun" },
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
];

function newDeal(): DealRule {
  return {
    id: `d_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
    name: "New Deal",
    type: "site_wide",
    enabled: false,
    discountType: "percent",
    discountValue: 10,
  };
}

export function DealsAdmin({ initialDeals }: { initialDeals: DealRule[] }) {
  const [deals, setDeals] = useState<DealRule[]>(initialDeals);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (id: string, patch: Partial<DealRule>) => {
    setDeals((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const remove = (id: string) => {
    setDeals((d) => d.filter((x) => x.id !== id));
  };

  const add = () => {
    setDeals((d) => [...d, newDeal()]);
  };

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("deal_rules", deals);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      {deals.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
          No deals configured.
        </div>
      ) : (
        deals.map((deal) => (
          <div
            key={deal.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <Checkbox
                label="Enabled"
                checked={deal.enabled}
                onChange={(e) => update(deal.id, { enabled: e.target.checked })}
              />
              <button
                type="button"
                onClick={() => remove(deal.id)}
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg"
                aria-label="Delete deal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <Field label="Name (shown to customers)">
              <Input
                value={deal.name}
                onChange={(e) => update(deal.id, { name: e.target.value })}
              />
            </Field>

            <Field label="Type">
              <Select
                value={deal.type}
                onChange={(e) =>
                  update(deal.id, { type: e.target.value as DealRule["type"] })
                }
              >
                <option value="site_wide">Site-wide discount</option>
                <option value="spend_threshold">Spend threshold (e.g. $100+)</option>
                <option value="bogo">Buy X get Y free</option>
                <option value="quantity_break">Quantity break</option>
                <option value="day_of_week">Day-of-week special</option>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount type">
                <Select
                  value={deal.discountType ?? "percent"}
                  onChange={(e) =>
                    update(deal.id, {
                      discountType: e.target.value as "percent" | "flat",
                    })
                  }
                >
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat ($)</option>
                </Select>
              </Field>
              <Field label="Discount value">
                <Input
                  type="number"
                  min={0}
                  value={deal.discountValue ?? 0}
                  onChange={(e) =>
                    update(deal.id, {
                      discountValue: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </Field>
            </div>

            {deal.type === "spend_threshold" && (
              <Field label="Threshold ($)">
                <Input
                  type="number"
                  min={0}
                  value={deal.threshold ?? ""}
                  onChange={(e) =>
                    update(deal.id, { threshold: parseFloat(e.target.value) || 0 })
                  }
                />
              </Field>
            )}
            {deal.type === "bogo" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Buy quantity">
                  <Input
                    type="number"
                    min={1}
                    value={deal.buyQty ?? 2}
                    onChange={(e) =>
                      update(deal.id, { buyQty: parseInt(e.target.value, 10) || 2 })
                    }
                  />
                </Field>
                <Field label="Get free">
                  <Input
                    type="number"
                    min={1}
                    value={deal.getQty ?? 1}
                    onChange={(e) =>
                      update(deal.id, { getQty: parseInt(e.target.value, 10) || 1 })
                    }
                  />
                </Field>
              </div>
            )}
            {deal.type === "quantity_break" && (
              <Field label="Minimum quantity">
                <Input
                  type="number"
                  min={1}
                  value={deal.minQty ?? 3}
                  onChange={(e) =>
                    update(deal.id, { minQty: parseInt(e.target.value, 10) || 3 })
                  }
                />
              </Field>
            )}
            {deal.type === "day_of_week" && (
              <Field label="Active days">
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => {
                    const active = (deal.days ?? []).includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          const cur = deal.days ?? [];
                          const next = active
                            ? cur.filter((x) => x !== d.id)
                            : [...cur, d.id].sort();
                          update(deal.id, { days: next });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          active
                            ? "bg-amber-600 text-white border-amber-600"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}
          </div>
        ))
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add deal
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save deals
        </button>
        {saved && (
          <span className="text-sm text-emerald-400">Saved ✓</span>
        )}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}

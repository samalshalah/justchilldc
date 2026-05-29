"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Textarea } from "@/components/AdminFormControls";

type Deals = NonNullable<SiteSettings["deals"]>;

export function DealsPageEditor({ settings }: { settings: SiteSettings }) {
  const [deals, setDeals] = useState<Deals>(settings.deals ?? {});
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () =>
    setDeals({
      ...deals,
      items: [
        ...(deals.items ?? []),
        { title: "New deal", description: "", badge: "" },
      ],
    });

  const removeItem = (i: number) => {
    const next = [...(deals.items ?? [])];
    next.splice(i, 1);
    setDeals({ ...deals, items: next });
  };

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("deals", deals);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-5">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Header</h3>
        <Field label="Page title">
          <Input
            value={deals.title ?? ""}
            onChange={(e) => setDeals({ ...deals, title: e.target.value })}
            placeholder="Current Deals"
          />
        </Field>
        <Field label="Page subtitle">
          <Textarea
            rows={2}
            value={deals.subtitle ?? ""}
            onChange={(e) => setDeals({ ...deals, subtitle: e.target.value })}
            placeholder="Save more on your favorite products."
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-200">Promotional cards</h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-zinc-700 hover:bg-zinc-800 rounded-lg"
          >
            <Plus className="w-3 h-3" /> Add card
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Static marketing cards for the deals page. Live deal <em>rules</em>{" "}
          (configured under Admin → Deals) are shown automatically below
          these cards.
        </p>
        {(deals.items ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500 italic">
            No deal cards. The deals page will only show active rules.
          </p>
        ) : (
          <div className="space-y-3">
            {(deals.items ?? []).map((item, i) => (
              <div
                key={i}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-zinc-500">Card {i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded"
                    aria-label="Remove card"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <Field label="Badge (optional)">
                  <Input
                    value={item.badge ?? ""}
                    onChange={(e) => {
                      const next = [...(deals.items ?? [])];
                      next[i] = { ...next[i], badge: e.target.value };
                      setDeals({ ...deals, items: next });
                    }}
                    placeholder="Limited Time"
                  />
                </Field>
                <Field label="Title">
                  <Input
                    value={item.title}
                    onChange={(e) => {
                      const next = [...(deals.items ?? [])];
                      next[i] = { ...next[i], title: e.target.value };
                      setDeals({ ...deals, items: next });
                    }}
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => {
                      const next = [...(deals.items ?? [])];
                      next[i] = { ...next[i], description: e.target.value };
                      setDeals({ ...deals, items: next });
                    }}
                  />
                </Field>
              </div>
            ))}
          </div>
        )}
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

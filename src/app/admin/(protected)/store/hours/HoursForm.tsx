"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Textarea, Checkbox } from "@/components/AdminFormControls";
import type { StoreHoursConfig, WeekDay } from "@/lib/types";

const DAYS: { id: WeekDay; label: string }[] = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

const DEFAULT_DAY = { enabled: true, open: "10:00", close: "22:00" };

export function HoursForm({ initial }: { initial: StoreHoursConfig }) {
  const [hours, setHours] = useState<StoreHoursConfig>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDay = (
    day: WeekDay,
    patch: Partial<{ enabled: boolean; open: string; close: string }>
  ) => {
    setHours((h) => ({
      ...h,
      schedule: {
        ...(h.schedule ?? ({} as StoreHoursConfig["schedule"])),
        [day]: { ...DEFAULT_DAY, ...(h.schedule?.[day] ?? {}), ...patch },
      } as StoreHoursConfig["schedule"],
    }));
  };

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("store_hours", hours);
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
        <Checkbox
          label="Temporarily closed (override schedule)"
          checked={hours.temporarily_closed ?? false}
          onChange={(e) =>
            setHours({ ...hours, temporarily_closed: e.target.checked })
          }
        />
        {hours.temporarily_closed && (
          <Field label="Closed message (shown to customers)">
            <Textarea
              rows={2}
              value={hours.closed_message ?? ""}
              onChange={(e) =>
                setHours({ ...hours, closed_message: e.target.value })
              }
            />
          </Field>
        )}
        <Checkbox
          label="Show hours on the public Location page"
          checked={hours.show_on_website ?? true}
          onChange={(e) =>
            setHours({ ...hours, show_on_website: e.target.checked })
          }
        />
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
        <h2 className="font-semibold text-zinc-200 mb-3">Weekly schedule</h2>
        {DAYS.map((d) => {
          const day = hours.schedule?.[d.id] ?? DEFAULT_DAY;
          return (
            <div
              key={d.id}
              className="flex flex-wrap items-center gap-3 py-2 border-b border-zinc-800 last:border-0"
            >
              <div className="w-28 shrink-0">
                <Checkbox
                  label={d.label}
                  checked={day.enabled}
                  onChange={(e) => updateDay(d.id, { enabled: e.target.checked })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => updateDay(d.id, { open: e.target.value })}
                  disabled={!day.enabled}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-600 disabled:opacity-40"
                />
                <span className="text-zinc-500 text-sm">–</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => updateDay(d.id, { close: e.target.value })}
                  disabled={!day.enabled}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-600 disabled:opacity-40"
                />
              </div>
            </div>
          );
        })}
      </section>

      <div className="flex items-center gap-3 sticky bottom-0 bg-zinc-950 border-t border-zinc-800 -mx-6 -mb-6 px-6 py-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save hours
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}

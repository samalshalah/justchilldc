"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import type { SiteSettings } from "@/lib/types";

interface Props<K extends keyof SiteSettings> {
  sliceKey: K;
  initial: SiteSettings[K];
  /** Render the form fields. Receives current value + setter. */
  children: (
    value: NonNullable<SiteSettings[K]>,
    update: (patch: Partial<NonNullable<SiteSettings[K]>>) => void,
    setValue: (next: NonNullable<SiteSettings[K]>) => void
  ) => React.ReactNode;
}

export function SettingsForm<K extends keyof SiteSettings>({
  sliceKey,
  initial,
  children,
}: Props<K>) {
  const [value, setValue] = useState<NonNullable<SiteSettings[K]>>(
    (initial ?? ({} as NonNullable<SiteSettings[K]>)) as NonNullable<SiteSettings[K]>
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<NonNullable<SiteSettings[K]>>) => {
    setValue((v) => ({ ...(v as object), ...patch } as NonNullable<SiteSettings[K]>));
  };

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice(sliceKey, value);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {children(value, update, setValue)}

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

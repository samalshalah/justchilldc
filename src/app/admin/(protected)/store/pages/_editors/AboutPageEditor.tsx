"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { SiteSettings, AboutConfig } from "@/lib/types";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Textarea, Checkbox } from "@/components/AdminFormControls";
import { AdminImageUploader } from "@/components/AdminImageUploader";

export function AboutPageEditor({ settings }: { settings: SiteSettings }) {
  const [about, setAbout] = useState<AboutConfig>(settings.about ?? {});
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<AboutConfig>) =>
    setAbout((a) => ({ ...a, ...patch }));

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("about", about);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  const highlights = about.highlights ?? [];
  const addHighlight = () =>
    update({ highlights: [...highlights, ""] });
  const updateHighlight = (i: number, v: string) => {
    const next = [...highlights];
    next[i] = v;
    update({ highlights: next });
  };
  const removeHighlight = (i: number) => {
    const next = [...highlights];
    next.splice(i, 1);
    update({ highlights: next });
  };

  const stats = about.stats ?? [];
  const addStat = () =>
    update({ stats: [...stats, { num: "", label: "" }] });
  const updateStat = (
    i: number,
    field: "num" | "label",
    v: string
  ) => {
    const next = [...stats];
    next[i] = { ...next[i], [field]: v };
    update({ stats: next });
  };
  const removeStat = (i: number) => {
    const next = [...stats];
    next.splice(i, 1);
    update({ stats: next });
  };

  return (
    <div className="space-y-5">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Header</h3>
        <Field label="Page title (H1)">
          <Input
            value={about.title ?? ""}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="About Us"
          />
        </Field>
        <Field label="Subtitle">
          <Textarea
            rows={2}
            value={about.subtitle ?? ""}
            onChange={(e) => update({ subtitle: e.target.value })}
          />
        </Field>
        <Field label="Headline (large above story)">
          <Input
            value={about.headline ?? ""}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </Field>
        <Field label="Hero image">
          <AdminImageUploader
            value={about.imageUrl ?? ""}
            onChange={(v) => update({ imageUrl: v })}
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Story</h3>
        <Checkbox
          label="Show story section"
          checked={about.show_story !== false}
          onChange={(e) => update({ show_story: e.target.checked })}
        />
        <Field label="Story content">
          <Textarea
            rows={6}
            value={about.content ?? ""}
            onChange={(e) => update({ content: e.target.value })}
            placeholder="Our journey, our values, what makes us different..."
          />
        </Field>
        <Field label="Year founded">
          <Input
            value={about.year_founded ?? ""}
            onChange={(e) => update({ year_founded: e.target.value })}
            placeholder="2022"
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Mission &amp; vision</h3>
        <Checkbox
          label="Show mission"
          checked={about.show_mission !== false}
          onChange={(e) => update({ show_mission: e.target.checked })}
        />
        <Field label="Mission statement">
          <Textarea
            rows={3}
            value={about.mission ?? ""}
            onChange={(e) => update({ mission: e.target.value })}
          />
        </Field>
        <Checkbox
          label="Show vision"
          checked={about.show_vision !== false}
          onChange={(e) => update({ show_vision: e.target.checked })}
        />
        <Field label="Vision statement">
          <Textarea
            rows={3}
            value={about.vision ?? ""}
            onChange={(e) => update({ vision: e.target.value })}
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-200">Highlights</h3>
          <button
            type="button"
            onClick={addHighlight}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-zinc-700 hover:bg-zinc-800 rounded-lg"
          >
            <Plus className="w-3 h-3" /> Add highlight
          </button>
        </div>
        <Checkbox
          label="Show highlights section"
          checked={about.show_highlights !== false}
          onChange={(e) => update({ show_highlights: e.target.checked })}
        />
        {highlights.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">No highlights yet.</p>
        ) : (
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={h}
                  onChange={(e) => updateHighlight(i, e.target.value)}
                  placeholder="One thing your store is great at"
                />
                <button
                  type="button"
                  onClick={() => removeHighlight(i)}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg shrink-0"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-200">Stats</h3>
          <button
            type="button"
            onClick={addStat}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-zinc-700 hover:bg-zinc-800 rounded-lg"
          >
            <Plus className="w-3 h-3" /> Add stat
          </button>
        </div>
        <Checkbox
          label="Show stats section"
          checked={about.show_stats !== false}
          onChange={(e) => update({ show_stats: e.target.checked })}
        />
        {stats.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">No stats yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-[120px_1fr_auto] gap-2 items-center"
              >
                <Input
                  value={s.num}
                  onChange={(e) => updateStat(i, "num", e.target.value)}
                  placeholder="500+"
                />
                <Input
                  value={s.label}
                  onChange={(e) => updateStat(i, "label", e.target.value)}
                  placeholder="Happy customers"
                />
                <button
                  type="button"
                  onClick={() => removeStat(i)}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg shrink-0"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
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

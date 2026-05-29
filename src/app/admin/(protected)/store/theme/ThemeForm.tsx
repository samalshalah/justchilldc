"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Select } from "@/components/AdminFormControls";
import {
  DEFAULT_THEME_CONFIG,
  PALETTES,
  BODY_FONTS,
  DISPLAY_FONTS,
  type ThemeConfig,
} from "@/lib/theme";

export function ThemeForm({ initial }: { initial: ThemeConfig | null }) {
  const [theme, setTheme] = useState<ThemeConfig>({
    ...DEFAULT_THEME_CONFIG,
    ...(initial ?? {}),
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = (paletteId: string) => {
    const p = PALETTES.find((x) => x.id === paletteId);
    if (!p) return;
    setTheme({
      ...theme,
      preset: p.id,
      mode: p.mode,
      accent: p.accent,
      primary: p.primary,
    });
  };

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("theme_config", theme);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="font-semibold text-zinc-200 mb-3">Palette</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Pick a starting point. You can override individual colors below.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              className={`text-left rounded-xl overflow-hidden border-2 transition-colors ${
                theme.preset === p.id
                  ? "border-amber-500"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex">
                <div className="flex-1 h-12" style={{ backgroundColor: p.background }} />
                <div className="w-8 h-12" style={{ backgroundColor: p.primary }} />
                <div className="w-8 h-12" style={{ backgroundColor: p.accent }} />
              </div>
              <div className="p-2 bg-zinc-950">
                <p className="text-xs font-semibold text-zinc-200">{p.name}</p>
                <p className="text-[10px] text-zinc-500 uppercase">{p.mode}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Color overrides</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mode">
            <Select
              value={theme.mode}
              onChange={(e) =>
                setTheme({ ...theme, mode: e.target.value as "dark" | "light" })
              }
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </Select>
          </Field>
          <Field label="Border radius (rem)">
            <Input
              type="number"
              step="0.05"
              min={0}
              max={2}
              value={theme.radius}
              onChange={(e) =>
                setTheme({ ...theme, radius: parseFloat(e.target.value) || 0 })
              }
            />
          </Field>
        </div>
        <ColorField
          label="Accent (CTAs, highlights)"
          value={theme.accent}
          onChange={(v) => setTheme({ ...theme, accent: v })}
        />
        <ColorField
          label="Primary (buttons, panels)"
          value={theme.primary}
          onChange={(v) => setTheme({ ...theme, primary: v })}
        />
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Typography</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Display font (headings)">
            <Select
              value={theme.font_display}
              onChange={(e) =>
                setTheme({ ...theme, font_display: e.target.value })
              }
            >
              {DISPLAY_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Body font">
            <Select
              value={theme.font_body}
              onChange={(e) =>
                setTheme({ ...theme, font_body: e.target.value })
              }
            >
              {BODY_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="font-semibold text-zinc-200 mb-2">Product cards</h2>
        <p className="text-sm text-zinc-500">
          Product card layout, badges, and image overlay are controlled in
          Website Pages &gt; Shop. This keeps product display decisions in one place.
        </p>
      </section>

      <div className="flex items-center gap-3 sticky bottom-0 bg-zinc-950 border-t border-zinc-800 -mx-6 -mb-6 px-6 py-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save theme
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded border border-zinc-800 bg-transparent cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="!font-mono !uppercase"
        />
      </div>
    </Field>
  );
}

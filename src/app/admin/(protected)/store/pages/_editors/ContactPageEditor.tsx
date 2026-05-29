"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Textarea, Checkbox } from "@/components/AdminFormControls";

type ContactPage = NonNullable<SiteSettings["contact_page"]>;

export function ContactPageEditor({ settings }: { settings: SiteSettings }) {
  const [cfg, setCfg] = useState<ContactPage>(settings.contact_page ?? {});
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<ContactPage>) =>
    setCfg((c) => ({ ...c, ...patch }));

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("contact_page", cfg);
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
        <h3 className="font-semibold text-zinc-200">Page copy</h3>
        <p className="text-xs text-zinc-500">
          Phone, email, and Instagram come from <strong>Business Info</strong>.
          This page is for the headline copy and intro paragraph.
        </p>
        <Field label="Page title (H1)">
          <Input
            value={cfg.h1 ?? ""}
            onChange={(e) => update({ h1: e.target.value })}
            placeholder="Contact Us"
          />
        </Field>
        <Field label="Subtitle">
          <Input
            value={cfg.subtitle ?? ""}
            onChange={(e) => update({ subtitle: e.target.value })}
            placeholder="We'd love to hear from you."
          />
        </Field>
        <Field label="Intro paragraph">
          <Textarea
            rows={3}
            value={cfg.intro ?? ""}
            onChange={(e) => update({ intro: e.target.value })}
            placeholder="A short paragraph about how to reach you, response time, etc."
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-zinc-200">Form</h3>
        <Checkbox
          label="Show contact form"
          checked={cfg.show_form !== false}
          onChange={(e) => update({ show_form: e.target.checked })}
        />
        <Field label="Success message (after submit)">
          <Textarea
            rows={2}
            value={cfg.success_message ?? ""}
            onChange={(e) => update({ success_message: e.target.value })}
            placeholder="Thanks — we'll get back to you within 24 hours."
          />
        </Field>
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

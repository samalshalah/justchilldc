"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Checkbox, Field, Input, Textarea } from "@/components/AdminFormControls";
import type { SiteSettings } from "@/lib/types";

type Faqs = NonNullable<SiteSettings["faqs"]>;
type FaqItem = NonNullable<Faqs["items"]>[number];

function newFaq(): FaqItem {
  return {
    id: crypto.randomUUID(),
    question: "New question",
    answer: "",
    category: "General",
    published: true,
  };
}

export function FaqsAdmin({ initial }: { initial: Faqs }) {
  const [faqs, setFaqs] = useState<Faqs>({
    title: initial.title ?? "Frequently Asked Questions",
    subtitle: initial.subtitle ?? "",
    items: initial.items ?? [],
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = faqs.items ?? [];

  const updateItem = (idx: number, patch: Partial<FaqItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setFaqs({ ...faqs, items: next });
  };

  const removeItem = (idx: number) => {
    const next = [...items];
    next.splice(idx, 1);
    setFaqs({ ...faqs, items: next });
  };

  const onSave = () => {
    setError(null);
    setSaved(false);
    const cleaned: Faqs = {
      ...faqs,
      items: items
        .map((item) => ({
          ...item,
          question: item.question.trim(),
          answer: item.answer.trim(),
          category: item.category?.trim() || "General",
          published: item.published !== false,
        }))
        .filter((item) => item.question && item.answer),
    };
    startTransition(async () => {
      try {
        await saveSettingSlice("faqs", cleaned);
        setFaqs(cleaned);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-zinc-200">Public FAQ page</h2>
        <Field label="Page title">
          <Input
            value={faqs.title ?? ""}
            onChange={(e) => setFaqs({ ...faqs, title: e.target.value })}
          />
        </Field>
        <Field label="Page subtitle">
          <Textarea
            rows={2}
            value={faqs.subtitle ?? ""}
            onChange={(e) => setFaqs({ ...faqs, subtitle: e.target.value })}
            placeholder="Answers to common ordering, pickup, product, and policy questions."
          />
        </Field>
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-200">FAQ items</h2>
            <p className="text-xs text-zinc-500">
              Keep answers concise and specific. These can be used for FAQ schema.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFaqs({ ...faqs, items: [...items, newFaq()] })}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-center text-zinc-500">
            No FAQs yet. Add questions customers ask before they order.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500">FAQ {idx + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded"
                    aria-label="Remove FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid md:grid-cols-[1fr_180px] gap-3">
                  <Field label="Question">
                    <Input
                      value={item.question}
                      onChange={(e) => updateItem(idx, { question: e.target.value })}
                    />
                  </Field>
                  <Field label="Category">
                    <Input
                      value={item.category ?? ""}
                      onChange={(e) => updateItem(idx, { category: e.target.value })}
                      placeholder="General"
                    />
                  </Field>
                </div>
                <Field label="Answer">
                  <Textarea
                    rows={3}
                    value={item.answer}
                    onChange={(e) => updateItem(idx, { answer: e.target.value })}
                  />
                </Field>
                <Checkbox
                  label="Published"
                  checked={item.published !== false}
                  onChange={(e) => updateItem(idx, { published: e.target.checked })}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center gap-3 sticky bottom-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 -mx-6 -mb-6 px-6 py-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save FAQs
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}

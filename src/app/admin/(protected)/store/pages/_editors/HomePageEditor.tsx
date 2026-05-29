"use client";

import { useState, useTransition } from "react";
import { Loader2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Textarea, Checkbox, Select } from "@/components/AdminFormControls";
import { AdminImageUploader } from "@/components/AdminImageUploader";

type Sections = NonNullable<SiteSettings["homepage_sections"]>;

const DEFAULT_ORDER = [
  "hero",
  "categories",
  "featured",
  "why_us",
  "testimonials",
  "newsletter",
];

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  categories: "Categories",
  featured: "Featured carousel",
  why_us: "Why Us",
  testimonials: "Testimonials",
  newsletter: "Newsletter",
};

type SubTab =
  | "order"
  | "hero"
  | "categories"
  | "featured"
  | "why_us"
  | "testimonials"
  | "newsletter";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "order", label: "Section Order" },
  { id: "hero", label: "Hero" },
  { id: "categories", label: "Categories" },
  { id: "featured", label: "Featured Carousel" },
  { id: "why_us", label: "Why Us" },
  { id: "testimonials", label: "Testimonials" },
  { id: "newsletter", label: "Newsletter" },
];

export function HomePageEditor({ settings }: { settings: SiteSettings }) {
  const [tab, setTab] = useState<SubTab>("order");
  const [sections, setSections] = useState<Sections>(
    settings.homepage_sections ?? {}
  );
  const [order, setOrder] = useState<string[]>(
    settings.homepage_section_order ?? DEFAULT_ORDER
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof Sections>(
    key: K,
    patch: Partial<NonNullable<Sections[K]>>
  ) => {
    setSections((s) => ({ ...s, [key]: { ...(s[key] ?? {}), ...patch } }));
  };

  const moveSection = (idx: number, delta: -1 | 1) => {
    const next = [...order];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
  };

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("homepage_sections", sections);
        await saveSettingSlice("homepage_section_order", order);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 border-b border-zinc-800 -mt-1">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
              tab === t.id
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "order" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-sm text-zinc-500 mb-4">
            Use the arrows to reorder sections on the homepage. Toggle visibility
            inside each section&rsquo;s tab.
          </p>
          <ol className="space-y-2">
            {order.map((id, idx) => {
              const visible = sections[id as keyof Sections]?.visible !== false;
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-lg p-3"
                >
                  <span className="font-mono text-xs text-zinc-500 w-5 text-right">
                    {idx + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">
                      {SECTION_LABELS[id] ?? id}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {visible ? "Visible on homepage" : "Hidden"}
                    </p>
                  </div>
                  {visible ? (
                    <Eye className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-zinc-600" />
                  )}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 1)}
                      disabled={idx === order.length - 1}
                      className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {tab === "hero" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <Checkbox
            label="Show hero section"
            checked={sections.hero?.visible !== false}
            onChange={(e) => update("hero", { visible: e.target.checked })}
          />
          <Field label="Badge (small text above headline)">
            <Input
              value={sections.hero?.badge ?? ""}
              onChange={(e) => update("hero", { badge: e.target.value })}
              placeholder="Locally Curated Menu"
            />
          </Field>
          <Field label="Headline">
            <Input
              value={sections.hero?.headline ?? ""}
              onChange={(e) => update("hero", { headline: e.target.value })}
              placeholder="Premium products, curated locally."
            />
          </Field>
          <Field label="Subheadline">
            <Textarea
              rows={2}
              value={sections.hero?.subheadline ?? ""}
              onChange={(e) => update("hero", { subheadline: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary button text">
              <Input
                value={sections.hero?.cta_primary ?? ""}
                onChange={(e) =>
                  update("hero", { cta_primary: e.target.value })
                }
                placeholder="Shop Menu"
              />
            </Field>
            <Field label="Primary button link">
              <Input
                value={sections.hero?.cta_primary_link ?? ""}
                onChange={(e) =>
                  update("hero", { cta_primary_link: e.target.value })
                }
                placeholder="/shop"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Secondary button text">
              <Input
                value={sections.hero?.cta_secondary ?? ""}
                onChange={(e) =>
                  update("hero", { cta_secondary: e.target.value })
                }
                placeholder="Our Story"
              />
            </Field>
            <Field label="Secondary button link">
              <Input
                value={sections.hero?.cta_secondary_link ?? ""}
                onChange={(e) =>
                  update("hero", { cta_secondary_link: e.target.value })
                }
                placeholder="/about"
              />
            </Field>
          </div>
          <Field
            label="Hero banner image"
            hint="Replaces the default. ~1920×900 recommended."
          >
            <AdminImageUploader
              value={sections.hero?.bannerImageUrl ?? ""}
              onChange={(v) => update("hero", { bannerImageUrl: v })}
            />
          </Field>
        </section>
      )}

      {tab === "categories" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <Checkbox
            label="Show categories section"
            checked={sections.categories?.visible !== false}
            onChange={(e) =>
              update("categories", { visible: e.target.checked })
            }
          />
          <Checkbox
            label="Show Shop by Brand / Feel / Strain links"
            checked={sections.categories?.show_quick_links !== false}
            onChange={(e) =>
              update("categories", { show_quick_links: e.target.checked })
            }
          />
          <Field label="Label (small text)">
            <Input
              value={sections.categories?.label ?? ""}
              onChange={(e) =>
                update("categories", { label: e.target.value })
              }
              placeholder="Browse Our Menu"
            />
          </Field>
          <Field label="Title">
            <Input
              value={sections.categories?.title ?? ""}
              onChange={(e) =>
                update("categories", { title: e.target.value })
              }
              placeholder="Pick Your Experience"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Desktop columns">
              <Select
                value={String(sections.categories?.columns ?? 4)}
                onChange={(e) =>
                  update("categories", {
                    columns: parseInt(e.target.value, 10) as 2 | 3 | 4 | 5 | 6,
                  })
                }
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mobile columns">
              <Select
                value={String(sections.categories?.mobile_columns ?? 2)}
                onChange={(e) =>
                  update("categories", {
                    mobile_columns: parseInt(e.target.value, 10) as 1 | 2 | 3,
                  })
                }
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Card size">
              <Select
                value={sections.categories?.card_size ?? "md"}
                onChange={(e) =>
                  update("categories", {
                    card_size: e.target.value as "sm" | "md" | "lg",
                  })
                }
              >
                <option value="sm">Small (wide)</option>
                <option value="md">Medium (compact)</option>
                <option value="lg">Large</option>
              </Select>
            </Field>
          </div>
        </section>
      )}

      {tab === "featured" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <Checkbox
            label="Show featured products section"
            checked={sections.featured?.visible !== false}
            onChange={(e) =>
              update("featured", { visible: e.target.checked })
            }
          />
          <Field label="Label">
            <Input
              value={sections.featured?.label ?? ""}
              onChange={(e) => update("featured", { label: e.target.value })}
              placeholder="Top Shelf"
            />
          </Field>
          <Field label="Title">
            <Input
              value={sections.featured?.title ?? ""}
              onChange={(e) => update("featured", { title: e.target.value })}
              placeholder="Featured Strains"
            />
          </Field>
          <p className="text-xs text-zinc-500">
            Products shown in the carousel are those with{" "}
            <strong>Featured = true</strong>. Click the star next to a product
            in the Products list to feature it instantly.
          </p>
        </section>
      )}

      {tab === "why_us" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <Checkbox
            label="Show 'why us' section"
            checked={sections.why_us?.visible !== false}
            onChange={(e) => update("why_us", { visible: e.target.checked })}
          />
          <Field label="Label">
            <Input
              value={sections.why_us?.label ?? ""}
              onChange={(e) => update("why_us", { label: e.target.value })}
            />
          </Field>
          <Field label="Title">
            <Input
              value={sections.why_us?.title ?? ""}
              onChange={(e) => update("why_us", { title: e.target.value })}
            />
          </Field>
          <Field label="Subtitle">
            <Textarea
              rows={3}
              value={sections.why_us?.subtitle ?? ""}
              onChange={(e) => update("why_us", { subtitle: e.target.value })}
            />
          </Field>
        </section>
      )}

      {tab === "testimonials" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <Checkbox
            label="Show testimonials section"
            checked={sections.testimonials?.visible !== false}
            onChange={(e) =>
              update("testimonials", { visible: e.target.checked })
            }
          />
          <Field label="Label">
            <Input
              value={sections.testimonials?.label ?? ""}
              onChange={(e) =>
                update("testimonials", { label: e.target.value })
              }
            />
          </Field>
          <Field label="Title">
            <Input
              value={sections.testimonials?.title ?? ""}
              onChange={(e) =>
                update("testimonials", { title: e.target.value })
              }
            />
          </Field>
          <p className="text-xs text-zinc-500">
            The testimonials themselves are currently static. Editing the
            quotes is a future feature.
          </p>
        </section>
      )}

      {tab === "newsletter" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <Checkbox
            label="Show newsletter section"
            checked={sections.newsletter?.visible !== false}
            onChange={(e) =>
              update("newsletter", { visible: e.target.checked })
            }
          />
          <Field label="Label">
            <Input
              value={sections.newsletter?.label ?? ""}
              onChange={(e) =>
                update("newsletter", { label: e.target.value })
              }
            />
          </Field>
          <Field label="Title">
            <Input
              value={sections.newsletter?.title ?? ""}
              onChange={(e) =>
                update("newsletter", { title: e.target.value })
              }
            />
          </Field>
          <Field label="Subtitle">
            <Textarea
              rows={2}
              value={sections.newsletter?.subtitle ?? ""}
              onChange={(e) =>
                update("newsletter", { subtitle: e.target.value })
              }
            />
          </Field>
        </section>
      )}

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

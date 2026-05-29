"use client";

import Link from "next/link";
import type React from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Save,
  Sparkles,
  Store,
  Wand2,
} from "lucide-react";
import { Field, Input, Textarea } from "@/components/AdminFormControls";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import {
  buildInitialOnboardingBusiness,
  generateOnboardingSettingsDraft,
  type OnboardingBusinessInput,
  type OnboardingSettingsDraft,
} from "@/lib/onboarding-content";
import type { SiteSettings } from "@/lib/types";
import { ImportClient } from "../products/import/ImportClient";

type StepId = "business" | "inventory" | "content" | "publish";

const STEPS: { id: StepId; label: string; description: string }[] = [
  {
    id: "business",
    label: "Business",
    description: "Store identity and local details",
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Upload products, brands, categories",
  },
  {
    id: "content",
    label: "SEO Content",
    description: "Generate pages, FAQs, and metadata",
  },
  {
    id: "publish",
    label: "Save",
    description: "Publish the setup to the website",
  },
];

const SEO_PAGES = [
  { key: "page_home", label: "Home page" },
  { key: "page_shop", label: "Shop page" },
  { key: "page_product", label: "Product page" },
  { key: "page_category", label: "Category pages" },
  { key: "page_brand", label: "Brand pages" },
  { key: "page_blog", label: "Blog pages" },
] as const;

interface Props {
  settings: SiteSettings;
  productCount: number;
}

type SaveStatus =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

export function OnboardingWizard({ settings, productCount }: Props) {
  const [step, setStep] = useState<StepId>("business");
  const [business, setBusiness] = useState<OnboardingBusinessInput>(() =>
    buildInitialOnboardingBusiness(settings)
  );
  const [draft, setDraft] = useState<OnboardingSettingsDraft>(() =>
    generateOnboardingSettingsDraft(buildInitialOnboardingBusiness(settings), settings)
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>(null);

  const stepIndex = useMemo(
    () => Math.max(0, STEPS.findIndex((item) => item.id === step)),
    [step]
  );
  const businessReady =
    business.name.trim().length > 1 &&
    (business.city.trim().length > 1 || business.address.trim().length > 1);

  function setBusinessField<K extends keyof OnboardingBusinessInput>(
    key: K,
    value: OnboardingBusinessInput[K]
  ) {
    setBusiness((prev) => ({ ...prev, [key]: value }));
  }

  function regenerateContent() {
    setDraft(generateOnboardingSettingsDraft(business, settings));
    setStatus(null);
    setStep("content");
  }

  function updateHero(
    patch: Partial<NonNullable<OnboardingSettingsDraft["homepage_sections"]["hero"]>>
  ) {
    setDraft((prev) => ({
      ...prev,
      homepage_sections: {
        ...prev.homepage_sections,
        hero: { ...(prev.homepage_sections.hero ?? {}), ...patch },
      },
    }));
  }

  function updateCategories(
    patch: Partial<
      NonNullable<OnboardingSettingsDraft["homepage_sections"]["categories"]>
    >
  ) {
    setDraft((prev) => ({
      ...prev,
      homepage_sections: {
        ...prev.homepage_sections,
        categories: { ...(prev.homepage_sections.categories ?? {}), ...patch },
      },
    }));
  }

  function updateFaq(
    id: string,
    patch: Partial<NonNullable<OnboardingSettingsDraft["faqs"]["items"]>[number]>
  ) {
    setDraft((prev) => ({
      ...prev,
      faqs: {
        ...prev.faqs,
        items: (prev.faqs.items ?? []).map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      },
    }));
  }

  async function publishSetup() {
    setSaving(true);
    setStatus(null);
    try {
      await saveSettingSlice("store", draft.store);
      await saveSettingSlice("location", draft.location);
      await saveSettingSlice("contact", draft.contact);
      await saveSettingSlice("homepage_sections", draft.homepage_sections);
      await saveSettingSlice(
        "homepage_section_order",
        settings.homepage_section_order ?? [
          "hero",
          "categories",
          "featured",
          "why_us",
          "newsletter",
        ]
      );
      await saveSettingSlice("about", draft.about);
      await saveSettingSlice("location_page", draft.location_page);
      await saveSettingSlice("contact_page", draft.contact_page);
      await saveSettingSlice("faqs", draft.faqs);
      await saveSettingSlice("seo", draft.seo);
      await saveSettingSlice("shop_config", draft.shop_config);

      setStatus({
        type: "success",
        message:
          "Setup saved. The website now has business info, page copy, FAQs, SEO metadata, and shop controls from this wizard.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Setup save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="border border-amber-900/50 bg-amber-950/20 rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-400">
              Launch Setup
            </p>
            <h1 className="text-3xl font-bold mt-1">Setup Wizard</h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-3xl leading-relaxed">
              Build the store foundation in minutes: business details, inventory
              readiness, SEO page copy, FAQs, and shop controls. Start manually
              now; optional integrations can be added later.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Products imported
            </p>
            <p className="text-2xl font-bold text-amber-500">{productCount}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <aside className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-fit">
          <div className="space-y-2">
            {STEPS.map((item, index) => {
              const active = item.id === step;
              const done = index < stepIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`w-full text-left rounded-lg px-3 py-3 transition-colors ${
                    active
                      ? "bg-amber-600 text-white"
                      : "bg-zinc-950 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full text-xs ${
                          active ? "bg-white/20" : "bg-zinc-800"
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}
                    <span className="font-semibold">{item.label}</span>
                  </span>
                  <span
                    className={`block text-xs mt-1 ${
                      active ? "text-amber-50/80" : "text-zinc-500"
                    }`}
                  >
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 md:p-6 min-h-[560px]">
          {step === "business" && (
            <BusinessStep
              business={business}
              businessReady={businessReady}
              setBusinessField={setBusinessField}
            />
          )}

          {step === "inventory" && (
            <InventoryStep productCount={productCount} businessReady={businessReady} />
          )}

          {step === "content" && (
            <ContentStep
              draft={draft}
              setDraft={setDraft}
              updateHero={updateHero}
              updateCategories={updateCategories}
              updateFaq={updateFaq}
              regenerateContent={regenerateContent}
            />
          )}

          {step === "publish" && (
            <PublishStep
              draft={draft}
              productCount={productCount}
              saving={saving}
              status={status}
              publishSetup={publishSetup}
            />
          )}

          <div className="border-t border-zinc-800 mt-8 pt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)].id)}
              disabled={stepIndex === 0 || saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {step === "business" && (
              <button
                type="button"
                onClick={() => setStep("inventory")}
                disabled={!businessReady}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-500 disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === "inventory" && (
              <button
                type="button"
                onClick={regenerateContent}
                disabled={!businessReady}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-500 disabled:opacity-50"
              >
                <Wand2 className="h-4 w-4" />
                Generate SEO content
              </button>
            )}

            {step === "content" && (
              <button
                type="button"
                onClick={() => setStep("publish")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-500"
              >
                Review setup
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === "publish" && (
              <button
                type="button"
                onClick={publishSetup}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-500 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save setup
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function BusinessStep({
  business,
  businessReady,
  setBusinessField,
}: {
  business: OnboardingBusinessInput;
  businessReady: boolean;
  setBusinessField: <K extends keyof OnboardingBusinessInput>(
    key: K,
    value: OnboardingBusinessInput[K]
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <StepTitle
        icon={<Store className="h-5 w-5" />}
        title="Business information"
        description="This becomes the source for local SEO, page copy, contact details, and structured data."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Store name">
          <Input
            value={business.name}
            onChange={(e) => setBusinessField("name", e.target.value)}
            placeholder="Just Chill DC"
          />
        </Field>
        <Field label="Tagline">
          <Input
            value={business.tagline}
            onChange={(e) => setBusinessField("tagline", e.target.value)}
            placeholder="Licensed cannabis menu in Washington, DC"
          />
        </Field>
      </div>
      <Field label="Street address">
        <Input
          value={business.address}
          onChange={(e) => setBusinessField("address", e.target.value)}
          placeholder="Store address"
        />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="City">
          <Input
            value={business.city}
            onChange={(e) => setBusinessField("city", e.target.value)}
            placeholder="Washington"
          />
        </Field>
        <Field label="State">
          <Input
            value={business.state}
            onChange={(e) => setBusinessField("state", e.target.value)}
            placeholder="DC"
          />
        </Field>
        <Field label="ZIP">
          <Input
            value={business.zip}
            onChange={(e) => setBusinessField("zip", e.target.value)}
            placeholder="20001"
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Phone">
          <Input
            value={business.phone}
            onChange={(e) => setBusinessField("phone", e.target.value)}
            placeholder="(202) 555-0123"
          />
        </Field>
        <Field label="Email">
          <Input
            value={business.email}
            onChange={(e) => setBusinessField("email", e.target.value)}
            placeholder="hello@example.com"
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Website">
          <Input
            value={business.website}
            onChange={(e) => setBusinessField("website", e.target.value)}
            placeholder="https://justchilldc.com"
          />
        </Field>
        <Field label="Canonical domain" hint="Used for SEO. Example: justchilldc.com">
          <Input
            value={business.domain}
            onChange={(e) => setBusinessField("domain", e.target.value)}
            placeholder="justchilldc.com"
          />
        </Field>
      </div>
      <Field label="Instagram URL">
        <Input
          value={business.instagram}
          onChange={(e) => setBusinessField("instagram", e.target.value)}
          placeholder="https://instagram.com/yourstore"
        />
      </Field>
      {!businessReady && (
        <p className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
          Add at least a store name and city or address before generating content.
        </p>
      )}
    </div>
  );
}

function InventoryStep({
  productCount,
  businessReady,
}: {
  productCount: number;
  businessReady: boolean;
}) {
  return (
    <div className="space-y-6">
      <StepTitle
        icon={<FileSpreadsheet className="h-5 w-5" />}
        title="Inventory import"
        description="Upload the inventory CSV here. The importer creates categories, brands, strain types, and product SEO descriptions."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Current products
          </p>
          <p className="text-4xl font-bold text-amber-500 mt-2">{productCount}</p>
          <p className="text-sm text-zinc-400 mt-2">
            After CSV upload, the homepage and mega menu can use real categories,
            brands, strains, and effects.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="font-semibold">Recommended order</p>
          <ol className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>1. Confirm business info.</li>
            <li>2. Upload inventory CSV.</li>
            <li>3. Generate page and SEO content.</li>
            <li>4. Review the website before launch.</li>
          </ol>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="font-semibold mb-4">Upload inventory CSV</p>
        <ImportClient />
      </div>
      {!businessReady && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/20 px-3 py-2 text-sm text-red-300">
          Business details need a store name and city or address before content
          can be generated.
        </p>
      )}
    </div>
  );
}

function ContentStep({
  draft,
  setDraft,
  updateHero,
  updateCategories,
  updateFaq,
  regenerateContent,
}: {
  draft: OnboardingSettingsDraft;
  setDraft: React.Dispatch<React.SetStateAction<OnboardingSettingsDraft>>;
  updateHero: (
    patch: Partial<NonNullable<OnboardingSettingsDraft["homepage_sections"]["hero"]>>
  ) => void;
  updateCategories: (
    patch: Partial<
      NonNullable<OnboardingSettingsDraft["homepage_sections"]["categories"]>
    >
  ) => void;
  updateFaq: (
    id: string,
    patch: Partial<NonNullable<OnboardingSettingsDraft["faqs"]["items"]>[number]>
  ) => void;
  regenerateContent: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <StepTitle
          icon={<Sparkles className="h-5 w-5" />}
          title="Generated SEO content"
          description="Review and edit the generated copy before saving it to the live settings."
        />
        <button
          type="button"
          onClick={regenerateContent}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
        >
          <Wand2 className="h-4 w-4" />
          Regenerate
        </button>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
        <h2 className="font-semibold">Footer and store description</h2>
        <Field
          label="Footer text"
          hint="This is the short store description customers see near the bottom of the website."
        >
          <Textarea
            rows={4}
            value={draft.store.footer_text ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                store: { ...prev.store, footer_text: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Age gate message">
          <Textarea
            rows={3}
            value={draft.store.age_gate_message ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                store: { ...prev.store, age_gate_message: e.target.value },
              }))
            }
          />
        </Field>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
        <h2 className="font-semibold">Homepage hero</h2>
        <Field label="Hero headline">
          <Input
            value={draft.homepage_sections.hero?.headline ?? ""}
            onChange={(e) => updateHero({ headline: e.target.value })}
          />
        </Field>
        <Field label="Hero subheadline">
          <Textarea
            rows={3}
            value={draft.homepage_sections.hero?.subheadline ?? ""}
            onChange={(e) => updateHero({ subheadline: e.target.value })}
          />
        </Field>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
        <h2 className="font-semibold">Shop links and menu copy</h2>
        <Field label="Category section title">
          <Input
            value={draft.homepage_sections.categories?.title ?? ""}
            onChange={(e) => updateCategories({ title: e.target.value })}
          />
        </Field>
        <Field label="Shop page heading">
          <Input
            value={draft.shop_config.h1 ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                shop_config: { ...prev.shop_config, h1: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Shop page subtitle">
          <Textarea
            rows={2}
            value={draft.shop_config.subtitle ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                shop_config: { ...prev.shop_config, subtitle: e.target.value },
              }))
            }
          />
        </Field>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
        <h2 className="font-semibold">Page copy</h2>
        <Field label="About page copy">
          <Textarea
            rows={5}
            value={draft.about.content ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                about: { ...prev.about, content: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Location page intro">
          <Textarea
            rows={3}
            value={draft.location_page.intro ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                location_page: { ...prev.location_page, intro: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Contact page intro">
          <Textarea
            rows={3}
            value={draft.contact_page.intro ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                contact_page: { ...prev.contact_page, intro: e.target.value },
              }))
            }
          />
        </Field>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
        <h2 className="font-semibold">SEO metadata</h2>
        <Field label="SEO title template" hint="Use {page}, {store}, and {city} when needed.">
          <Input
            value={draft.seo.title_template ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                seo: { ...prev.seo, title_template: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Default meta description">
          <Textarea
            rows={3}
            value={draft.seo.meta_description ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                seo: { ...prev.seo, meta_description: e.target.value },
              }))
            }
          />
        </Field>
        {SEO_PAGES.map((page) => (
          <div
            key={page.key}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-3"
          >
            <h3 className="text-sm font-semibold text-zinc-200">{page.label}</h3>
            <Field label={`${page.label} SEO title`}>
              <Input
                value={draft.seo[page.key]?.title ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    seo: {
                      ...prev.seo,
                      [page.key]: {
                        ...(prev.seo[page.key] ?? {}),
                        title: e.target.value,
                      },
                    },
                  }))
                }
              />
            </Field>
            <Field label={`${page.label} SEO description`}>
              <Textarea
                rows={2}
                value={draft.seo[page.key]?.description ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    seo: {
                      ...prev.seo,
                      [page.key]: {
                        ...(prev.seo[page.key] ?? {}),
                        description: e.target.value,
                      },
                    },
                  }))
                }
              />
            </Field>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
        <h2 className="font-semibold">FAQs</h2>
        {(draft.faqs.items ?? []).map((item) => (
          <div key={item.id} className="rounded-lg border border-zinc-800 p-3 space-y-3">
            <Field label="Question">
              <Input
                value={item.question}
                onChange={(e) => updateFaq(item.id, { question: e.target.value })}
              />
            </Field>
            <Field label="Answer">
              <Textarea
                rows={3}
                value={item.answer}
                onChange={(e) => updateFaq(item.id, { answer: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </section>
    </div>
  );
}

function PublishStep({
  draft,
  productCount,
  saving,
  status,
  publishSetup,
}: {
  draft: OnboardingSettingsDraft;
  productCount: number;
  saving: boolean;
  status: SaveStatus;
  publishSetup: () => void;
}) {
  return (
    <div className="space-y-6">
      <StepTitle
        icon={<Save className="h-5 w-5" />}
        title="Review and save"
        description="This will write the generated setup into the existing backend controls."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard label="Store name" value={draft.store.name ?? "Not set"} />
        <SummaryCard label="Shop heading" value={draft.shop_config.h1 ?? "Not set"} />
        <SummaryCard
          label="Home SEO title"
          value={draft.seo.page_home?.title || "Not set"}
        />
        <SummaryCard
          label="Footer text"
          value={draft.store.footer_text || "Not set"}
        />
        <SummaryCard
          label="Canonical domain"
          value={draft.seo.canonical_domain || "Not set"}
        />
        <SummaryCard label="Products imported" value={String(productCount)} />
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="font-semibold">What will be saved</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-zinc-400">
          <p>Business info and contact details</p>
          <p>Homepage hero and shop links</p>
          <p>About, location, and contact page copy</p>
          <p>FAQ manager content</p>
          <p>SEO title template and page descriptions</p>
          <p>Shop filters for brand, feel, strain, and category</p>
        </div>
      </div>
      {status && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            status.type === "success"
              ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-300"
              : "border-red-900/60 bg-red-950/20 text-red-300"
          }`}
        >
          {status.message}
        </div>
      )}
      {status?.type === "success" && (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          >
            <ExternalLink className="h-4 w-4" />
            View homepage
          </Link>
          <Link
            href="/admin/store/pages"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          >
            <ExternalLink className="h-4 w-4" />
            Open Website Pages
          </Link>
        </div>
      )}
      {saving && (
        <p className="inline-flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving setup...
        </p>
      )}
    </div>
  );
}

function StepTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-600 text-white">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Field, Input, Textarea, Checkbox } from "@/components/AdminFormControls";
import { AdminImageUploader } from "@/components/AdminImageUploader";
import type { SiteSettings } from "@/lib/types";

type StoreSlice = NonNullable<SiteSettings["store"]>;
type LocationSlice = NonNullable<SiteSettings["location"]>;
type ContactSlice = NonNullable<SiteSettings["contact"]>;
type StoreInfoKey = "store" | "location" | "contact";

interface Props {
  store: StoreSlice;
  location: LocationSlice;
  contact: ContactSlice;
}

const TABS = [
  { id: "basics", label: "Brand & Basics" },
  { id: "address", label: "Location & Contact" },
] as const;
type Tab = (typeof TABS)[number]["id"];

async function saveStoreInfoSlice(
  key: StoreInfoKey,
  value: StoreSlice | LocationSlice | ContactSlice
) {
  const res = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Save failed (HTTP ${res.status})`);
  }
}

export function StoreInfoForm({
  store: initStore,
  location: initLocation,
  contact: initContact,
}: Props) {
  const [tab, setTab] = useState<Tab>("basics");
  const [store, setStore] = useState<StoreSlice>(initStore);
  const [location, setLocation] = useState<LocationSlice>(initLocation);
  const [contact, setContact] = useState<ContactSlice>(initContact);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveStoreInfoSlice("store", store);
        await saveStoreInfoSlice("location", location);
        await saveStoreInfoSlice("contact", contact);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              tab === t.id
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "basics" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <Field label="Store name">
            <Input
              value={store.name ?? ""}
              onChange={(e) => setStore({ ...store, name: e.target.value })}
            />
          </Field>
          <Field label="Tagline">
            <Input
              value={store.tagline ?? ""}
              onChange={(e) => setStore({ ...store, tagline: e.target.value })}
            />
          </Field>
          <Field label="Footer text">
            <Textarea
              rows={2}
              value={store.footer_text ?? ""}
              onChange={(e) => setStore({ ...store, footer_text: e.target.value })}
            />
          </Field>
          <Field label="Age gate message">
            <Textarea
              rows={2}
              value={store.age_gate_message ?? ""}
              onChange={(e) =>
                setStore({ ...store, age_gate_message: e.target.value })
              }
            />
          </Field>
          <Field label="Logo (light theme)">
            <AdminImageUploader
              value={store.logo_light ?? ""}
              onChange={(v) => setStore({ ...store, logo_light: v })}
            />
          </Field>
          <Field label="Logo (dark theme)">
            <AdminImageUploader
              value={store.logo_dark ?? ""}
              onChange={(v) => setStore({ ...store, logo_dark: v })}
            />
          </Field>
          <Field label="Instagram URL">
            <Input
              value={store.instagram ?? ""}
              onChange={(e) => setStore({ ...store, instagram: e.target.value })}
                placeholder="https://instagram.com/yourstore"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Twitter URL">
              <Input
                value={store.twitter ?? ""}
                onChange={(e) => setStore({ ...store, twitter: e.target.value })}
              />
            </Field>
            <Field label="Facebook URL">
              <Input
                value={store.facebook ?? ""}
                onChange={(e) => setStore({ ...store, facebook: e.target.value })}
              />
            </Field>
          </div>
          <Checkbox
            label="Show age gate to visitors"
            checked={store.display_age_gate ?? true}
            onChange={(e) =>
              setStore({ ...store, display_age_gate: e.target.checked })
            }
          />
        </div>
      )}

      {tab === "address" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-zinc-200">Store location</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Edit the visible Location page headline under Website Pages.
              Keep this screen focused on business facts.
            </p>
          </div>
          <Field label="Address">
            <Input
              value={location.address ?? ""}
              onChange={(e) =>
                setLocation({ ...location, address: e.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City">
              <Input
                value={location.city ?? ""}
                onChange={(e) =>
                  setLocation({ ...location, city: e.target.value })
                }
              />
            </Field>
            <Field label="State">
              <Input
                value={location.state ?? ""}
                onChange={(e) =>
                  setLocation({ ...location, state: e.target.value })
                }
              />
            </Field>
            <Field label="Zip">
              <Input
                value={location.zip ?? ""}
                onChange={(e) =>
                  setLocation({ ...location, zip: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Phone">
            <Input
              value={location.phone ?? ""}
              onChange={(e) =>
                setLocation({ ...location, phone: e.target.value })
              }
            />
          </Field>
          <Field
            label="Google Maps embed URL"
            hint="Get from 'Share → Embed a map' on Google Maps. Paste the src= value."
          >
            <Input
              value={location.mapEmbedUrl ?? ""}
              onChange={(e) =>
                setLocation({ ...location, mapEmbedUrl: e.target.value })
              }
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
          </Field>
          <Checkbox
            label="Hide address from public site (still used for SEO)"
            checked={store.display_hide_address ?? false}
            onChange={(e) =>
              setStore({ ...store, display_hide_address: e.target.checked })
            }
          />

          <h3 className="text-sm font-semibold text-zinc-300 mt-6 pt-4 border-t border-zinc-800">
            Contact details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact email">
              <Input
                type="email"
                value={contact.email ?? ""}
                onChange={(e) =>
                  setContact({ ...contact, email: e.target.value })
                }
              />
            </Field>
            <Field label="Contact phone">
              <Input
                value={contact.phone ?? ""}
                onChange={(e) =>
                  setContact({ ...contact, phone: e.target.value })
                }
              />
            </Field>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 sticky bottom-0 bg-zinc-950 border-t border-zinc-800 -mx-6 -mb-6 px-6 py-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg disabled:opacity-60"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save all
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}

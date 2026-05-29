"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { upsertBrand, deleteBrand } from "@/lib/admin-mutations-client";
import type { Brand } from "@/lib/data";
import { Field, Input, Textarea, Checkbox } from "@/components/AdminFormControls";
import { AdminImageUploader } from "@/components/AdminImageUploader";
import { logoUrl as storageLogoUrl } from "@/lib/images";

export function BrandsAdmin({ brands }: { brands: Brand[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Brand | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  const onDelete = (b: Brand) => {
    if (!confirm(`Delete brand "${b.name}"?`)) return;
    startTransition(async () => {
      await deleteBrand(b.id);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add brand
        </button>
      </div>

      {brands.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
          No brands yet.
        </div>
      ) : (
        <div className="space-y-2">
          {brands.map((b) => {
            const logoSrc = storageLogoUrl(b.logoUrl);
            return (
            <div
              key={b.id}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3"
            >
              {logoSrc ? (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-zinc-800">
                  <img
                    src={logoSrc}
                    alt={b.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-zinc-800 shrink-0 border border-zinc-800" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {b.name}{" "}
                  {b.featured && (
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-800">
                      Featured
                    </span>
                  )}
                </p>
                <p className="text-sm text-zinc-500 truncate">
                  {b.description || b.website || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(b)}
                className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(b)}
                disabled={pending}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg disabled:opacity-50"
                aria-label={`Delete ${b.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            );
          })}
        </div>
      )}

      {editing && (
        <BrandDialog
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}

function BrandDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: Brand | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await upsertBrand({
          ...(initial ? { id: initial.id } : {}),
          name: name.trim(),
          description,
          website,
          logoUrl: logoUrl || null,
          featured,
        });
        onClose();
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {initial ? `Edit: ${initial.name}` : "New Brand"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:bg-zinc-800 rounded-lg"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>
          <Field label="Website">
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </Field>
          <Field label="Logo">
            <AdminImageUploader value={logoUrl} onChange={setLogoUrl} />
          </Field>
          <Checkbox
            label="Featured brand"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg p-2.5">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-60"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

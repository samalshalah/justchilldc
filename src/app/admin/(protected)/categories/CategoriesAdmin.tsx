"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import { upsertCategory, deleteCategory } from "@/lib/admin-mutations-client";
import type { Category } from "@/lib/data";
import { Field, Input, Textarea } from "@/components/AdminFormControls";
import { AdminImageUploader } from "@/components/AdminImageUploader";
import { categoryImageUrl } from "@/lib/images";

export function CategoriesAdmin({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  const onDelete = (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    startTransition(async () => {
      await deleteCategory(cat.id);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
          No categories yet. Add your first.
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => {
            const imageSrc = categoryImageUrl(c.imageUrl, c.name);
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3"
              >
                {imageSrc ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-zinc-800">
                    <img
                      src={imageSrc}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-zinc-800 shrink-0 border border-zinc-800" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-sm text-zinc-500 truncate">
                    {c.description || c.slug || "No description yet"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c)}
                  disabled={pending}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg disabled:opacity-50"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <CategoryDialog
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}

function CategoryDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
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
        await upsertCategory({
          ...(initial ? { id: initial.id } : {}),
          name: name.trim(),
          description,
          imageUrl: imageUrl || null,
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
            {initial ? `Edit: ${initial.name}` : "New Category"}
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
          <Field label="Image">
            <AdminImageUploader value={imageUrl} onChange={setImageUrl} />
          </Field>
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

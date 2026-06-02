"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Tag,
  Sparkles,
  CheckSquare,
  Square,
  X,
  Loader2,
  Search,
  Star,
} from "lucide-react";
import {
  isProductLogoFallback,
  productImageFitClass,
  productImageUrl,
} from "@/lib/images";
import {
  bulkDeleteProducts,
  bulkApplyDiscount,
  bulkSetInStock,
  bulkSetFeatured,
  bulkRegenerateDescriptions,
  deleteProduct,
} from "@/lib/admin-mutations-client";
import type { Product } from "@/lib/data";

type BulkMode =
  | { kind: "discount" }
  | { kind: "delete" }
  | null;

interface Props {
  products: Product[];
}

export function ProductsList({ products }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState<BulkMode>(null);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<number>>(() => new Set());
  /** Per-row optimistic override of `featured` — wins over server value. */
  const [featuredOverrides, setFeaturedOverrides] = useState<
    Map<number, boolean>
  >(() => new Map());
  /** Per-row "saving" state so the star can show a spinner */
  const [savingFeatured, setSavingFeatured] = useState<Set<number>>(
    () => new Set()
  );

  const filtered = useMemo(() => {
    const visibleProducts = products.filter((p) => !removedIds.has(p.id));
    if (!search.trim()) return visibleProducts;
    const q = search.trim().toLowerCase();
    return visibleProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q)
    );
  }, [products, removedIds, search]);

  const allSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const noneSelected = selected.size === 0;

  const toggle = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    if (allSelected) {
      setSelected((s) => {
        const next = new Set(s);
        for (const p of filtered) next.delete(p.id);
        return next;
      });
    } else {
      setSelected((s) => {
        const next = new Set(s);
        for (const p of filtered) next.add(p.id);
        return next;
      });
    }
  };

  const clearSelection = () => setSelected(new Set());

  const markRemoved = (ids: number[]) => {
    setRemovedIds((current) => {
      const next = new Set(current);
      for (const id of ids) next.add(id);
      return next;
    });
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const runStockAction = (inStock: boolean) => {
    if (noneSelected) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      try {
        const res = await bulkSetInStock(ids, inStock);
        flash(`Marked ${res.updated} ${inStock ? "in stock" : "out of stock"}`);
        clearSelection();
        router.refresh();
      } catch (err) {
        flash(err instanceof Error ? err.message : "Action failed");
      }
    });
  };

  const runFeaturedAction = (featured: boolean) => {
    if (noneSelected) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      try {
        const res = await bulkSetFeatured(ids, featured);
        flash(
          `Marked ${res.updated} ${featured ? "featured" : "not featured"}`
        );
        clearSelection();
        router.refresh();
      } catch (err) {
        flash(err instanceof Error ? err.message : "Action failed");
      }
    });
  };

  /**
   * Toggle a single product's featured state with an optimistic UI update.
   * If the server call fails, we revert the local override.
   */
  const toggleSingleFeatured = (id: number, currentlyFeatured: boolean) => {
    const next = !currentlyFeatured;
    setFeaturedOverrides((m) => {
      const out = new Map(m);
      out.set(id, next);
      return out;
    });
    setSavingFeatured((s) => {
      const out = new Set(s);
      out.add(id);
      return out;
    });
    bulkSetFeatured([id], next)
      .then(() => {
        flash(next ? "Featured" : "Unfeatured");
        router.refresh();
      })
      .catch((err) => {
        setFeaturedOverrides((m) => {
          const out = new Map(m);
          out.set(id, currentlyFeatured);
          return out;
        });
        flash(err instanceof Error ? err.message : "Toggle failed");
      })
      .finally(() => {
        setSavingFeatured((s) => {
          const out = new Set(s);
          out.delete(id);
          return out;
        });
      });
  };

  const runRegenerate = () => {
    if (noneSelected) return;
    const ids = Array.from(selected);
    if (
      !confirm(
        `Regenerate descriptions for ${ids.length} product${
          ids.length === 1 ? "" : "s"
        }? This overwrites any existing descriptions.`
      )
    )
      return;
    startTransition(async () => {
      try {
        const res = await bulkRegenerateDescriptions(ids);
        flash(`Regenerated ${res.updated} description(s)`);
        clearSelection();
        router.refresh();
      } catch (err) {
        flash(err instanceof Error ? err.message : "Action failed");
      }
    });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleAllVisible}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-zinc-700 hover:bg-zinc-800 rounded-lg disabled:opacity-40"
        >
          {allSelected ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {allSelected ? "Deselect" : "Select all"}{" "}
          {search ? `(${filtered.length} shown)` : ""}
        </button>
        <span className="text-sm text-zinc-400">
          {selected.size === 0
            ? "Nothing selected"
            : `${selected.size} selected`}
        </span>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            (clear)
          </button>
        )}

        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, category"
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-600"
          />
        </div>
      </div>

      {/* Bulk action bar — shown when something is selected */}
      {selected.size > 0 && (
        <div className="bg-amber-950/30 border border-amber-900 rounded-xl p-3 mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-amber-300 mr-2">
            Bulk actions:
          </span>
          <button
            type="button"
            onClick={() => setBulkMode({ kind: "discount" })}
            disabled={pending}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
          >
            <Tag className="w-3.5 h-3.5" /> Apply discount
          </button>
          <button
            type="button"
            onClick={() => runStockAction(true)}
            disabled={pending}
            className="px-3 py-1.5 text-sm border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
          >
            Mark in stock
          </button>
          <button
            type="button"
            onClick={() => runStockAction(false)}
            disabled={pending}
            className="px-3 py-1.5 text-sm border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
          >
            Mark out of stock
          </button>
          <button
            type="button"
            onClick={() => runFeaturedAction(true)}
            disabled={pending}
            className="px-3 py-1.5 text-sm border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
          >
            Feature
          </button>
          <button
            type="button"
            onClick={() => runFeaturedAction(false)}
            disabled={pending}
            className="px-3 py-1.5 text-sm border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
          >
            Unfeature
          </button>
          <button
            type="button"
            onClick={runRegenerate}
            disabled={pending}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" /> Regenerate descriptions
          </button>
          <button
            type="button"
            onClick={() => setBulkMode({ kind: "delete" })}
            disabled={pending}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-red-900 bg-red-950/40 text-red-300 hover:bg-red-950/60 rounded-lg disabled:opacity-50 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          {pending && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="bg-emerald-950/30 border border-emerald-900 rounded-lg px-3 py-2 mb-3 text-sm text-emerald-300">
          {toast}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
          {search ? "No products match your search." : "No products yet. Add your first one."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const isSelected = selected.has(p.id);
            const featured = featuredOverrides.has(p.id)
              ? featuredOverrides.get(p.id)!
              : p.featured;
            const featuredSaving = savingFeatured.has(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 bg-zinc-900 border rounded-xl p-3 transition-colors ${
                  isSelected
                    ? "border-amber-600"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(p.id)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 accent-amber-600 shrink-0"
                  aria-label={`Select ${p.name}`}
                />
                <button
                  type="button"
                  onClick={() => toggleSingleFeatured(p.id, featured)}
                  disabled={featuredSaving}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                    featured
                      ? "text-amber-400 hover:bg-amber-950/30"
                      : "text-zinc-600 hover:text-amber-400 hover:bg-zinc-800"
                  } disabled:opacity-50`}
                  aria-label={featured ? `Unfeature ${p.name}` : `Feature ${p.name}`}
                  title={featured ? "Featured — click to unfeature" : "Click to feature"}
                >
                  {featuredSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star
                      className="w-4 h-4"
                      fill={featured ? "currentColor" : "none"}
                    />
                  )}
                </button>
                <div
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ${
                    isProductLogoFallback(p) ? "bg-white" : "bg-zinc-950"
                  }`}
                >
                  <img
                    src={productImageUrl(p)}
                    alt={p.name}
                    className={`h-full w-full ${productImageFitClass(p, "p-2")}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-sm text-zinc-500">
                    {p.category} · {p.strain} · ${p.price}
                    {p.salePrice ? ` (sale $${p.salePrice})` : ""}
                    {p.quantity != null && ` · qty ${p.quantity}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!p.inStock && (
                    <span className="px-2 py-0.5 text-xs rounded bg-red-900/30 text-red-300 border border-red-800">
                      OOS
                    </span>
                  )}
                  {p.salePrice && (
                    <span className="px-2 py-0.5 text-xs rounded bg-emerald-900/30 text-emerald-300 border border-emerald-800">
                      Sale
                    </span>
                  )}
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    Edit
                  </Link>
                  <SingleDeleteButton
                    id={p.id}
                    name={p.name}
                    onDeleted={() => {
                      markRemoved([p.id]);
                      clearSelection();
                      flash("Product deleted");
                      router.refresh();
                    }}
                    onError={(message) => flash(message)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Discount modal */}
      {bulkMode?.kind === "discount" && (
        <DiscountModal
          count={selected.size}
          onCancel={() => setBulkMode(null)}
          onApply={(mode, value) => {
            const ids = Array.from(selected);
            startTransition(async () => {
              try {
                const res = await bulkApplyDiscount(ids, mode, value);
                flash(`Updated ${res.updated} product(s)`);
                clearSelection();
                setBulkMode(null);
              } catch (err) {
                flash(err instanceof Error ? err.message : "Discount failed");
              }
            });
          }}
        />
      )}

      {/* Delete confirm modal */}
      {bulkMode?.kind === "delete" && (
        <DeleteConfirmModal
          count={selected.size}
          onCancel={() => setBulkMode(null)}
          onConfirm={() => {
            const ids = Array.from(selected);
            startTransition(async () => {
              try {
                const res = await bulkDeleteProducts(ids);
                markRemoved(ids);
                flash(`Deleted ${res.deleted} product(s)`);
                clearSelection();
                setBulkMode(null);
                router.refresh();
              } catch (err) {
                flash(err instanceof Error ? err.message : "Delete failed");
              }
            });
          }}
        />
      )}
    </div>
  );
}

function SingleDeleteButton({
  id,
  name,
  onDeleted,
  onError,
}: {
  id: number;
  name: string;
  onDeleted: () => void;
  onError: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const onClick = () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteProduct(id);
        onDeleted();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="p-2 rounded-lg text-zinc-400 hover:bg-red-950/40 hover:text-red-400 transition-colors disabled:opacity-50"
      aria-label={`Delete ${name}`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function DiscountModal({
  count,
  onCancel,
  onApply,
}: {
  count: number;
  onCancel: () => void;
  onApply: (mode: "percent" | "flat" | "clear", value?: number) => void;
}) {
  const [mode, setMode] = useState<"percent" | "flat" | "clear">("percent");
  const [percent, setPercent] = useState(20);
  const [flat, setFlat] = useState(40);

  const apply = () => {
    if (mode === "percent") onApply("percent", percent);
    else if (mode === "flat") onApply("flat", flat);
    else onApply("clear");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Apply discount to {count} product{count === 1 ? "" : "s"}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-zinc-400 hover:bg-zinc-800 rounded-lg"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-2 p-3 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800/50">
            <input
              type="radio"
              name="dmode"
              checked={mode === "percent"}
              onChange={() => setMode("percent")}
              className="mt-0.5 accent-amber-600"
            />
            <div className="flex-1">
              <p className="font-medium">Percent off regular price</p>
              <p className="text-xs text-zinc-500 mb-2">
                Sale price will be calculated as a % off each product&rsquo;s regular price.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={percent}
                  onChange={(e) =>
                    setPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))
                  }
                  disabled={mode !== "percent"}
                  className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-600 disabled:opacity-40"
                />
                <span className="text-sm text-zinc-400">% off</span>
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2 p-3 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800/50">
            <input
              type="radio"
              name="dmode"
              checked={mode === "flat"}
              onChange={() => setMode("flat")}
              className="mt-0.5 accent-amber-600"
            />
            <div className="flex-1">
              <p className="font-medium">Flat sale price</p>
              <p className="text-xs text-zinc-500 mb-2">
                Set the same sale price on every selected product. Useful when
                products are similar in price.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">$</span>
                <input
                  type="number"
                  min={1}
                  value={flat}
                  onChange={(e) => setFlat(parseInt(e.target.value, 10) || 1)}
                  disabled={mode !== "flat"}
                  className="w-24 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-600 disabled:opacity-40"
                />
              </div>
            </div>
          </label>

          <label className="flex items-start gap-2 p-3 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800/50">
            <input
              type="radio"
              name="dmode"
              checked={mode === "clear"}
              onChange={() => setMode("clear")}
              className="mt-0.5 accent-amber-600"
            />
            <div className="flex-1">
              <p className="font-medium">Clear sale price</p>
              <p className="text-xs text-zinc-500">
                Remove sale price from selected products (revert to regular price).
              </p>
            </div>
          </label>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={apply}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  count,
  onCancel,
  onConfirm,
}: {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const ok = confirmText.trim().toUpperCase() === "DELETE";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-red-900 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-red-400 mb-2">
          Permanently delete {count} product{count === 1 ? "" : "s"}?
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          This cannot be undone. Products will be removed immediately and any
          existing orders that reference them will keep their snapshot data.
        </p>
        <p className="text-sm text-zinc-300 mb-2">
          Type <strong>DELETE</strong> to confirm:
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600 mb-4"
          placeholder="DELETE"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ok}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete permanently
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 border border-zinc-700 hover:bg-zinc-800 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

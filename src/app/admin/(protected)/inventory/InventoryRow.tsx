"use client";

import { useState, useTransition } from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import {
  adjustProductQuantity,
  setProductStock,
} from "@/lib/admin-mutations-client";
import type { Product } from "@/lib/data";
import {
  isProductLogoFallback,
  productImageFitClass,
  productImageUrl,
} from "@/lib/images";

export function InventoryRow({ product }: { product: Product }) {
  const [pending, startTransition] = useTransition();
  const [optimisticQty, setOptimisticQty] = useState<number | null>(null);
  const [optimisticInStock, setOptimisticInStock] = useState<boolean | null>(null);

  const qty = optimisticQty ?? product.quantity ?? 0;
  const inStock = optimisticInStock ?? product.inStock;
  const lowStock =
    product.quantity != null &&
    product.lowStockThreshold != null &&
    qty <= product.lowStockThreshold;

  const adjust = (delta: number) => {
    const next = Math.max(0, qty + delta);
    setOptimisticQty(next);
    if (next === 0) setOptimisticInStock(false);
    if (next > 0 && !inStock) setOptimisticInStock(true);
    startTransition(async () => {
      try {
        await adjustProductQuantity(product.id, delta);
      } catch {
        setOptimisticQty(null);
        setOptimisticInStock(null);
      }
    });
  };

  const toggleStock = () => {
    const next = !inStock;
    setOptimisticInStock(next);
    startTransition(async () => {
      try {
        await setProductStock(product.id, { inStock: next });
      } catch {
        setOptimisticInStock(null);
      }
    });
  };

  return (
    <div className="flex items-center gap-3 p-4">
      <div
        className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-800 ${
          isProductLogoFallback(product) ? "bg-white" : "bg-zinc-950"
        }`}
      >
        <img
          src={productImageUrl(product)}
          alt={product.name}
          className={`h-full w-full ${productImageFitClass(product, "p-2")}`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{product.name}</p>
        <p className="text-sm text-zinc-500">
          {product.category} · {product.strain}
          {product.sku && ` · ${product.sku}`}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p
          className={`font-mono font-bold ${
            lowStock ? "text-amber-400" : "text-zinc-200"
          }`}
        >
          {product.quantity == null ? "—" : qty}
        </p>
        <p className="text-xs text-zinc-500">
          {product.quantity == null ? "untracked" : "in stock"}
        </p>
      </div>

      <div className="inline-flex items-center bg-zinc-800 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={pending || product.quantity == null || qty === 0}
          className="w-9 h-9 flex items-center justify-center hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => adjust(+1)}
          disabled={pending || product.quantity == null}
          className="w-9 h-9 flex items-center justify-center hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <button
        type="button"
        onClick={toggleStock}
        disabled={pending}
        className={`px-3 py-1.5 rounded-lg text-xs border whitespace-nowrap transition-colors ${
          inStock
            ? "bg-emerald-900/30 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50"
            : "bg-red-900/30 text-red-300 border-red-800 hover:bg-red-900/50"
        }`}
      >
        {inStock ? "In stock" : "Out of stock"}
      </button>

      {pending && (
        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
      )}
    </div>
  );
}

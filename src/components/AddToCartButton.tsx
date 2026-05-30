"use client";

import { useState } from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import { useCart } from "./CartContext";
import { toast } from "sonner";
import type { Product } from "@/lib/data";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const inStock = product.inStock !== false;

  const handleAdd = () => {
    if (!inStock) return;
    setAdding(true);
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        imageType: product.imageType,
        brandLogoUrl: product.brandLogoUrl ?? null,
      },
      quantity
    );
    toast.success("Added to bag", {
      description: `${quantity} × ${product.name}`,
    });
    setTimeout(() => setAdding(false), 300);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-3">
      <div className="inline-flex items-center bg-card border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-10 text-center font-bold text-foreground" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!inStock || adding}
        className="flex-1 px-6 py-3 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {adding ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : !inStock ? (
          "Out of stock"
        ) : (
          <>Add to Bag · ${product.price * quantity}</>
        )}
      </button>
    </div>
  );
}

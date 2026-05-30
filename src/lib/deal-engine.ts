/**
 * deal-engine.ts — shared deal computation, used by both client (display)
 * and server (recompute on order create).
 *
 * Important fix from the legacy app: the server now recomputes the same
 * thing the client computed, so a hostile client can't submit a fake total.
 */

import type { DealRule } from "./types";

interface CartItemForDeals {
  productId: number;
  price: number;
  quantity: number;
}

interface DealResult {
  ruleId: string;
  name: string;
  discountAmount: number;
}

export function computeBestDeal(
  deals: DealRule[],
  items: CartItemForDeals[],
  subtotal: number
): DealResult | null {
  if (items.length === 0) return null;
  const today = new Date().getDay();
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  let best: DealResult | null = null;

  for (const deal of deals) {
    if (!deal.enabled) continue;
    let discount = 0;

    switch (deal.type) {
      case "site_wide": {
        if (deal.discountType === "percent") {
          discount = subtotal * ((deal.discountValue ?? 0) / 100);
        } else {
          discount = Math.min(deal.discountValue ?? 0, subtotal);
        }
        break;
      }
      case "spend_threshold": {
        if (deal.threshold && subtotal >= deal.threshold) {
          discount =
            deal.discountType === "flat"
              ? Math.min(deal.discountValue ?? 0, subtotal)
              : subtotal * ((deal.discountValue ?? 0) / 100);
        }
        break;
      }
      case "day_of_week": {
        if (deal.days?.includes(today)) {
          discount =
            deal.discountType === "flat"
              ? Math.min(deal.discountValue ?? 0, subtotal)
              : subtotal * ((deal.discountValue ?? 0) / 100);
        }
        break;
      }
      case "quantity_break": {
        if (deal.minQty && totalQty >= deal.minQty) {
          discount = subtotal * ((deal.discountValue ?? 0) / 100);
        }
        break;
      }
      case "bogo": {
        if (deal.buyQty && totalQty >= deal.buyQty) {
          // Free items: cheapest items in cart counted "free"
          const sorted = items
            .flatMap((i) =>
              Array.from({ length: i.quantity }).map(() => i.price)
            )
            .sort((a, b) => a - b);
          const freeQty = (deal.getQty ?? 1) * Math.floor(totalQty / deal.buyQty);
          discount = sorted
            .slice(0, freeQty)
            .reduce((s, p) => s + p, 0);
        }
        break;
      }
    }

    if (discount > 0 && (!best || discount > best.discountAmount)) {
      best = {
        ruleId: deal.id,
        name: deal.name,
        discountAmount: Math.round(discount * 100) / 100,
      };
    }
  }
  return best;
}

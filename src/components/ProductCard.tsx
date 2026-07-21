"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, Plus, Tag } from "lucide-react";
import { useCart } from "./CartContext";
import { useSettings } from "./SettingsProvider";
import {
  isProductLogoFallback,
  isStorageImageUrl,
  productImageFitClass,
  productImageUrl,
} from "@/lib/images";
import { isDealActive } from "@/lib/deal-schedule";
import { isStaleGeneratedSeoCopy } from "@/lib/seo-generator";
import { DEFAULTS } from "@/lib/defaults";
import { toast } from "sonner";
import type { Product } from "@/lib/data";
import type { DealRule } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  index?: number;
  /** Hint to next/image for above-the-fold images. */
  priority?: boolean;
  /** Hide summary copy in dense homepage carousels to reduce repeated HTML. */
  showDescription?: boolean;
}

function getUpsellDeal(
  product: Product,
  deals: DealRule[],
  cartQty: number,
  cartTotal: number
): { label: string; color: string } | null {
  const today = new Date().getDay();
  const newTotal = cartTotal + product.price;

  for (const deal of deals) {
    if (!isDealActive(deal)) continue;
    if (deal.type === "site_wide") {
      const val =
        deal.discountType === "percent"
          ? `${deal.discountValue}% off everything`
          : `$${deal.discountValue} off`;
      return { label: `${val} active now`, color: "bg-accent text-accent-foreground" };
    }
    if (deal.type === "day_of_week" && deal.days?.includes(today)) {
      return { label: deal.name, color: "bg-purple-600 text-white" };
    }
    if (deal.type === "spend_threshold" && deal.threshold) {
      if (newTotal >= deal.threshold) {
        return {
          label: `Adding this unlocks ${deal.discountValue}% off`,
          color: "bg-emerald-600 text-white",
        };
      }
      const remaining = deal.threshold - cartTotal;
      if (remaining > 0 && remaining <= deal.threshold * 0.6) {
        return {
          label: `Spend $${remaining} more to get ${deal.discountValue}% off`,
          color: "bg-blue-600 text-white",
        };
      }
    }
    if (deal.type === "bogo" && deal.buyQty) {
      if (cartQty >= deal.buyQty) {
        return {
          label: `Buy ${deal.buyQty} Get ${deal.getQty ?? 1} Free`,
          color: "bg-orange-500 text-white",
        };
      }
      if (cartQty === deal.buyQty - 1) {
        return { label: "Add 1 more to get 1 free", color: "bg-orange-500 text-white" };
      }
    }
    if (deal.type === "quantity_break" && deal.minQty) {
      if (cartQty + 1 >= deal.minQty) {
        return {
          label: `Buy ${deal.minQty}+ and save ${deal.discountValue}%`,
          color: "bg-teal-600 text-white",
        };
      }
    }
  }
  return null;
}

function hasThcValue(value: string | null | undefined): value is string {
  const v = value?.trim();
  return Boolean(v) && v !== "-" && v !== "\u2014" && v !== "\u00e2\u20ac\u201d";
}

function thcBadgeLabel(value: string): string {
  return `THC: ${value}`;
}

export function ProductCard({
  product,
  index = 0,
  priority = false,
  showDescription = true,
}: ProductCardProps) {
  const { addItem, items, totalPrice } = useCart();
  const settings = useSettings();
  const sc = settings.shop_config ?? {};
  const mc = settings.menu_config ?? {};

  // Suppress cart/time-dependent content during SSR to prevent hydration mismatch.
  // `new Date().getDay()` and localStorage-backed cart both differ between server
  // and client — so we only compute the deal banner after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Prefer shop_config (new), fall back to menu_config (legacy), then sane defaults
  const badgePosition =
    sc.card_badge_position ?? mc.badge_position ?? "image";
  const showCategory = sc.card_show_category ?? mc.show_category ?? true;
  const showSaleBadge = sc.card_show_sale_badge ?? mc.show_sale_badge ?? true;
  const showDealBanner = sc.card_show_deal_banner ?? mc.show_deal_banner ?? true;
  const showImageGradient =
    sc.card_image_gradient ?? settings.theme_config?.product_image_gradient ?? true;

  const CARD_SHAPE: Record<string, string> = {
    sharp: "rounded-lg",
    rounded: "rounded-lg",
    extra: "rounded-xl",
    pill: "rounded-[2rem]",
  };
  const cardShape =
    CARD_SHAPE[sc.card_shape ?? mc.card_shape ?? "rounded"] ?? "rounded-lg";

  const imageUrl = productImageUrl(product);
  const logoFallback = isProductLogoFallback(product);
  const displayName = product.name;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const cardDescription = isStaleGeneratedSeoCopy(product.description)
    ? `Shop ${displayName} at ${storeName} in ${city}. View product details, category, strain type, price, and availability from the live menu.`
    : product.description;

  const strainColor =
    product.strain === "Sativa"
      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
      : product.strain === "Indica"
      ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

  const strainColorSmall =
    product.strain === "Sativa"
      ? "bg-orange-50 text-orange-600 border-orange-200"
      : product.strain === "Indica"
      ? "bg-purple-50 text-purple-600 border-purple-200"
      : "bg-emerald-50 text-emerald-600 border-emerald-200";

  // Guard all date/cart-dependent computations behind `mounted` so SSR
  // and the first client render produce identical HTML.
  const cartQty = mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0;
  const enabledDeals = mounted
    ? (settings.deal_rules ?? []).filter((d) => isDealActive(d))
    : [];
  const upsellDeal = mounted
    ? getUpsellDeal(product, enabledDeals, cartQty, totalPrice)
    : null;
  const savings =
    product.salePrice && product.salePrice < product.price
      ? product.price - product.salePrice
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      name: displayName,
      price: product.price,
      imageUrl: product.imageUrl,
      imageType: product.imageType,
      brandLogoUrl: product.brandLogoUrl ?? null,
    });
    toast.success("Added to bag", { description: displayName });
  };

  const showStrainBadge = sc.card_show_strain_badge ?? mc.show_strain_badge ?? true;
  const showThcBadgeSetting = sc.card_show_thc_badge ?? mc.show_thc_badge ?? true;
  const productThc = hasThcValue(product.thc) ? product.thc : "";
  const showThcBadge = showThcBadgeSetting && Boolean(productThc);
  const thcLabel = productThc ? thcBadgeLabel(productThc) : "";

  const imageBadges = badgePosition === "image" && (showStrainBadge || showThcBadge) && (
    <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col gap-1.5">
      {showStrainBadge && (
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${strainColor}`}>
          {product.strain}
        </span>
      )}
      {showThcBadge && product.thc && product.thc !== "—" && (
        <span className="inline-flex w-max items-center gap-1 rounded-full border border-border bg-black/70 px-2.5 py-1 text-[11px] font-bold text-foreground backdrop-blur-md">
          <Leaf className="w-3 h-3" /> {thcLabel}
        </span>
      )}
    </div>
  );

  const belowBadges = badgePosition === "below" && (showStrainBadge || showThcBadge) && (
    <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
      {showStrainBadge && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${strainColorSmall}`}>
          {product.strain}
        </span>
      )}
      {showThcBadge && product.thc && product.thc !== "—" && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <Leaf className="w-2.5 h-2.5" /> {thcLabel}
        </span>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.24) }}
      className={`group flex flex-col bg-card ${cardShape} overflow-hidden border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/5`}
    >
      <Link href={`/product/${product.id}`} className="block">
        <div
          className={`relative aspect-[4/3] overflow-hidden ${
            logoFallback ? "bg-white" : "bg-background/50"
          }`}
        >
          {showImageGradient && !logoFallback && (
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
          )}
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized={isStorageImageUrl(imageUrl)}
            className={`${productImageFitClass(product)} transition-transform duration-500 ease-out group-hover:scale-105`}
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
          {imageBadges}
          {showSaleBadge && savings > 0 && (
            <span className="absolute right-3 top-3 z-20 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground shadow-lg">
              Save ${savings}
            </span>
          )}
        </div>

        <div className="px-4 pt-4">
          {showCategory && (
            <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-accent">
              {product.category}
            </div>
          )}
          <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent">
            {displayName}
          </h3>
          {showDescription && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {cardDescription}
            </p>
          )}
        </div>
      </Link>

      {belowBadges}

      {showDealBanner && upsellDeal && (
        <div className={`mx-4 mb-3 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${upsellDeal.color}`}>
          <Tag className="w-3 h-3 shrink-0" />
          {upsellDeal.label}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-border/50 px-4 pb-4 pt-4">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Price</span>
          {showSaleBadge && product.salePrice ? (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-accent">${product.salePrice}</span>
              <span className="text-sm text-foreground/40 line-through">${product.price}</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-foreground">${product.price}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:bg-accent hover:text-accent-foreground"
          aria-label={`Add ${displayName} to bag`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

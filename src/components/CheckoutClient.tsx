"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { useCart } from "./CartContext";
import { useSettings } from "./SettingsProvider";
import {
  isProductLogoFallback,
  isStorageImageUrl,
  productImageFitClass,
  productImageUrl,
} from "@/lib/images";
import { generatePickupSlots } from "@/lib/pickup-slots";
import { computeBestDeal } from "@/lib/deal-engine";
import type { StoreHoursConfig } from "@/lib/types";
import { toast } from "sonner";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Valid phone number is required"),
  preferredPickupTime: z.string().min(1, "Please select a pickup time"),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface CheckoutClientProps {
  config: {
    ordersPaused: boolean;
    showNotes: boolean;
    showTerms: boolean;
    termsText: string;
    minOrder: number;
    tipEnabled: boolean;
    tipPresets: number[];
    cashOnlyNotice: string;
    compliantFooter: string;
  };
  schedule: StoreHoursConfig | undefined;
}

export function CheckoutClient({ config, schedule }: CheckoutClientProps) {
  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  const settings = useSettings();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [termsChecked, setTermsChecked] = useState(false);

  const slots = useMemo(() => generatePickupSlots(schedule), [schedule]);
  const enabledDeals = (settings.deal_rules ?? []).filter((d) => d.enabled);
  const bestDeal = computeBestDeal(enabledDeals, items, totalPrice);
  const discount = bestDeal?.discountAmount ?? 0;
  const finalTotal = Math.max(0, totalPrice - discount);
  const tipAmount = tipPercent != null ? (finalTotal * tipPercent) / 100 : 0;
  const orderTotal = finalTotal + tipAmount;
  const belowMinOrder =
    config.minOrder > 0 && finalTotal < config.minOrder;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      preferredPickupTime: slots[0]?.value ?? "",
    },
  });

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) return;
    if (belowMinOrder) {
      toast.error(`Minimum order is $${config.minOrder}`);
      return;
    }
    if (config.showTerms && !termsChecked) {
      toast.error("Please agree to the terms before placing your order.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Order failed");
      }
      const order = await res.json();
      clearCart();
      router.push(`/order/${order.id}`);
    } catch (err) {
      toast.error("Order failed", {
        description:
          err instanceof Error ? err.message : "Please try again.",
      });
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-6 border border-border/50">
          <Trash2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">
          Your bag is empty
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Looks like you haven&apos;t added any gifts to your bag yet. Browse
          our premium selection to get started.
        </p>
        <Link
          href="/shop"
          className="px-8 py-4 bg-accent text-accent-foreground font-bold rounded-full hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <>
      {config.ordersPaused && (
        <div className="bg-amber-500 text-white py-3 px-4 text-center text-sm font-semibold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          We are temporarily not accepting new orders. Please check back soon.
        </div>
      )}
      <section className="bg-card border-b border-border/50 pt-6 pb-6">
        <div className="container mx-auto px-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>
      </section>

      <section className="py-12 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-10">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Cart Items */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-4">
                Your Gifts ({totalItems})
              </h2>

              <div className="space-y-4">
                {items.map((item) => {
                  const imageUrl = productImageUrl({
                    imageUrl: item.imageUrl,
                    imageType: item.imageType,
                    brandLogoUrl: item.brandLogoUrl,
                  });
                  const imageInput = {
                    imageUrl: item.imageUrl,
                    imageType: item.imageType,
                    brandLogoUrl: item.brandLogoUrl,
                  };
                  return (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border/50"
                    >
                      <div
                        className={`relative w-16 h-16 shrink-0 overflow-hidden rounded-lg ${
                          isProductLogoFallback(imageInput)
                            ? "bg-white"
                            : "bg-background"
                        }`}
                      >
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          fill
                          sizes="64px"
                          unoptimized={isStorageImageUrl(imageUrl)}
                          className={productImageFitClass(imageInput, "p-2")}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          ${item.price} each
                        </p>
                      </div>
                      <div className="inline-flex items-center bg-background border border-border rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="w-9 h-9 flex items-center justify-center hover:bg-foreground/5"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="w-9 h-9 flex items-center justify-center hover:bg-foreground/5"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                {discount > 0 && bestDeal && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="inline-flex items-center gap-1.5 text-accent">
                      <Tag className="w-3.5 h-3.5" />
                      {bestDeal.name}
                    </span>
                    <span className="text-accent font-semibold">
                      −${discount.toFixed(2)}
                    </span>
                  </div>
                )}
                {discount > 0 && <div className="border-t border-border" />}
                <div className="flex justify-between items-center font-bold text-foreground">
                  <span className="text-lg">
                    Total{discount > 0 ? " After Discount" : ""}
                  </span>
                  <span className="text-3xl text-accent">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {config.cashOnlyNotice}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-5">
              <div className="bg-card rounded-3xl border border-border/50 p-6 md:p-8 lg:sticky lg:top-24 shadow-2xl">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Pickup Details
                </h2>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-4"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor="customerName"
                      className="block text-sm font-medium text-foreground/80 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="customerName"
                      autoComplete="name"
                      {...register("customerName")}
                      aria-invalid={!!errors.customerName}
                      className={`w-full bg-background border ${
                        errors.customerName
                          ? "border-destructive"
                          : "border-border"
                      } rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all`}
                      placeholder="John Doe"
                    />
                    {errors.customerName && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="customerEmail"
                      className="block text-sm font-medium text-foreground/80 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="customerEmail"
                      type="email"
                      autoComplete="email"
                      {...register("customerEmail")}
                      aria-invalid={!!errors.customerEmail}
                      className={`w-full bg-background border ${
                        errors.customerEmail
                          ? "border-destructive"
                          : "border-border"
                      } rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all`}
                      placeholder="john@example.com"
                    />
                    {errors.customerEmail && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.customerEmail.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="block text-sm font-medium text-foreground/80 mb-1.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      autoComplete="tel"
                      {...register("customerPhone")}
                      aria-invalid={!!errors.customerPhone}
                      className={`w-full bg-background border ${
                        errors.customerPhone
                          ? "border-destructive"
                          : "border-border"
                      } rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all`}
                      placeholder="(202) 555-0123"
                    />
                    {errors.customerPhone && (
                      <p className="text-destructive text-xs mt-1">
                        {errors.customerPhone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="preferredPickupTime"
                      className="block text-sm font-medium text-foreground/80 mb-1.5"
                    >
                      Preferred Pickup Time
                    </label>
                    <select
                      id="preferredPickupTime"
                      {...register("preferredPickupTime")}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    >
                      {slots.length === 0 ? (
                        <option value="">No pickup slots available</option>
                      ) : (
                        slots.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {config.showNotes && (
                    <div>
                      <label
                        htmlFor="notes"
                        className="block text-sm font-medium text-foreground/80 mb-1.5"
                      >
                        Order Notes (Optional)
                      </label>
                      <textarea
                        id="notes"
                        {...register("notes")}
                        rows={3}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none"
                        placeholder="Any special instructions..."
                      />
                    </div>
                  )}

                  {config.tipEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-2">
                        Add a Tip (Optional)
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {config.tipPresets.map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() =>
                              setTipPercent(tipPercent === pct ? null : pct)
                            }
                            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                              tipPercent === pct
                                ? "bg-accent text-accent-foreground border-accent"
                                : "border-border text-foreground/60 hover:border-accent/50"
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      {tipPercent !== null && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Tip: ${tipAmount.toFixed(2)} ({tipPercent}%)
                        </p>
                      )}
                    </div>
                  )}

                  {belowMinOrder && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Minimum order is ${config.minOrder}. Add $
                      {(config.minOrder - finalTotal).toFixed(2)} more.
                    </div>
                  )}

                  {config.showTerms && (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsChecked}
                        onChange={(e) => setTermsChecked(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-2 border-border accent-accent"
                      />
                      <span className="text-sm text-muted-foreground leading-snug">
                        {config.termsText}
                      </span>
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      config.ordersPaused ||
                      (config.showTerms && !termsChecked) ||
                      belowMinOrder ||
                      slots.length === 0
                    }
                    className="w-full py-4 mt-4 bg-accent text-accent-foreground font-bold text-lg rounded-xl hover:bg-accent/90 transition-all duration-300 shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    {config.ordersPaused
                      ? "Orders Currently Paused"
                      : `Place Pickup Order${
                          config.tipEnabled && tipPercent
                            ? ` — $${orderTotal.toFixed(2)}`
                            : ""
                        }`}
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    {config.compliantFooter}
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

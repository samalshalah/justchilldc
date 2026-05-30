import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Clock, ArrowRight } from "lucide-react";
import { getOrderById } from "@/lib/data";
import type { OrderItem } from "@/lib/schema/orderItems";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";
import { complianceFooterText } from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (!orderId || isNaN(orderId)) notFound();

  const [orderOrNull, settings] = await Promise.all([
    getOrderById(orderId),
    getSiteSettings(),
  ]);
  const order = orderOrNull ?? notFound();

  const storeName = settings.store?.name || DEFAULTS.storeName;
  const address = settings.location?.address;
  const city = settings.location?.city;
  const state = settings.location?.state;
  const phone =
    settings.location?.phone ||
    settings.contact?.phone ||
    settings.store?.phone;

  return (
    <section className="min-h-[80vh] py-16 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto bg-accent/20 rounded-full flex items-center justify-center mb-5">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground">
            Thanks {order.customerName.split(" ")[0]} — we&rsquo;re preparing
            your order for pickup.
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 mb-4 pb-4 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Confirmation
              </p>
              <p className="text-2xl font-bold text-accent font-mono">
                {order.confirmationCode}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Order #{order.id} ·{" "}
              {new Date(order.createdAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <h2 className="font-bold text-foreground mb-3">Items</h2>
          <ul className="space-y-2 mb-4">
            {order.items.map((item: OrderItem) => (
              <li
                key={item.id}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-foreground">
                  {item.quantity} × {item.productName}
                </span>
                <span className="text-muted-foreground">
                  ${item.pricePerItem * item.quantity}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-center pt-4 border-t border-border font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-2xl text-accent">${order.totalPrice}</span>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 mb-6 space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                Pickup Window
              </p>
              <p className="text-foreground font-medium">
                {order.preferredPickupTime}
              </p>
            </div>
          </div>
          {address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                  Pickup Location
                </p>
                <p className="text-foreground font-medium">{storeName}</p>
                <p className="text-sm text-muted-foreground">
                  {address}
                  {city && `, ${city}`}
                  {state && `, ${state}`}
                </p>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\D/g, "")}`}
                    className="text-sm text-accent hover:underline"
                  >
                    {phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-5 text-sm leading-relaxed mb-8">
          <p className="font-semibold mb-1">Before you arrive:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>Bring valid government-issued ID (must be 21+)</li>
            <li>{DEFAULTS.cashOnlyNotice}</li>
            <li>{complianceFooterText(settings)}</li>
          </ul>
        </div>

        <div className="text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-bold rounded-full hover:bg-accent/90 transition-colors"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

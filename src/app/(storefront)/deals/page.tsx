import type { Metadata } from "next";
import Link from "next/link";
import { Tag, ArrowRight } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const title = `Deals | ${storeName}`;
  return {
    title: { absolute: title },
    description: `Current deals, discounts, and special offers at ${storeName}.`,
    alternates: { canonical: "/deals" },
  };
}

export default async function DealsPage() {
  const settings = await getSiteSettings();
  const dealsPage = settings.deals ?? {};
  const dealRules = settings.deal_rules ?? [];
  const enabled = dealRules.filter((d) => d.enabled);

  const items = dealsPage.items ?? [];

  return (
    <>
      <section className="bg-card border-b border-border/50 pt-12 pb-10">
        <div className="container mx-auto px-4 text-center">
          <span className="text-accent font-bold tracking-widest uppercase text-xs">
            Limited Time
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2 mb-3">
            {dealsPage.title || "Current Deals"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {dealsPage.subtitle ||
              "Save more on your favorite products. Deals apply automatically at checkout."}
          </p>
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          {items.length === 0 && enabled.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                No active deals right now
              </h2>
              <p className="text-muted-foreground mb-6">
                Check back soon — we rotate offers weekly.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground font-bold rounded-full hover:bg-accent/90 transition-colors"
              >
                Browse menu <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="bg-card border border-border/50 rounded-3xl p-6 relative overflow-hidden hover:border-accent/50 transition-colors"
                >
                  {item.badge && (
                    <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold bg-accent text-accent-foreground">
                      {item.badge}
                    </span>
                  )}
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
              {enabled.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-card border border-accent/30 rounded-3xl p-6 relative overflow-hidden"
                >
                  <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold bg-accent text-accent-foreground">
                    Active
                  </span>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">
                    {rule.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {rule.type === "site_wide" &&
                      `${rule.discountValue}${
                        rule.discountType === "percent" ? "%" : "$"
                      } off everything`}
                    {rule.type === "spend_threshold" &&
                      `Spend $${rule.threshold} → ${rule.discountValue}% off`}
                    {rule.type === "bogo" &&
                      `Buy ${rule.buyQty}, get ${rule.getQty ?? 1} free`}
                    {rule.type === "quantity_break" &&
                      `Buy ${rule.minQty}+ → save ${rule.discountValue}%`}
                    {rule.type === "day_of_week" && `Special on select days`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

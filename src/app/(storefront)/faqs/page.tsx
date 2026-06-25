import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { FaqJsonLd, FaqSection } from "@/components/FaqJsonLd";
import { DEFAULTS } from "@/lib/defaults";
import { openGraphImages } from "@/lib/metadata-images";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const state = settings.location?.state || DEFAULTS.state;
  const configuredTitle = settings.faqs?.title?.trim();
  const configuredDescription = settings.faqs?.subtitle?.trim();
  const title = configuredTitle || "Cannabis FAQs";
  const description = configuredDescription && configuredDescription.length >= 120
    ? configuredDescription
    : `Answers about ${storeName} pickup, ordering, products, ID requirements, hours, and visiting our ${city}, ${state} cannabis store.`;
  const fullTitle = title.toLowerCase().includes(storeName.toLowerCase())
    ? `${title} | Cannabis Pickup in ${city}, ${state}`
    : `${title} | ${storeName}`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: "/faqs" },
    openGraph: { title: fullTitle, description, url: "/faqs", images: openGraphImages(settings) },
  };
}

export default async function FaqsPage() {
  const settings = await getSiteSettings();
  const faqs = settings.faqs ?? {};
  const items = (faqs.items ?? [])
    .filter((item) => item.published !== false && item.question && item.answer)
    .map((item) => ({ question: item.question, answer: item.answer }));

  return (
    <>
      <FaqJsonLd items={items} />
      <section className="bg-card border-b border-border/50 pt-12 pb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
            {faqs.title || "Cannabis FAQs"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {faqs.subtitle ||
              "Answers to common ordering, pickup, product, and policy questions."}
          </p>
        </div>
      </section>
      {items.length > 0 ? (
        <FaqSection items={items} />
      ) : (
        <section className="py-14 bg-background">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            FAQs are coming soon.
          </div>
        </section>
      )}
    </>
  );
}

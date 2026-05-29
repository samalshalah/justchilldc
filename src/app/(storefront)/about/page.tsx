import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Users, Award, ArrowRight } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";
import { isStorageImageUrl } from "@/lib/images";
import { complianceModelName } from "@/lib/compliance";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.seo?.city || DEFAULTS.city;
  const title = `About ${storeName}`;
  return {
    title: { absolute: title },
    description: `Learn about ${storeName}, a locally curated retail experience in ${city}.`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const about = settings.about ?? {};
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;

  const headline = about.headline || "Cultivating a Better Local Retail Experience";
  const content =
    about.content ||
    `${storeName} was founded with one mission: to make local ordering feel simple, polished, and trustworthy in ${city}. We curate premium products, provide clear information, and operate under ${complianceModelName(settings)}.`;
  const mission =
    about.mission ||
    "To provide every customer with a reliable, welcoming, and well-informed shopping experience.";
  const vision =
    about.vision ||
    "A future where local retail feels modern, compliant, accessible, and beautifully presented.";

  const stats = about.stats ?? [
    { num: "5+", label: "Years Serving Locally" },
    { num: "10K+", label: "Happy Customers" },
    { num: "100+", label: "Curated Strains" },
    { num: "21+", label: "ID Required" },
  ];

  const highlights = about.highlights ?? [
    "Lab-tested products only",
    "Knowledgeable, friendly team",
    "Carefully curated rotating menu",
    "Built around local compliance",
  ];
  const storyImageUrl = about.imageUrl
    ? `/api/storage${about.imageUrl}`
    : "/images/store/store-interior-mural.webp";

  return (
    <>
      <section className="bg-card border-b border-border/50 pt-12 pb-10">
        <div className="container mx-auto px-4 text-center">
          <span className="text-accent font-bold tracking-widest uppercase text-xs">
            {about.subtitle || "Our Story"}
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2">
            {about.title || `About ${storeName}`}
          </h1>
        </div>
      </section>

      {(about.show_story ?? true) && (
        <section className="py-14 bg-background">
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={storyImageUrl}
                alt="Inside our store"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized={isStorageImageUrl(storyImageUrl)}
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                {headline}
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {content}
              </p>
              {(about.show_highlights ?? true) && highlights.length > 0 && (
                <ul className="mt-6 space-y-2">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground">
                      <Leaf className="w-4 h-4 text-accent shrink-0 mt-1" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {((about.show_mission ?? true) || (about.show_vision ?? true)) && (
        <section className="py-14 bg-card/30 border-y border-border/50">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6">
            {(about.show_mission ?? true) && (
              <div className="bg-card border border-border/50 rounded-2xl p-8">
                <Award className="w-8 h-8 text-accent mb-3" />
                <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                  Mission
                </h3>
                <p className="text-muted-foreground">{mission}</p>
              </div>
            )}
            {(about.show_vision ?? true) && (
              <div className="bg-card border border-border/50 rounded-2xl p-8">
                <Users className="w-8 h-8 text-accent mb-3" />
                <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                  Vision
                </h3>
                <p className="text-muted-foreground">{vision}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {(about.show_stats ?? true) && stats.length > 0 && (
        <section className="py-14 bg-background">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl md:text-5xl font-display font-bold text-accent mb-1">
                  {s.num}
                </p>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="py-14 bg-card/30 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Ready to explore?
          </h2>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-bold rounded-full hover:bg-accent/90 transition-colors"
          >
            Browse our menu <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

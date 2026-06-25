import type { Metadata } from "next";
import { ExternalLink, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { ContactForm } from "@/components/ContactForm";
import { DEFAULTS } from "@/lib/defaults";
import { openGraphImages } from "@/lib/metadata-images";

const JUST_CHILL_GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Just+Chill+DC+Licensed+Weed,+Cannabis,+and+THC+Dispensary/data=!4m2!3m1!1s0x0:0x880f94af6b578e6b?sa=X&ved=1t:2428&ictx=111";
const JUST_CHILL_MAP_QUERY =
  "Just Chill DC Licensed Weed, Cannabis, and THC Dispensary";
const JUST_CHILL_MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  JUST_CHILL_MAP_QUERY
)}&output=embed`;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const state = settings.location?.state || DEFAULTS.state;
  const title = `Contact ${storeName} | Cannabis Pickup in ${city}, ${state}`;
  const description = `Call or visit ${storeName} for cannabis pickup questions, hours, directions, and live menu help in ${city}, ${state}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/contact" },
    openGraph: { title, description, url: "/contact", images: openGraphImages(settings) },
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const c = settings.contact ?? {};
  const phone = c.phone || settings.location?.phone || settings.store?.phone;
  const email = c.email;
  const ig = c.instagram || settings.store?.instagram;
  const loc = settings.location ?? {};
  const hideAddress = settings.store?.display_hide_address ?? false;
  const address = loc.address || settings.store?.address;
  const mapEmbedUrl = loc.mapEmbedUrl || JUST_CHILL_MAP_EMBED_URL;
  const mapsUrl = JUST_CHILL_GOOGLE_MAPS_URL;

  return (
    <>
      <section className="bg-card border-b border-border/50 pt-12 pb-10">
        <div className="container mx-auto px-4 text-center">
          <span className="text-accent font-bold tracking-widest uppercase text-xs">
            Get In Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2">
            {settings.contact_page?.h1 || c.title || "Contact Us"}
          </h1>
          {(settings.contact_page?.subtitle || c.subtitle) && (
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              {settings.contact_page?.subtitle || c.subtitle}
            </p>
          )}
          {settings.contact_page?.intro && (
            <p className="text-foreground/80 mt-5 max-w-2xl mx-auto leading-relaxed">
              {settings.contact_page.intro}
            </p>
          )}
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">
              Reach Out Directly
            </h2>
            <ul className="space-y-4">
              {!hideAddress && address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Address
                    </p>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      {address}
                      {loc.city && (
                        <>
                          <br />
                          {loc.city}
                          {loc.state && `, ${loc.state}`} {loc.zip ?? ""}
                        </>
                      )}
                    </a>
                  </div>
                </li>
              )}
              {phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Phone
                    </p>
                    <a
                      href={`tel:${phone.replace(/\D/g, "")}`}
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      {phone}
                    </a>
                  </div>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Email
                    </p>
                    <a
                      href={`mailto:${email}`}
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                </li>
              )}
              {ig && (
                <li className="flex items-start gap-3">
                  <Instagram className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Instagram
                    </p>
                    <a
                      href={ig}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      {ig.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </div>
                </li>
              )}
            </ul>

            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
              <div className="flex flex-col gap-3 border-b border-border/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Find Us on Google Maps
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Open directions before visiting for pickup.
                  </p>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-accent/60 hover:text-accent"
                >
                  Directions
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <div className="h-[320px] bg-background md:h-[380px]">
                <iframe
                  src={mapEmbedUrl}
                  title="Just Chill DC Google Map"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              </div>
            </div>
          </div>

          {(settings.contact_page?.show_form ?? true) && (
            <ContactForm
              successMessage={
                settings.contact_page?.success_message ||
                "We'll get back to you within 24 hours."
              }
            />
          )}
        </div>
      </section>
    </>
  );
}

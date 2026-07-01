import type { Metadata } from "next";
import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";
import type { WeekDay } from "@/lib/types";

const JUST_CHILL_GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Just+Chill+DC+Licensed+Weed,+Cannabis,+and+THC+Dispensary/data=!4m2!3m1!1s0x0:0x880f94af6b578e6b?sa=X&ved=1t:2428&ictx=111";
const JUST_CHILL_MAP_QUERY =
  "Just Chill DC Licensed Weed, Cannabis, and THC Dispensary";
const JUST_CHILL_MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  JUST_CHILL_MAP_QUERY
)}&output=embed`;

const DAY_LABELS: Record<WeekDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};
const DAYS: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function fmt12(time: string): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === "00" ? `${h12}${suffix}` : `${h12}:${m}${suffix}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || DEFAULTS.city;
  const title = `Visit ${storeName}`;
  return {
    title: { absolute: title },
    description: `Find ${storeName} in ${city}. Hours, address, and contact.`,
    alternates: { canonical: "/location" },
  };
}

export default async function LocationPage() {
  const settings = await getSiteSettings();
  const loc = settings.location ?? {};
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const phone = loc.phone || settings.contact?.phone || settings.store?.phone;
  const email = settings.contact?.email;
  const hideAddress = settings.store?.display_hide_address ?? false;
  const address = loc.address || settings.store?.address;
  const mapEmbedUrl = loc.mapEmbedUrl || JUST_CHILL_MAP_EMBED_URL;
  const schedule = settings.store_hours?.schedule;
  const showHours = settings.location_page?.show_hours !== false;
  const showMap = settings.location_page?.show_map !== false;

  return (
    <>
      <section className="bg-card border-b border-border/50 pt-12 pb-10">
        <div className="container mx-auto px-4 text-center">
          <span className="text-accent font-bold tracking-widest uppercase text-xs">
            Visit Us
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2">
            {settings.location_page?.h1 ||
              loc.title ||
              `${storeName} — ${loc.city || DEFAULTS.city}`}
          </h1>
          {(settings.location_page?.subtitle || loc.subtitle) && (
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              {settings.location_page?.subtitle || loc.subtitle}
            </p>
          )}
          {settings.location_page?.intro && (
            <p className="text-foreground/80 mt-5 max-w-2xl mx-auto leading-relaxed">
              {settings.location_page.intro}
            </p>
          )}
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            {!hideAddress && address && (
              <div className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Address
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {address}
                  {loc.city && (
                    <>
                      <br />
                      {loc.city}
                      {loc.state && `, ${loc.state}`} {loc.zip ?? ""}
                    </>
                  )}
                </p>
              </div>
            )}

            {phone && (
              <div className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Phone
                  </h2>
                </div>
                <a
                  href={`tel:${phone.replace(/\D/g, "")}`}
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  {phone}
                </a>
              </div>
            )}

            {email && (
              <div className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Email
                  </h2>
                </div>
                <a
                  href={`mailto:${email}`}
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  {email}
                </a>
              </div>
            )}

            {showHours && schedule && (
              <div className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Hours
                  </h2>
                </div>
                <ul className="space-y-1.5">
                  {DAYS.map((day) => {
                    const d = schedule[day];
                    return (
                      <li
                        key={day}
                        className="flex justify-between text-sm border-b border-border/30 pb-1.5 last:border-0"
                      >
                        <span className="font-medium text-foreground">
                          {DAY_LABELS[day]}
                        </span>
                        <span className="text-muted-foreground">
                          {d?.enabled
                            ? `${fmt12(d.open)}–${fmt12(d.close)}`
                            : "Closed"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {showMap && (
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
                  href={JUST_CHILL_GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-accent/60 hover:text-accent"
                >
                  Directions
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <div className="h-[360px] bg-background lg:h-full lg:min-h-[520px]">
                <iframe
                  src={mapEmbedUrl}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${storeName} Google Map`}
                  className="h-full w-full border-0"
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";
import type { WeekDay } from "@/lib/types";

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
            {!hideAddress && loc.address && (
              <div className="bg-card border border-border/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-display font-bold text-foreground">
                    Address
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {loc.address}
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

          {showMap && loc.mapEmbedUrl && (
            <div className="aspect-square lg:aspect-auto rounded-2xl overflow-hidden border border-border/50">
              <iframe
                src={loc.mapEmbedUrl}
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${storeName} location`}
                className="w-full h-full"
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

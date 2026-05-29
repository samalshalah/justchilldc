"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Leaf,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
import { useSettings } from "./SettingsProvider";
import { DEFAULTS } from "@/lib/defaults";
import { isStorageImageUrl } from "@/lib/images";
import type { WeekDay } from "@/lib/types";

const DAY_LABELS: Record<WeekDay, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
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

export function Footer() {
  const settings = useSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const isLightTheme = (settings.theme_config?.mode ?? "dark") === "light";
  const logoSrc = isLightTheme
    ? settings.store?.logo_dark || settings.store?.logo_light
    : settings.store?.logo_light;
  const logoImageUrl = logoSrc ? `/api/storage${logoSrc}` : null;

  const address = settings.location?.address || settings.store?.address;
  const city = settings.location?.city;
  const state = settings.location?.state;
  const zip = settings.location?.zip;
  const phone =
    settings.location?.phone ||
    settings.contact?.phone ||
    settings.store?.phone;
  const email =
    settings.contact?.email || settings.store?.order_confirmation_email;
  const instagram = settings.store?.instagram;
  const twitter = settings.store?.twitter;
  const facebook = settings.store?.facebook;
  const footerDesc =
    settings.store?.footer_text ||
    `${DEFAULTS.city}'s curated local retail experience.`;

  const fc = settings.footer_config;
  const hideAddress = settings.store?.display_hide_address ?? false;
  const showQuickLinks = fc?.show_quick_links ?? true;
  const showContact = (fc?.show_contact ?? true) && !hideAddress;
  const showSocial = fc?.show_social ?? true;
  const showDisclaimer = fc?.show_disclaimer ?? true;

  const storeHours = settings.store_hours;
  const showHours = storeHours?.show_on_website ?? true;
  const schedule = storeHours?.schedule;

  const year = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 text-foreground font-display font-bold text-xl mb-4"
            >
              {logoSrc ? (
                <Image
                  src={logoImageUrl!}
                  alt={storeName}
                  width={32}
                  height={32}
                  unoptimized={isStorageImageUrl(logoImageUrl)}
                  className="object-contain"
                />
              ) : (
                <Leaf className="w-6 h-6 text-accent" aria-hidden="true" />
              )}
              <span>{storeName}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {footerDesc}
            </p>
            {showSocial && (
              <div className="flex gap-3 mt-4">
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {twitter && (
                  <a
                    href={twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                    className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-foreground/60 hover:text-accent hover:border-accent transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick links */}
          {showQuickLinks && (
            <div>
              <h3 className="font-display font-bold text-foreground mb-4">
                Explore
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/shop"
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    Shop
                  </Link>
                </li>
                <li>
                  <Link
                    href="/deals"
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    Deals
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/location"
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    Location
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faqs"
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Contact */}
          {showContact && (
            <div>
              <h3 className="font-display font-bold text-foreground mb-4">
                Visit Us
              </h3>
              <ul className="space-y-3 text-sm">
                {address && (
                  <li className="flex gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
                    <span>
                      {address}
                      {city && (
                        <>
                          <br />
                          {city}
                          {state && `, ${state}`} {zip ?? ""}
                        </>
                      )}
                    </span>
                  </li>
                )}
                {phone && (
                  <li>
                    <a
                      href={`tel:${phone.replace(/\D/g, "")}`}
                      className="flex gap-2 text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Phone className="w-4 h-4 shrink-0 text-accent" />
                      {phone}
                    </a>
                  </li>
                )}
                {email && (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="flex gap-2 text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Mail className="w-4 h-4 shrink-0 text-accent" />
                      {email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Hours */}
          {showHours && schedule && (
            <div>
              <h3 className="font-display font-bold text-foreground mb-4">
                Hours
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {DAYS.map((day) => {
                  const d = schedule[day];
                  return (
                    <li key={day} className="flex justify-between">
                      <span className="font-medium text-foreground/80">
                        {DAY_LABELS[day]}
                      </span>
                      <span>
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
          <Link
            href="/admin/login"
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            Admin
          </Link>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p suppressHydrationWarning>
            © {year} {storeName}. All rights reserved.
          </p>
          {showDisclaimer && (
            <p className="text-center md:text-right">
              {DEFAULTS.checkoutFooter} · For adults 21+ only
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

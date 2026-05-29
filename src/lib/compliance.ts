import { DEFAULTS } from "./defaults";
import type { SiteSettings } from "./types";

export function compliancePlace(settings: SiteSettings): string {
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const state = settings.location?.state || DEFAULTS.state;
  if (city === DEFAULTS.city && state === DEFAULTS.state) return "local";
  return state ? `${city}, ${state}` : city;
}

export function complianceModelName(settings: SiteSettings): string {
  return `${compliancePlace(settings)} cannabis compliance requirements`;
}

export function complianceFooterText(settings: SiteSettings): string {
  return `Compliant with ${complianceModelName(settings)}`;
}

export function checkoutTermsText(settings: SiteSettings): string {
  const storeName = settings.store?.name || DEFAULTS.storeName;
  return `I confirm I am 21+ years of age and agree to follow ${storeName} pickup rules and ${complianceModelName(settings)}.`;
}

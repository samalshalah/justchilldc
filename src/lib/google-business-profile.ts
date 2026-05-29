import "server-only";
import type { SiteSettings } from "./types";

export const GOOGLE_BP_SCOPE = "https://www.googleapis.com/auth/business.manage";
export const GOOGLE_BP_ACCESS_COOKIE = "jc_google_bp_access";
export const GOOGLE_BP_STATE_COOKIE = "jc_google_bp_state";
export const GOOGLE_BP_ACCESS_MAX_AGE_SEC = 55 * 60;

export interface GoogleBusinessAccount {
  name: string;
  accountName?: string;
  type?: string;
}

export interface GoogleBusinessAddress {
  addressLines?: string[];
  locality?: string;
  administrativeArea?: string;
  postalCode?: string;
  regionCode?: string;
}

export interface GoogleBusinessLocation {
  name: string;
  title?: string;
  storefrontAddress?: GoogleBusinessAddress;
  phoneNumbers?: {
    primaryPhone?: string;
  };
  websiteUri?: string;
  regularHours?: {
    periods?: {
      openDay?: string;
      closeDay?: string;
      openTime?: { hours?: number; minutes?: number };
      closeTime?: { hours?: number; minutes?: number };
    }[];
  };
  profile?: {
    description?: string;
  };
  metadata?: {
    placeId?: string;
    mapsUri?: string;
  };
}

export interface GoogleBusinessLocationSummary {
  accountName: string;
  accountTitle: string;
  locationName: string;
  title: string;
  address: string;
  phone: string;
  website: string;
  placeId: string;
}

export interface GoogleBusinessLocationListResult {
  locations: GoogleBusinessLocationSummary[];
  warnings: string[];
  accountCount: number;
}

export class GoogleBusinessProfileError extends Error {
  status: number;
  detail: string;

  constructor(input: { status: number; message: string; detail: string }) {
    super(input.message);
    this.name = "GoogleBusinessProfileError";
    this.status = input.status;
    this.detail = input.detail;
  }
}

export function hasGoogleBusinessProfileCredentials(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleRedirectUri(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configuredSite) {
    return `${configuredSite}/api/admin/google/business-profile/callback`;
  }
  return new URL("/api/admin/google/business-profile/callback", req.url).toString();
}

async function googleFetch<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Google request failed (${res.status})`;
    try {
      const data = JSON.parse(text) as {
        error?: { message?: string; status?: string };
      };
      if (data.error?.message) message = data.error.message;
    } catch {
      // Keep the generic message if Google did not return JSON.
    }

    throw new GoogleBusinessProfileError({
      status: res.status,
      message,
      detail: text.slice(0, 800),
    });
  }

  return (await res.json()) as T;
}

export async function exchangeGoogleCode(input: {
  code: string;
  redirectUri: string;
}): Promise<{ access_token: string; expires_in?: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google OAuth failed");
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}

export async function fetchGoogleBusinessLocations(
  accessToken: string
): Promise<GoogleBusinessLocationListResult> {
  const accountData = await googleFetch<{ accounts?: GoogleBusinessAccount[] }>(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    accessToken
  );

  const accounts = accountData.accounts ?? [];
  const readMask = [
    "name",
    "title",
    "storefrontAddress",
    "phoneNumbers",
    "websiteUri",
    "metadata",
  ].join(",");

  const allLocations: GoogleBusinessLocationSummary[] = [];
  const warnings: string[] = [];

  for (const account of accounts) {
    let locationData: { locations?: GoogleBusinessLocation[] };
    try {
      locationData = await googleFetch<{ locations?: GoogleBusinessLocation[] }>(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=${encodeURIComponent(readMask)}&pageSize=100`,
        accessToken
      );
    } catch (err) {
      const label = account.accountName || account.name;
      if (err instanceof GoogleBusinessProfileError) {
        warnings.push(`${label}: ${err.message}`);
      } else {
        warnings.push(`${label}: Could not read locations`);
      }
      continue;
    }

    for (const location of locationData.locations ?? []) {
      allLocations.push({
        accountName: account.name,
        accountTitle: account.accountName || account.name,
        locationName: location.name,
        title: location.title || "Untitled location",
        address: formatGoogleAddress(location.storefrontAddress),
        phone: location.phoneNumbers?.primaryPhone ?? "",
        website: location.websiteUri ?? "",
        placeId: location.metadata?.placeId ?? "",
      });
    }
  }

  return {
    locations: allLocations,
    warnings,
    accountCount: accounts.length,
  };
}

export async function fetchGoogleBusinessLocation(
  accessToken: string,
  locationName: string
): Promise<GoogleBusinessLocation> {
  const readMask = [
    "name",
    "title",
    "storefrontAddress",
    "phoneNumbers",
    "websiteUri",
    "regularHours",
    "profile",
    "metadata",
  ].join(",");

  return googleFetch<GoogleBusinessLocation>(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=${encodeURIComponent(readMask)}`,
    accessToken
  );
}

export function formatGoogleAddress(address?: GoogleBusinessAddress): string {
  if (!address) return "";
  const street = (address.addressLines ?? []).filter(Boolean).join(", ");
  const cityLine = [
    address.locality,
    address.administrativeArea,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(" ");
  return [street, cityLine].filter(Boolean).join(", ");
}

export function mapGoogleLocationToSettings(input: {
  accountName: string;
  location: GoogleBusinessLocation;
  existing: SiteSettings;
}): Pick<SiteSettings, "store" | "location" | "contact" | "seo" | "integrations"> {
  const address = input.location.storefrontAddress;
  const title = input.location.title ?? input.existing.store?.name ?? "";
  const phone = input.location.phoneNumbers?.primaryPhone ?? input.existing.store?.phone ?? "";
  const fullAddress = formatGoogleAddress(address);
  const city = address?.locality ?? input.existing.location?.city ?? input.existing.seo?.city ?? "";
  const state = address?.administrativeArea ?? input.existing.location?.state ?? "";
  const zip = address?.postalCode ?? input.existing.location?.zip ?? "";
  const website = input.location.websiteUri ?? input.existing.store?.website ?? "";
  const description = input.location.profile?.description?.trim();

  return {
    store: {
      ...(input.existing.store ?? {}),
      name: title,
      address: fullAddress,
      phone,
      website,
      footer_text:
        description ||
        input.existing.store?.footer_text ||
        `${title} serves ${city || "the local area"} with a live menu and simple pickup information.`,
    },
    location: {
      ...(input.existing.location ?? {}),
      title: `${title} Location`,
      subtitle: city ? `Visit ${title} in ${city}.` : `Visit ${title}.`,
      address: fullAddress,
      city,
      state,
      zip,
      phone,
      hours: formatGoogleHours(input.location),
    },
    contact: {
      ...(input.existing.contact ?? {}),
      title: `Contact ${title}`,
      phone,
    },
    seo: {
      ...(input.existing.seo ?? {}),
      city,
      canonical_domain:
        input.existing.seo?.canonical_domain ||
        input.existing.store?.custom_domain ||
        "",
      page_home: {
        ...(input.existing.seo?.page_home ?? {}),
        title:
          input.existing.seo?.page_home?.title ||
          `${title} | Cannabis Menu in ${[city, state].filter(Boolean).join(", ")}`,
      },
      page_shop: {
        ...(input.existing.seo?.page_shop ?? {}),
        title:
          input.existing.seo?.page_shop?.title ||
          `Shop Cannabis in ${[city, state].filter(Boolean).join(", ")} | ${title}`,
      },
    },
    integrations: {
      ...(input.existing.integrations ?? {}),
      google_business_profile_enabled: true,
      google_business_profile_account_name: input.accountName,
      google_business_profile_location_name: input.location.name,
      google_business_profile_location_title: title,
      google_business_profile_place_id: input.location.metadata?.placeId ?? "",
      google_business_profile_last_imported_at: new Date().toISOString(),
    },
  };
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

function formatGoogleHours(location: GoogleBusinessLocation) {
  const periods = location.regularHours?.periods ?? [];
  if (periods.length === 0) return undefined;

  return periods
    .map((period) => {
      const day = DAY_LABELS[period.openDay ?? ""] ?? period.openDay ?? "";
      const open = formatGoogleTime(period.openTime);
      const close = formatGoogleTime(period.closeTime);
      return {
        day,
        hours: open && close ? `${open} - ${close}` : "",
      };
    })
    .filter((item) => item.day && item.hours);
}

function formatGoogleTime(time?: { hours?: number; minutes?: number }): string {
  if (!time || typeof time.hours !== "number") return "";
  const hour24 = time.hours;
  const minute = time.minutes ?? 0;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

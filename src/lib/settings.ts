/**
 * settings.ts — server-side site settings loader.
 *
 * The legacy app loaded settings client-side after mount, causing a flash of
 * unthemed content on every page load and an extra HTTP round-trip. Here we
 * load them in the root layout (Server Component), apply theme CSS vars
 * inline before paint, and pass the typed object down through React Context.
 *
 * Cache: a process-wide in-memory cache with a 60-second TTL. Admin saves
 * call invalidateSettings() to bust it explicitly. We deliberately don't
 * use Next's `unstable_cache` here because it complicates the
 * "admin saves, sees change immediately" UX.
 */

import "server-only";
import { db } from "./db";
import { siteSettingsTable } from "./schema/siteSettings";
import type { SiteSettings } from "./types";
import { isLocalPreviewMode } from "./preview";
import { getPreviewSettings } from "./preview-data";

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  data: SiteSettings;
  expiresAt: number;
}

declare global {
   
  var __jc_settingsCache: CacheEntry | undefined;
}

function readCache(): SiteSettings | null {
  const entry = globalThis.__jc_settingsCache;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry.data;
}

function writeCache(data: SiteSettings) {
  globalThis.__jc_settingsCache = {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}

export function invalidateSettings() {
  globalThis.__jc_settingsCache = undefined;
}

/**
 * Read every row from site_settings and assemble the typed SiteSettings object.
 * Each row is `{ key, value }` where value is JSON-encoded.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const cached = readCache();
  if (cached) return cached;
  if (isLocalPreviewMode()) return getPreviewSettings();

  let rows: { key: string; value: string }[] = [];
  try {
    rows = await db
      .select({ key: siteSettingsTable.key, value: siteSettingsTable.value })
      .from(siteSettingsTable);
  } catch (err) {
    // If the table doesn't exist yet (fresh DB before db:push), don't crash —
    // return empty settings so defaults take over.
    console.error("[settings] failed to read site_settings:", err);
    return {};
  }

  const result: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      // tolerant: store the raw string if it isn't JSON
      result[row.key] = row.value;
    }
  }

  const typed = result as SiteSettings;
  writeCache(typed);
  return typed;
}

/**
 * Read a single setting key. Used by admin pages that only edit one slice.
 */
export async function getSetting<K extends keyof SiteSettings>(
  key: K
): Promise<SiteSettings[K] | undefined> {
  const all = await getSiteSettings();
  return all[key];
}

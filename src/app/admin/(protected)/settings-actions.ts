"use server";

import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { revalidatePath } from "next/cache";
import type { SiteSettings } from "@/lib/types";
import { isLocalPreviewMode } from "@/lib/preview";
import { setPreviewSettingSlice } from "@/lib/preview-data";

const COOKIE_NAME = "jc_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function hmacHex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

async function assertAdmin() {
  const c = await cookies();
  const cookie = c.get(COOKIE_NAME);
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD not configured");
  if (!cookie?.value) throw new Error("Not authenticated");
  const [issuedAtStr, sig] = cookie.value.split(".");
  if (!issuedAtStr || !sig) throw new Error("Bad session");
  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) throw new Error("Bad session");
  const ageSec = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSec < 0 || ageSec > SESSION_MAX_AGE_SEC) throw new Error("Expired");
  if (hmacHex(secret, issuedAtStr) !== sig) throw new Error("Bad sig");
}

function invalidateLocalSettingsCache() {
  (
    globalThis as typeof globalThis & { __jc_settingsCache?: unknown }
  ).__jc_settingsCache = undefined;
}

export async function saveSettingSlice<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<{ ok: true }> {
  await assertAdmin();

  if (isLocalPreviewMode()) {
    setPreviewSettingSlice(key, value);
    invalidateLocalSettingsCache();
    revalidatePath("/", "layout");
    return { ok: true };
  }

  const [
    { db, siteSettingsTable },
    { invalidateSettings },
  ] = await Promise.all([import("@/lib/db"), import("@/lib/settings")]);

  const json = JSON.stringify(value);
  await db
    .insert(siteSettingsTable)
    .values({ key: key as string, value: json })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value: json, updatedAt: new Date() },
    });

  invalidateSettings();
  revalidatePath("/", "layout");
  return { ok: true };
}

import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, siteSettingsTable } from "./db";
import { invalidateSettings } from "./settings";
import type { SiteSettings } from "./types";

export async function writeSettingSlice<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<void> {
  const json = JSON.stringify(value);
  const settingKey = key as string;

  const existing = await db
    .select({ key: siteSettingsTable.key })
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, settingKey))
    .limit(1);

  if (existing.length > 0) {
    await db.execute(sql`
      UPDATE site_settings
      SET value = ${json}
      WHERE key = ${settingKey}
    `);
  } else {
    await db.execute(sql`
      INSERT INTO site_settings (key, value)
      VALUES (${settingKey}, ${json})
    `);
  }

  invalidateSettings();
}

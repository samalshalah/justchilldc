import type { SiteSettings } from "@/lib/types";

export async function saveSettingSlice<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<{ ok: true }> {
  const res = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Save failed (HTTP ${res.status})`);
  }
  return { ok: true };
}

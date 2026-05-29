import type { DealRule } from "./types";

/**
 * Returns true if the deal is enabled AND within its optional date window.
 * No date fields → always active as long as `deal.enabled === true`.
 */
export function isDealActive(deal: DealRule): boolean {
  if (!deal.enabled) return false;

  const today = new Date();
  // Strip time — compare date strings only (YYYY-MM-DD)
  const todayStr = today.toISOString().slice(0, 10);

  if (deal.startDate && todayStr < deal.startDate) return false;
  if (deal.endDate && todayStr > deal.endDate) return false;

  return true;
}

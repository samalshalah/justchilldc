/**
 * pickup-slots.ts — generate pickup time options dynamically from store hours.
 *
 * Fixes a real bug from the legacy app: it had hardcoded options like
 * "Today 12pm-2pm" that didn't respect store hours, didn't disable past
 * slots, and didn't honor temporarily_closed.
 */

import type { StoreHoursConfig, WeekDay, DaySchedule } from "./types";

const DAY_KEYS: WeekDay[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

interface Slot {
  value: string;
  label: string;
}

function fmt12(hour: number): string {
  const suffix = hour < 12 ? "am" : "pm";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}${suffix}`;
}

function parseHour(time: string): number {
  const [h] = time.split(":").map((x) => parseInt(x, 10));
  return isNaN(h) ? 0 : h;
}

/**
 * Generate up to ~8 pickup slots over today + tomorrow + next-open day.
 * Each slot is a 2-hour window. Slots in the past today are skipped.
 */
export function generatePickupSlots(
  hours: StoreHoursConfig | undefined
): Slot[] {
  const now = new Date();
  const slots: Slot[] = [];
  const schedule = hours?.schedule;

  if (hours?.temporarily_closed) return slots;

  for (let dayOffset = 0; dayOffset < 7 && slots.length < 8; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const dayKey = DAY_KEYS[d.getDay()];
    const day: DaySchedule | undefined = schedule?.[dayKey];

    if (!day?.enabled) continue;

    const openHour = parseHour(day.open);
    const closeHour = parseHour(day.close);
    const labelDay =
      dayOffset === 0
        ? "Today"
        : dayOffset === 1
        ? "Tomorrow"
        : d.toLocaleDateString("en-US", { weekday: "short" });

    for (let h = openHour; h + 2 <= closeHour; h += 2) {
      // Skip past slots today
      if (dayOffset === 0 && h <= now.getHours()) continue;
      const label = `${labelDay} ${fmt12(h)}–${fmt12(h + 2)}`;
      slots.push({ value: label, label });
      if (slots.length >= 8) break;
    }
  }

  // Fallback if no schedule configured
  if (slots.length === 0) {
    return [
      { value: "Today 12pm-2pm", label: "Today 12pm–2pm" },
      { value: "Today 2pm-4pm", label: "Today 2pm–4pm" },
      { value: "Today 4pm-6pm", label: "Today 4pm–6pm" },
      { value: "Tomorrow 12pm-2pm", label: "Tomorrow 12pm–2pm" },
      { value: "Tomorrow 2pm-4pm", label: "Tomorrow 2pm–4pm" },
    ];
  }

  return slots;
}

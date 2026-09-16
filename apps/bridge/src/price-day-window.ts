import type { PriceDay } from "./price-history-service.js";
const zone = "Europe/Brussels";
const parts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date).map(p => [p.type, Number(p.value)])) as Record<string, number>;
const shift = (date: Record<string, number>, days: number) => { const d = new Date(Date.UTC(date.year!, date.month! - 1, date.day! + days)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }; };
const midnight = (date: Record<string, number>) => {
  const target = Date.UTC(date.year!, date.month! - 1, date.day!); let result = target;
  for (let i = 0; i < 4; i += 1) { const seen = parts(new Date(result)); const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", hourCycle: "h23" }).format(new Date(result))); result -= Date.UTC(seen.year!, seen.month! - 1, seen.day!) + hour * 3_600_000 - target; }
  return new Date(result);
};
export const priceDayWindow = (day: PriceDay, now: Date) => {
  if (!Number.isFinite(now.getTime())) throw new Error("INVALID_PRICE_DAY");
  const today = parts(now); const offset = day === "yesterday" ? -1 : day === "tomorrow" ? 1 : 0;
  const start = midnight(shift(today, offset));
  const end = midnight(shift(today, offset + 1));
  return { start: start.toISOString(), end: end.toISOString() };
};

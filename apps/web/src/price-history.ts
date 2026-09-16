import type { DaySelection } from "./day-window";
export type PricePoint = { timestamp: string; priceCtKwh: number };
export type PriceHistoryData = { day: DaySelection; start: string; end: string; quality: "measured" | "incomplete" | "notPublished"; points: PricePoint[] };
export type PriceHistoryState = { status: "unavailable" | "loading" | "error" } | { status: "success"; data: PriceHistoryData; refreshError?: boolean };
const iso = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : undefined;
export const parsePriceHistoryResponse = (raw: unknown): PriceHistoryData | undefined => {
  if (!raw || typeof raw !== "object") return undefined; const value = raw as Record<string, unknown>;
  if (!["yesterday", "today", "tomorrow"].includes(String(value.day)) || !["measured", "incomplete", "notPublished"].includes(String(value.quality))) return undefined;
  const start = iso(value.start); const end = iso(value.end); if (!start || !end || Date.parse(end) < Date.parse(start) || !Array.isArray(value.points)) return undefined;
  const points: PricePoint[] = [];
  for (const rawPoint of value.points) { if (!rawPoint || typeof rawPoint !== "object") return undefined; const point = rawPoint as Record<string, unknown>; const timestamp = iso(point.timestamp); if (!timestamp || typeof point.priceCtKwh !== "number" || !Number.isFinite(point.priceCtKwh) || Date.parse(timestamp) < Date.parse(start) || Date.parse(timestamp) >= Date.parse(end)) return undefined; points.push({ timestamp, priceCtKwh: point.priceCtKwh }); }
  if (value.quality === "notPublished" && points.length) return undefined;
  return { day: value.day as DaySelection, start, end, quality: value.quality as PriceHistoryData["quality"], points: points.sort((a,b) => Date.parse(a.timestamp)-Date.parse(b.timestamp)) };
};
export const loadPriceHistory = async (day: DaySelection, signal: AbortSignal, request: typeof fetch = fetch) => {
  const response = await request(`/api/history/price?${new URLSearchParams({ day })}`, { method: "GET", signal });
  if (!response.ok) throw new Error("PRICE_REQUEST_FAILED"); const data = parsePriceHistoryResponse(await response.json());
  if (!data || data.day !== day) throw new Error("INVALID_PRICE_RESPONSE"); return data;
};

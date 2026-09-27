import type { DaySelection } from "./day-window";
export type PricePoint = { timestamp: string; priceCtKwh: number; end?: string };
export type PriceHistoryData = { day: DaySelection; start: string; end: string; source?: "Energy-Charts.info · Bundesnetzagentur | SMARD.de"; quality: "measured" | "incomplete" | "notPublished"; points: PricePoint[] };
export type PriceHistoryState = { status: "unavailable" | "loading" | "error" } | { status: "success"; data: PriceHistoryData; refreshError?: boolean };
const responseCacheMs = 60_000;
type CachedResponse = { expiresAt: number; data: PriceHistoryData };
const defaultNow = () => Date.now();
const brusselsDate = (instant: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
const iso = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : undefined;
export const parsePriceHistoryResponse = (raw: unknown): PriceHistoryData | undefined => {
  if (!raw || typeof raw !== "object") return undefined; const value = raw as Record<string, unknown>;
  if (!["yesterday", "today", "tomorrow"].includes(String(value.day)) || !["measured", "incomplete", "notPublished"].includes(String(value.quality))) return undefined;
  const start = iso(value.start); const end = iso(value.end); if (!start || !end || Date.parse(end) < Date.parse(start) || !Array.isArray(value.points)) return undefined;
  const points: PricePoint[] = [];
  for (const rawPoint of value.points) { if (!rawPoint || typeof rawPoint !== "object") return undefined; const point = rawPoint as Record<string, unknown>; const timestamp = iso(point.timestamp); if (!timestamp || typeof point.priceCtKwh !== "number" || !Number.isFinite(point.priceCtKwh) || Date.parse(timestamp) < Date.parse(start) || Date.parse(timestamp) >= Date.parse(end)) return undefined; const pointEnd = Object.hasOwn(point,"end") ? iso(point.end) : undefined; if (Object.hasOwn(point,"end") && (!pointEnd || Date.parse(pointEnd)<=Date.parse(timestamp) || Date.parse(pointEnd)>Date.parse(end))) return undefined; points.push({ timestamp, priceCtKwh: point.priceCtKwh, ...(pointEnd ? {end:pointEnd} : {}) }); }
  points.sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
  if(points.some((point,index)=>index>0 && (point.timestamp===points[index-1]!.timestamp || (points[index-1]!.end !== undefined && Date.parse(points[index-1]!.end!)>Date.parse(point.timestamp))))) return undefined;
  if (value.quality === "notPublished" && points.length) return undefined;
  if (value.source !== undefined && value.source !== "Energy-Charts.info · Bundesnetzagentur | SMARD.de") return undefined;
  return { day: value.day as DaySelection, start, end, ...(value.source ? { source: value.source as PriceHistoryData["source"] } : {}), quality: value.quality as PriceHistoryData["quality"], points: points.sort((a,b) => Date.parse(a.timestamp)-Date.parse(b.timestamp)) };
};
export const createPriceHistoryLoader = (clock: () => number = defaultNow) => {
  const responseCache = new Map<string, CachedResponse>();
  const inflight = new Map<string, Promise<PriceHistoryData>>();
  return async (day: DaySelection, signal: AbortSignal, request: typeof fetch = fetch): Promise<PriceHistoryData> => {
    if (signal.aborted) throw new DOMException("Request aborted", "AbortError");
    const key = `${brusselsDate(clock())}:${day}`;
    const cached = responseCache.get(key);
    if (cached && cached.expiresAt > clock()) return cached.data;
    responseCache.delete(key);
    let pending = inflight.get(key);
    if (!pending) {
      pending = (async () => {
        const response = await request(`api/history/price?${new URLSearchParams({ day })}`, { method: "GET", signal: new AbortController().signal });
        if (!response.ok) throw new Error("PRICE_REQUEST_FAILED");
        const data = parsePriceHistoryResponse(await response.json());
        if (!data || data.day !== day) throw new Error("INVALID_PRICE_RESPONSE");
        responseCache.set(key, { data, expiresAt: clock() + responseCacheMs });
        return data;
      })();
      inflight.set(key, pending);
      void pending.finally(() => { if (inflight.get(key) === pending) inflight.delete(key); }).catch(() => {});
    }
    return new Promise<PriceHistoryData>((resolve, reject) => {
      const abort = () => reject(new DOMException("Request aborted", "AbortError"));
      signal.addEventListener("abort", abort, { once: true });
      pending!.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
      if (signal.aborted) abort();
    });
  };
};

export const loadPriceHistory = createPriceHistoryLoader();

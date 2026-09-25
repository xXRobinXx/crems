import { priceDayWindow } from "./price-day-window.js";
import { PriceHistoryUpstreamError, type PriceDay, type PriceHistoryResponse } from "./price-history-service.js";

const endpoint = "https://api.energy-charts.info/v2/price";
const attribution = "Energy-Charts.info · Bundesnetzagentur | SMARD.de";
const cacheMs = 10 * 60_000;
type Point = { timestamp: string; priceCtKwh: number; end: string };

const localDay = (instant: string) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date(instant));
const record = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

export const parseDirectSpotPrices = (raw: unknown, start: string, end: string): { points: Point[]; intervalMs: number; invalid: boolean } => {
  const value = record(raw);
  if (!value || value.schema_version !== "2.0" || value.endpoint !== "price" || value.bidding_zone !== "BE" ||
    value.timezone !== "Europe/Brussels" || value.unit !== "EUR / MWh" ||
    typeof value.license !== "string" || !value.license.startsWith("CC BY 4.0") ||
    ![15, 60].includes(value.interval_minutes as number) || !Array.isArray(value.data) || value.data.length > 400) {
    throw new PriceHistoryUpstreamError();
  }
  const intervalMs = (value.interval_minutes as number) * 60_000;
  const from = Date.parse(start), until = Date.parse(end);
  if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from || until - from > 3 * 25 * 3_600_000) throw new PriceHistoryUpstreamError();
  const seen = new Set<number>();
  const points: Point[] = [];
  let invalid = false;
  for (const item of value.data) {
    const row = record(item), values = record(row?.values);
    const timestamp = row?.timestamp;
    const time = typeof timestamp === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) ? Date.parse(timestamp) : NaN;
    const price = values?.day_ahead_price;
    if (!Number.isFinite(time) || typeof price !== "number" || !Number.isFinite(price) ||
      time < from || time + intervalMs > until || seen.has(time)) { invalid = true; continue; }
    seen.add(time);
    points.push({ timestamp: new Date(time).toISOString(), priceCtKwh: price / 10, end: new Date(time + intervalMs).toISOString() });
  }
  points.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  return { points, intervalMs, invalid };
};

export const createDirectSpotPriceLoader = (request: typeof fetch = fetch) => {
  let cached: { key: string; until: number; value: Promise<ReturnType<typeof parseDirectSpotPrices>> } | undefined;
  return async (day: PriceDay, start: string, end: string, now: Date): Promise<PriceHistoryResponse> => {
    const yesterday = priceDayWindow("yesterday", now);
    const tomorrow = priceDayWindow("tomorrow", now);
    const key = localDay(yesterday.start);
    if (!cached || cached.key !== key || cached.until <= now.getTime()) {
      const url = new URL(endpoint);
      url.searchParams.set("bzn", "BE");
      url.searchParams.set("start", key);
      url.searchParams.set("end", localDay(tomorrow.start));
      const value = (async () => {
        const response = await request(url, { method: "GET", signal: AbortSignal.timeout(8_000) });
        if (!response.ok) throw new PriceHistoryUpstreamError();
        return parseDirectSpotPrices(await response.json(), yesterday.start, tomorrow.end);
      })();
      cached = { key, until: now.getTime() + cacheMs, value };
      void value.catch(() => { if (cached?.value === value) cached = undefined; });
    }
    try {
      const batch = await cached.value;
      const points = batch.points.filter(point => Date.parse(point.timestamp) >= Date.parse(start) && Date.parse(point.end) <= Date.parse(end));
      const complete = points.length * batch.intervalMs === Date.parse(end) - Date.parse(start) &&
        points[0]?.timestamp === start && points.at(-1)?.end === end &&
        points.every((point, index) => index === 0 || points[index - 1]!.end === point.timestamp);
      return { day, start, end, source: attribution, quality: day === "tomorrow" && points.length === 0 ? "notPublished" : complete && !batch.invalid ? "measured" : "incomplete", points };
    } catch { throw new PriceHistoryUpstreamError(); }
  };
};

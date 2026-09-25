import { HomeAssistantSource, PowerHistoryNotConfiguredError, type MeterSource } from "./meter-source.js";
import { InvalidPriceHistoryUnitError, normalizePriceHistory, normalizePriceHistoryIntervals, validatePriceHistoryUnit } from "./price-history.js";

export class PriceHistoryUnavailableError extends Error {}
export class PriceHistoryUpstreamError extends Error {}

export type PriceDay = "yesterday" | "today" | "tomorrow";
export interface PriceHistoryResponse {
  day: PriceDay; start: string; end: string;
  source?: string;
  quality: "measured" | "incomplete" | "notPublished";
  points: Array<{ timestamp: string; priceCtKwh: number; end?: string }>;
}

const unitOf = (state: { attributes: Record<string, unknown> }) => String(state.attributes.unit_of_measurement ?? "");

export const loadPriceHistory = async (source: MeterSource, day: PriceDay, start: string, end: string, now = Date.now()): Promise<PriceHistoryResponse> => {
  if (day === "today" && start === end) return { day, start, end, quality: "incomplete", points: [] };
  if (!(source instanceof HomeAssistantSource)) throw new PriceHistoryUnavailableError();
  try {
    const planner = day === "tomorrow" || Boolean(source.detectedEntities.tomorrowPrice);
    const state = await source.resolvePriceState(planner ? "tomorrow" : "current");
    const unit = unitOf(state);
    validatePriceHistoryUnit(unit);
    const raw = day === "today" ? state.attributes.raw_today : day === "tomorrow" ? state.attributes.raw_tomorrow : undefined;
    if (day === "tomorrow" || Array.isArray(raw)) {
      if (raw === undefined || (Array.isArray(raw) && raw.length === 0)) return { day, start, end, quality: "notPublished", points: [] };
      if (!Array.isArray(raw)) throw new PriceHistoryUpstreamError();
      const records = raw.map((item) => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) return item;
        const value = item as Record<string, unknown>;
        const state = typeof value.value === "number" && Number.isFinite(value.value)
          ? String(value.value)
          : value.value;
        return { state, last_changed: value.start };
      });
      const normalized = normalizePriceHistory({ records, unit, start, end });
      return { day, start, end, quality: normalized.invalidCount || normalized.outsideWindowCount || normalized.duplicateCount ? "incomplete" : "measured", points: normalized.points };
    }
    const historyEnd = new Date(Math.min(Date.parse(end), now)).toISOString();
    if (Date.parse(historyEnd) <= Date.parse(start)) return {day,start,end,quality:"incomplete",points:[]};
    const records = await source.history(state.entity_id, start, historyEnd);
    const normalized = normalizePriceHistoryIntervals({ records, unit, start, end: historyEnd });
    return { day, start, end, quality: normalized.invalidCount || normalized.outsideWindowCount || normalized.duplicateCount || normalized.points.length === 0 ? "incomplete" : "measured", points: normalized.points };
  } catch (error) {
    if (error instanceof PowerHistoryNotConfiguredError || error instanceof InvalidPriceHistoryUnitError) throw error;
    if (error instanceof PriceHistoryUpstreamError) throw error;
    throw new PriceHistoryUpstreamError();
  }
};

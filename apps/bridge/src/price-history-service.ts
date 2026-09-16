import { HomeAssistantSource, PowerHistoryNotConfiguredError, type MeterSource } from "./meter-source.js";
import { InvalidPriceHistoryUnitError, normalizePriceHistory, validatePriceHistoryUnit } from "./price-history.js";

export class PriceHistoryUnavailableError extends Error {}
export class PriceHistoryUpstreamError extends Error {}

export type PriceDay = "yesterday" | "today" | "tomorrow";
export interface PriceHistoryResponse {
  day: PriceDay; start: string; end: string;
  quality: "measured" | "incomplete" | "notPublished";
  points: Array<{ timestamp: string; priceCtKwh: number }>;
}

const unitOf = (state: { attributes: Record<string, unknown> }) => String(state.attributes.unit_of_measurement ?? "");

export const loadPriceHistory = async (source: MeterSource, day: PriceDay, start: string, end: string): Promise<PriceHistoryResponse> => {
  if (day === "today" && start === end) return { day, start, end, quality: "incomplete", points: [] };
  if (!(source instanceof HomeAssistantSource)) throw new PriceHistoryUnavailableError();
  try {
    const state = await source.resolvePriceState(day === "tomorrow" ? "tomorrow" : "current");
    const unit = unitOf(state);
    validatePriceHistoryUnit(unit);
    const raw = state.attributes[day === "today" ? "raw_today" : "raw_tomorrow"];
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
    const records = await source.history(state.entity_id, start, end);
    const normalized = normalizePriceHistory({ records, unit, start, end });
    return { day, start, end, quality: normalized.invalidCount || normalized.outsideWindowCount || normalized.duplicateCount || normalized.points.length === 0 ? "incomplete" : "measured", points: normalized.points };
  } catch (error) {
    if (error instanceof PowerHistoryNotConfiguredError || error instanceof InvalidPriceHistoryUnitError) throw error;
    if (error instanceof PriceHistoryUpstreamError) throw error;
    throw new PriceHistoryUpstreamError();
  }
};

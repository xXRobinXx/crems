export type BelpexPoint = Readonly<{ start: string; resolutionMinutes: 15 | 60; priceEurMwh: number }>;
export type BelpexHistory = Readonly<{ start: string; end: string; quality: "complete" | "incomplete"; source: string; unit: "EUR/MWh"; points: ReadonlyArray<BelpexPoint> }>;

const pointIsValid = (value: unknown): value is BelpexPoint => {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return typeof point.start === "string" && Number.isFinite(Date.parse(point.start)) && (point.resolutionMinutes === 15 || point.resolutionMinutes === 60) && typeof point.priceEurMwh === "number" && Number.isFinite(point.priceEurMwh);
};

export async function loadBelpexHistory(start: string, end: string, request: typeof fetch = fetch, signal?: AbortSignal): Promise<BelpexHistory | undefined> {
  try {
    const response = await request(`/api/history/belpex?${new URLSearchParams({ start, end })}`, { method: "GET",signal });
    if (!response.ok) return undefined;
    const value = await response.json() as Partial<BelpexHistory>;
    if (!value || value.quality !== "complete" || value.unit !== "EUR/MWh" || typeof value.source !== "string" || !Array.isArray(value.points) || !value.points.every(pointIsValid)) return undefined;
    return value as BelpexHistory;
  } catch { return undefined; }
}

export function createQuarterPriceLookup(history: BelpexHistory) {
  const prices = new Map<number, number>();
  for (const point of history.points) {
    const start = Date.parse(point.start);
    for (let offset = 0; offset < point.resolutionMinutes; offset += 15) prices.set(start + offset * 60_000, point.priceEurMwh);
  }
  return (start: string) => prices.get(Date.parse(start));
}

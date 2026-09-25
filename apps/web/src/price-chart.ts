import type { PriceHistoryData } from "./price-history";

// Starts are sensor updates, not source-confirmed interval ends. Require two
// supporting deltas and allow only five seconds of update jitter.
const JITTER_MS = 5_000;
export const priceIntervals = (data: PriceHistoryData, now = Date.now()) => {
  const times = data.points.map(point => Date.parse(point.timestamp));
  const gaps = times.slice(1).map((time, index) => time - times[index]!);
  const cadence = [900_000, 3_600_000].find(candidate => gaps.filter(gap => Math.abs(gap - candidate) <= JITTER_MS).length >= 2) ?? 0;
  const hasPublishedFuture = data.day === "today" && times.some(time => time > now);
  const limit = Math.min(Date.parse(data.end), data.day === "today" && !hasPublishedFuture ? now : Infinity);
  return data.points.map((point, index) => {
    const start = times[index]!, gap = gaps[index];
    if(point.end) return {...point,end:point.end,inferred:false};
    const adjacent = cadence > 0 && gap !== undefined && Math.abs(gap - cadence) <= JITTER_MS;
    const initialPartial = cadence > 0 && index === 0 && start === Date.parse(data.start) && gap !== undefined && gap > 0 && gap < cadence;
    const duration = adjacent || initialPartial ? gap! : cadence;
    // Unexpected short deltas have no proven duration; long gaps retain only
    // one inferred interval, followed by blank space.
    const known = cadence > 0 && (gap === undefined || adjacent || initialPartial || gap > cadence + JITTER_MS);
    const end = Math.max(start, Math.min(start + (known ? duration : 0), limit));
    return { ...point, end: new Date(end).toISOString(), inferred: known && end > start };
  });
};
export const spotPriceAt = (data: PriceHistoryData, instant: number, now = Date.now()): number | undefined => {
  const point = priceIntervals(data, now).find(item => Date.parse(item.timestamp) <= instant && instant < Date.parse(item.end));
  return point?.priceCtKwh;
};
export const scalePriceHistory = (data: PriceHistoryData, displayWindow: { start: string; end: string } = data, now = Date.now()) => {
  const values = data.points.map(point => point.priceCtKwh);
  const min = Math.min(0, ...values), max = Math.max(0, ...values), range = max === min ? 1 : max - min;
  const start = Date.parse(displayWindow.start), duration = Math.max(1, Date.parse(displayWindow.end) - start);
  const x = (timestamp: string) => (Date.parse(timestamp) - start) / duration * 870;
  const y = (value: number) => 210 - (value - min) / range * 190;
  const intervals = priceIntervals(data, now);
  const path = intervals.map((point,index) => {
    if (point.end === point.timestamp) return "";
    const previous = intervals[index - 1];
    const connected = previous && previous.end !== previous.timestamp && previous.end === point.timestamp;
    return `${connected ? "L" : "M"}${x(point.timestamp).toFixed(2)},${y(point.priceCtKwh).toFixed(2)} L${x(point.end).toFixed(2)},${y(point.priceCtKwh).toFixed(2)}`;
  }).filter(Boolean).join(" ");
  return { path, intervals, points: intervals.flatMap(point => point.end !== point.timestamp ? [] : [{ x: x(point.timestamp), y: y(point.priceCtKwh) }]), zeroY: y(0), min, max, lowest: values.length ? Math.min(...values) : undefined, highest: values.length ? Math.max(...values) : undefined };
};

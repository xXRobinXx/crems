export type ChartWindow = { start: string; end: string };
export const brusselsChartTime = (timestamp: string, offset = false) => new Date(timestamp).toLocaleTimeString("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit", ...(offset ? { timeZoneName: "shortOffset" as const } : {}) });
export const chartTimeTicks = (window: ChartWindow) => {
  const start = Date.parse(window.start), duration = Date.parse(window.end) - start;
  return [0, .25, .5, .75, 1].map(fraction => { const timestamp = new Date(start + duration * fraction).toISOString(); return { fraction, timestamp, label: brusselsChartTime(timestamp) }; });
};

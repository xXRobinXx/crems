import type { HistoryPoint, PowerHistoryData } from "./power-history";

export type ChartSeries = { importPaths: string[]; exportPaths: string[]; zeroY: number; min: number; max: number };
export type PowerAxisTick = { y: number; valueW: number; label: string };

const formatPower = (valueW: number) => {
  const absolute = Math.abs(valueW);
  const value = absolute >= 1_000
    ? `${(absolute / 1_000).toLocaleString("nl-BE", { maximumFractionDigits: 1 })} kW`
    : `${Math.round(absolute).toLocaleString("nl-BE")} W`;
  return valueW < 0 ? `−${value}` : value;
};

export const powerAxisTicks = ({ min, max }: Pick<ChartSeries, "min" | "max">): PowerAxisTick[] =>
  [20, 67.5, 115, 162.5, 210].map((y, index) => {
    const valueW = max - ((max - min) * index) / 4;
    return { y, valueW, label: formatPower(valueW) };
  });

const pathFor = (points: HistoryPoint[], start: number, duration: number, min: number, range: number) =>
  points.map((point, index) => {
    const x = ((Date.parse(point.timestamp) - start) / duration) * 870;
    const y = 210 - ((point.powerW - min) / range) * 190;
    if (index === 0) return `M${x.toFixed(2)},${y.toFixed(2)}`;
    const previous = points[index - 1]!;
    const previousY = 210 - ((previous.powerW - min) / range) * 190;
    return `L${x.toFixed(2)},${previousY.toFixed(2)} L${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

export const scalePowerHistory = (data: PowerHistoryData, displayWindow: { start: string; end: string } = data): ChartSeries => {
  const firstExport = data.export.findIndex((point) => point.powerW > 0);
  let lastExport = -1;
  for (let index = data.export.length - 1; index >= 0; index -= 1) {
    if (data.export[index]!.powerW > 0) { lastExport = index; break; }
  }
  const activeExport = firstExport < 0 ? [] : data.export.slice(firstExport, lastExport + 1);
  const visualExport = activeExport.map((point) => ({ ...point, powerW: -Math.abs(point.powerW) }));
  const values = [...data.import, ...visualExport].map((point) => point.powerW);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const scaleMin = max === min ? 0 : min;
  const scaleMax = max === min ? 1 : max;
  const range = scaleMax - scaleMin;
  const start = Date.parse(displayWindow.start);
  const duration = Math.max(1, Date.parse(displayWindow.end) - start);
  return {
    importPaths: data.import.length ? [pathFor(data.import, start, duration, scaleMin, range)] : [],
    exportPaths: visualExport.length ? [pathFor(visualExport, start, duration, scaleMin, range)] : [],
    zeroY: 210 - ((0 - scaleMin) / range) * 190,
    min: scaleMin,
    max: scaleMax,
  };
};

import type { PriceHistoryData } from "./price-history";
export const scalePriceHistory = (data: PriceHistoryData, displayWindow: { start: string; end: string } = data) => {
  const values = data.points.map(point => point.priceCtKwh); const min = Math.min(0, ...values); const max = Math.max(0, ...values); const range = max === min ? 1 : max-min; const start = Date.parse(displayWindow.start); const duration = Math.max(1, Date.parse(displayWindow.end)-start);
  const path = data.points.map((point,index) => { const x=((Date.parse(point.timestamp)-start)/duration)*870; const y=210-((point.priceCtKwh-min)/range)*190; if (!index) return `M${x.toFixed(2)},${y.toFixed(2)}`; const previous=data.points[index-1]!; const py=210-((previous.priceCtKwh-min)/range)*190; return `L${x.toFixed(2)},${py.toFixed(2)} L${x.toFixed(2)},${y.toFixed(2)}`; }).join(" ");
  return { path, zeroY: 210-((0-min)/range)*190, min, max };
};

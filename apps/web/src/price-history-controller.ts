import type { DaySelection } from "./day-window";
import type { PriceHistoryData, PriceHistoryState } from "./price-history";
type Timer = ReturnType<typeof setInterval>;
type Dependencies = { request: typeof fetch; load: (day: DaySelection, signal: AbortSignal, request: typeof fetch) => Promise<PriceHistoryData>; setInterval: (callback: () => void, ms: number) => Timer; clearInterval: (timer: Timer) => void };
export const createPriceHistoryController = (publish: (state: PriceHistoryState) => void, dependencies: Dependencies) => {
  let abort: AbortController | undefined; let timer: Timer | undefined; let sequence = 0; let key = ""; let last: PriceHistoryData | undefined; let enabled = false; let day: DaySelection = "today"; let visible = true;
  const clear = () => { sequence += 1; abort?.abort(); abort = undefined; if (timer !== undefined) dependencies.clearInterval(timer); timer = undefined; };
  const run = async (day: DaySelection, current: number, background = false) => { abort?.abort(); const own = new AbortController(); abort = own; if (!background) publish({ status: "loading" }); try { const data = await dependencies.load(day, own.signal, dependencies.request); if (current === sequence && !own.signal.aborted) { last = data; publish({ status: "success", data }); } } catch { if (current === sequence && !own.signal.aborted) publish(background && last ? { status: "success", data: last, refreshError: true } : { status: "error" }); } };
  const schedule = (current: number) => { if (!visible || day === "yesterday") return; timer = dependencies.setInterval(() => { void run(day, current, true); }, 10 * 60_000); };
  const update = (nextEnabled: boolean, nextDay: DaySelection) => { const next = `${nextEnabled}:${nextDay}`; if (next === key) return; key = next; clear(); last = undefined; enabled = nextEnabled; day = nextDay; if (!enabled) { publish({ status: "unavailable" }); return; } if (!visible) { publish({ status: "loading" }); return; } const current = sequence; void run(day, current); schedule(current); };
  const setVisibility = (nextVisible: boolean) => { if (visible === nextVisible) return; visible = nextVisible; if (!visible) { if (timer !== undefined) dependencies.clearInterval(timer); timer = undefined; return; } if (!enabled || day === "yesterday") return; const current = sequence; void run(day, current, Boolean(last)); schedule(current); };
  return { update, setVisibility, dispose: clear };
};

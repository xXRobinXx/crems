import type { DaySelection, DayWindowSelection } from "./day-window";
import type { PowerHistoryData, PowerHistoryState, PowerHistoryWindow } from "./power-history";

type Timer = ReturnType<typeof setInterval>;
type Dependencies = {
  now: () => Date;
  request: typeof fetch;
  setInterval: (callback: () => void, milliseconds: number) => Timer;
  clearInterval: (timer: Timer) => void;
  selectWindow: (selection: DaySelection, now: Date) => DayWindowSelection;
  load: (window: PowerHistoryWindow, signal: AbortSignal, request: typeof fetch) => Promise<PowerHistoryData>;
};

export const createPowerHistoryController = (
  publish: (state: PowerHistoryState) => void,
  dependencies: Dependencies,
) => {
  let abort: AbortController | undefined;
  let timer: Timer | undefined;
  let sequence = 0;
  let lastKey = "";
  let lastData: PowerHistoryData | undefined;

  const clear = () => {
    sequence += 1;
    abort?.abort();
    abort = undefined;
    if (timer !== undefined) dependencies.clearInterval(timer);
    timer = undefined;
  };

  const fetchSelection = async (selection: DaySelection, currentSequence: number, background = false) => {
    const selected = dependencies.selectWindow(selection, dependencies.now());
    if (selected.state === "future") { publish({ status: "future" }); return; }
    if (selected.state === "empty" || !selected.window) { publish({ status: "empty" }); return; }
    abort?.abort();
    abort = new AbortController();
    const requestAbort = abort;
    if (!background) publish({ status: "loading" });
    try {
      const data = await dependencies.load(selected.window, requestAbort.signal, dependencies.request);
      if (currentSequence === sequence && !requestAbort.signal.aborted) {
        lastData = data;
        publish({ status: "success", data });
      }
    } catch {
      if (currentSequence === sequence && !requestAbort.signal.aborted) {
        if (background && lastData) publish({ status: "success", data: lastData, refreshError: true });
        else publish({ status: "error" });
      }
    }
  };

  const update = (enabled: boolean, selection: DaySelection) => {
    const key = `${enabled}:${selection}`;
    if (key === lastKey) return;
    lastKey = key;
    clear();
    lastData = undefined;
    if (!enabled) { publish({ status: "unavailable" }); return; }
    const currentSequence = sequence;
    void fetchSelection(selection, currentSequence);
    if (selection === "today") {
      timer = dependencies.setInterval(() => { void fetchSelection(selection, currentSequence, true); }, 30_000);
    }
  };

  return { update, dispose: clear };
};

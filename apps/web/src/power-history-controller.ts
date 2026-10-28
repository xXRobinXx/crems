import type { DaySelection, DayWindowSelection } from "./day-window";
import type { PowerHistoryData, PowerHistoryState, PowerHistoryWindow } from "./power-history";

type Timer = ReturnType<typeof setInterval>;
type Dependencies = {
  now: () => Date;
  request: typeof fetch;
  setInterval: (callback: () => void, milliseconds: number) => Timer;
  clearInterval: (timer: Timer) => void;
  setTimeout?: (callback: () => void, milliseconds: number) => ReturnType<typeof setTimeout>;
  clearTimeout?: (timer: ReturnType<typeof setTimeout>) => void;
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
  let retries = 0;
  let pending = false;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const scheduleDeadline = dependencies.setTimeout ?? setTimeout;
  const cancelDeadline = dependencies.clearTimeout ?? clearTimeout;
  const stopTimer = () => {
    if (timer !== undefined) dependencies.clearInterval(timer);
    timer = undefined;
  };

  const clear = () => {
    sequence += 1;
    abort?.abort();
    abort = undefined;
    pending = false;
    if (deadline !== undefined) cancelDeadline(deadline);
    deadline = undefined;
    stopTimer();
  };

  const fetchSelection = async (selection: DaySelection, currentSequence: number, background = false) => {
    if (currentSequence !== sequence) return;
    const selected = dependencies.selectWindow(selection, dependencies.now());
    if (lastData && lastData.start !== selected.window?.start) {
      lastData = undefined;
      publish({ status: "loading" });
    }
    if (pending) return;
    if (selected.state === "future") { publish({ status: "future" }); return; }
    if (selected.state === "empty" || !selected.window) { publish({ status: "empty" }); return; }
    abort?.abort();
    abort = new AbortController();
    const requestAbort = abort;
    pending = true;
    if (!background) publish({ status: "loading" });
    let expired = false;
    let rollover = false;
    const failure = () => {
      if (currentSequence !== sequence) return;
      const current = dependencies.selectWindow(selection, dependencies.now());
      if (lastData?.start !== current.window?.start) lastData = undefined;
      if (background && lastData) publish({ status: "success", data: lastData, refreshError: true });
      else publish({ status: "error" });
      if (selection === "yesterday" && timer === undefined && retries < 3) {
        timer = dependencies.setInterval(() => {
          if (pending || currentSequence !== sequence) return;
          if (retries >= 3) { stopTimer(); return; }
          retries += 1;
          void fetchSelection(selection, currentSequence);
        }, 30_000);
      }
      if (selection === "yesterday" && retries >= 3) stopTimer();
    };
    deadline = scheduleDeadline(() => {
      if (currentSequence !== sequence || abort !== requestAbort) return;
      expired = true;
      pending = false;
      deadline = undefined;
      requestAbort.abort();
      failure();
    }, 10_000);
    try {
      const data = await dependencies.load(selected.window, requestAbort.signal, dependencies.request);
      if (data.start !== selected.window.start || data.end !== selected.window.end) throw new Error("HISTORY_WINDOW_MISMATCH");
      if (currentSequence === sequence && !requestAbort.signal.aborted) {
        const current = dependencies.selectWindow(selection, dependencies.now());
        if (selected.window.start !== current.window?.start) {
          lastData = undefined;
          publish({ status: current.state === "empty" ? "empty" : "loading" });
          rollover = current.state === "ready";
          return;
        }
        lastData = data;
        publish({ status: "success", data });
        if (selection === "yesterday") stopTimer();
      }
    } catch {
      if (currentSequence === sequence && !requestAbort.signal.aborted) {
        failure();
      }
    } finally {
      if (currentSequence === sequence && abort === requestAbort && !expired) {
        pending = false;
        if (deadline !== undefined) cancelDeadline(deadline);
        deadline = undefined;
        if (rollover) {
          retries = 0;
          void fetchSelection(selection, currentSequence);
        }
      }
    }
  };

  const update = (enabled: boolean, selection: DaySelection, retry = false) => {
    const key = `${enabled}:${selection}`;
    if (key === lastKey && !retry) return;
    lastKey = key;
    clear();
    lastData = undefined;
    retries = 0;
    if (!enabled) { publish({ status: "unavailable" }); return; }
    const currentSequence = sequence;
    void fetchSelection(selection, currentSequence);
    if (selection === "today") {
      timer = dependencies.setInterval(() => { void fetchSelection(selection, currentSequence, true); }, 30_000);
    }
  };

  const dispose = () => { clear(); lastKey = ""; lastData = undefined; };
  return { update, dispose };
};

import { useEffect, useMemo, useState } from "react";
import type { DaySelection } from "./day-window";
import { createPowerHistoryController } from "./power-history-controller";
import type { PowerHistoryState } from "./power-history";
import { loadPowerHistory } from "./power-history";
import { fullBrusselsDayWindow, selectBrusselsDayWindow } from "./day-window";

export const usePowerHistory = (enabled: boolean, selection: DaySelection) => {
  const [state, setState] = useState<PowerHistoryState>({ status: "unavailable" });
  const calendarDay = fullBrusselsDayWindow(selection, new Date()).start;
  const controller = useMemo(() => createPowerHistoryController(setState, {
    now: () => new Date(), request: fetch,
    setInterval: (callback, milliseconds) => window.setInterval(callback, milliseconds),
    clearInterval: (timer) => window.clearInterval(timer),
    selectWindow: selectBrusselsDayWindow,
    load: loadPowerHistory,
  }), []);

  useEffect(() => {
    controller.update(enabled, selection, true);
  }, [controller, enabled, selection, calendarDay]);
  useEffect(() => () => controller.dispose(), [controller]);

  return { ...state, retry: () => controller.update(enabled, selection, true) };
};

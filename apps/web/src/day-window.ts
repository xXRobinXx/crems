export type DaySelection = "yesterday" | "today" | "tomorrow";

export interface DayFetchWindow {
  start: string;
  end: string;
}

export interface DayDisplayWindow {
  start: string;
  end: string;
}

export interface DayWindowSelection {
  selection: DaySelection;
  label: "Gisteren" | "Vandaag" | "Morgen";
  dateLabel: string;
  state: "ready" | "empty" | "future";
  window: DayFetchWindow | null;
}

const TIME_ZONE = "Europe/Brussels";
const LIVE_HISTORY_CLOCK_SKEW_MS = 15_000;
const localDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const nlDateFormatter = new Intl.DateTimeFormat("nl-BE", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "2-digit",
});

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const localCalendarDate = (instant: Date): CalendarDate => {
  const parts = localDateFormatter.formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
};

const addCalendarDays = (date: CalendarDate, days: number): CalendarDate => {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
};

const localMidnight = (date: CalendarDate): Date => {
  const target = Date.UTC(date.year, date.month - 1, date.day);
  let instant = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = localCalendarDate(new Date(instant));
    const observedMidnight = Date.UTC(observed.year, observed.month - 1, observed.day);
    const hour = Number(new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(instant)));
    instant -= observedMidnight + hour * 60 * 60 * 1_000 - target;
  }
  return new Date(instant);
};

const dateLabel = (date: CalendarDate) =>
  nlDateFormatter.format(new Date(Date.UTC(date.year, date.month - 1, date.day)));

/** A calendar-day frame for charts. It never changes what the data loaders may fetch. */
export const fullBrusselsDayWindow = (selection: DaySelection, now: Date): DayDisplayWindow => {
  if (!Number.isFinite(now.getTime())) throw new Error("INVALID_NOW");
  const today = localCalendarDate(now);
  const offset = selection === "yesterday" ? -1 : selection === "tomorrow" ? 1 : 0;
  const selected = addCalendarDays(today, offset);
  const next = addCalendarDays(selected, 1);
  return { start: localMidnight(selected).toISOString(), end: localMidnight(next).toISOString() };
};

export const selectBrusselsDayWindow = (
  selection: DaySelection,
  now: Date,
): DayWindowSelection => {
  if (!Number.isFinite(now.getTime())) throw new Error("INVALID_NOW");
  const today = localCalendarDate(now);
  const offset = selection === "yesterday" ? -1 : selection === "tomorrow" ? 1 : 0;
  const selectedDate = addCalendarDays(today, offset);
  const label = selection === "yesterday" ? "Gisteren" : selection === "tomorrow" ? "Morgen" : "Vandaag";

  if (selection === "tomorrow") {
    return { selection, label, dateLabel: dateLabel(selectedDate), state: "future", window: null };
  }

  const start = localMidnight(selectedDate);
  const liveEnd = new Date(Math.max(start.getTime(), now.getTime() - LIVE_HISTORY_CLOCK_SKEW_MS));
  const end = selection === "today" ? liveEnd : localMidnight(today);
  if (selection === "today" && start.getTime() === end.getTime()) {
    return { selection, label, dateLabel: dateLabel(selectedDate), state: "empty", window: null };
  }
  return {
    selection,
    label,
    dateLabel: dateLabel(selectedDate),
    state: "ready",
    window: { start: start.toISOString(), end: end.toISOString() },
  };
};

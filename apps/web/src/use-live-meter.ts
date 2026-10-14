import { useEffect, useState } from "react";
import type { LiveMeterReading } from "@crems/core";
import { startMeterConnection, type MeterConnection } from "./live-meter-connection.ts";

const fallback: LiveMeterReading = {
  timestamp: new Date().toISOString(),
  importPowerW: 686,
  exportPowerW: 0,
  importEnergyKwh: 12_843.21,
  exportEnergyKwh: 4_921.84,
  quality: "estimated",
  source: "simulator",
};

export const parseLiveMeterEvent = (data: string): LiveMeterReading | undefined => {
  try {
    const value: unknown = JSON.parse(data);
    if (!value || typeof value !== "object") return undefined;
    const reading = value as Record<string, unknown>;
    const finite = (key: string) => typeof reading[key] === "number" && Number.isFinite(reading[key]);
    if (typeof reading.timestamp !== "string" || !Number.isFinite(Date.parse(reading.timestamp)) || !finite("importPowerW") || !finite("exportPowerW") || !finite("importEnergyKwh") || !finite("exportEnergyKwh")) return undefined;
    if ((reading.currentPriceEurKwh !== undefined && !finite("currentPriceEurKwh")) || (reading.nextPriceEurKwh !== undefined && !finite("nextPriceEurKwh"))) return undefined;
    if (reading.quality !== "measured" && reading.quality !== "estimated" && reading.quality !== "incomplete") return undefined;
    if (reading.source !== "home-assistant" && reading.source !== "simulator") return undefined;
    return reading as unknown as LiveMeterReading;
  } catch { return undefined; }
};

export const useLiveMeter = () => {
  const [reading, setReading] = useState(fallback);
  const [connection, setConnection] = useState<MeterConnection>("connecting");

  useEffect(() => {
    return startMeterConnection({ stream: () => new EventSource("api/stream"), fetch: (url, options) => fetch(url, options),
      parse: parseLiveMeterEvent, reading: setReading, connection: setConnection });
  }, []);

  return { reading, connected: connection === "live", connection };
};

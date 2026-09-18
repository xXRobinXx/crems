import { saveBatteryReport, validateBatteryReport, type LocalBatteryReport } from "./local-battery-analysis.ts";
import { saveLocalEnergyProfile, type LocalEnergyProfile } from "./local-energy-profile.ts";

export type CentralResultKind = "energy-profile" | "battery-report";

export type CentralResultsClientOptions = Readonly<{
  /** Base URL of the bridge. Keep empty when the webapp is served by the bridge itself. */
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}>;

export type CentralResultsErrorCode = "network" | "http" | "invalid";

export class CentralResultsError extends Error {
  readonly code: CentralResultsErrorCode;
  readonly status?: number;

  constructor(code: CentralResultsErrorCode, message: string, status?: number) {
    super(message);
    this.name = "CentralResultsError";
    this.code = code;
    this.status = status;
  }
}

type StoredResult = LocalEnergyProfile | LocalBatteryReport;
type StorageSink = { setItem(key: string, value: string): void };

const paths: Record<CentralResultKind, string> = {
  "energy-profile": "/api/results/energy-profile",
  "battery-report": "/api/results/battery-report",
};

const endpoint = (baseUrl: string, kind: CentralResultKind): string => {
  const base = baseUrl.trim().replace(/\/+$/, "");
  return `${base}${paths[kind]}`;
};

const responseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined;
  try {
    return await response.json();
  } catch {
    throw new CentralResultsError("invalid", "De centrale resultatenservice gaf geen geldig antwoord.", response.status);
  }
};

const ensureResponse = (response: Response): void => {
  if (response.ok) return;
  throw new CentralResultsError("http", response.status === 404 ? "Het centrale resultaat bestaat nog niet." : "De centrale resultatenservice gaf een fout.", response.status);
};

const network = (error: unknown): never => {
  if (error instanceof CentralResultsError) throw error;
  throw new CentralResultsError("network", "De Raspberry Pi is momenteel niet bereikbaar.");
};

const parseEnergyProfile = (value: unknown): LocalEnergyProfile => {
  let saved: LocalEnergyProfile | undefined;
  const sink: StorageSink = { setItem: (_key, serialized) => { saved = JSON.parse(serialized) as LocalEnergyProfile; } };
  if (!saveLocalEnergyProfile(sink, value as LocalEnergyProfile) || !saved) {
    throw new CentralResultsError("invalid", "De centrale energiegegevens zijn ongeldig.");
  }
  return saved;
};

const parseBatteryReport = (value: unknown): LocalBatteryReport => {
  if (!validateBatteryReport(value)) throw new CentralResultsError("invalid", "Het centrale batterijrapport is ongeldig.");
  let saved: LocalBatteryReport | undefined;
  const sink: StorageSink = { setItem: (_key, serialized) => { saved = JSON.parse(serialized) as LocalBatteryReport; } };
  if (!saveBatteryReport(sink, value)) throw new CentralResultsError("invalid", "Het centrale batterijrapport is ongeldig.");
  return saved ?? value;
};

const parse = (kind: CentralResultKind, value: unknown): StoredResult => kind === "energy-profile" ? parseEnergyProfile(value) : parseBatteryReport(value);

const unwrapResult = (value: unknown): unknown => {
  if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 1 && Object.hasOwn(value, "result")) {
    return (value as { result: unknown }).result;
  }
  return value;
};

const defaultFetch = (): typeof fetch => {
  if (typeof globalThis.fetch !== "function") throw new CentralResultsError("network", "De centrale resultatenservice is niet beschikbaar.");
  return globalThis.fetch.bind(globalThis);
};

export const createCentralResultsClient = (options: CentralResultsClientOptions = {}) => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetchImpl ?? defaultFetch();

  const get = async <T extends StoredResult>(kind: CentralResultKind): Promise<T | undefined> => {
    let response: Response;
    try { response = await fetchImpl(endpoint(baseUrl, kind), { method: "GET", headers: { Accept: "application/json" } }); }
    catch (error) { return network(error); }
    if (response.status === 404) return undefined;
    ensureResponse(response);
    const value = unwrapResult(await responseBody(response));
    if (value === undefined || value === null) return undefined;
    return parse(kind, value) as T;
  };

  const put = async <T extends StoredResult>(kind: CentralResultKind, value: T): Promise<T> => {
    parse(kind, value);
    let response: Response;
    try {
      response = await fetchImpl(endpoint(baseUrl, kind), {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
    } catch (error) { return network(error); }
    ensureResponse(response);
    if (response.status === 204) return value;
    const returned = await responseBody(response);
    return (returned === undefined ? value : parse(kind, returned)) as T;
  };

  const remove = async (kind: CentralResultKind): Promise<void> => {
    let response: Response;
    try { response = await fetchImpl(endpoint(baseUrl, kind), { method: "DELETE", headers: { Accept: "application/json" } }); }
    catch (error) { return network(error); }
    if (response.status === 404) return;
    ensureResponse(response);
  };

  return {
    getEnergyProfile: () => get<LocalEnergyProfile>("energy-profile"),
    saveEnergyProfile: (profile: LocalEnergyProfile) => put("energy-profile", profile),
    removeEnergyProfile: () => remove("energy-profile"),
    getBatteryReport: () => get<LocalBatteryReport>("battery-report"),
    saveBatteryReport: (report: LocalBatteryReport) => put("battery-report", report),
    removeBatteryReport: () => remove("battery-report"),
  };
};

export type CentralResultsClient = ReturnType<typeof createCentralResultsClient>;

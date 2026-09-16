import type { LiveMeterReading } from "@crems/core";

export interface MeterSource {
  readonly name: string;
  read(): Promise<LiveMeterReading>;
}

type HassState = {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
};

export type HomeAssistantHistoryState = Record<string, unknown>;

export interface HomeAssistantPowerHistoryChannel {
  entityId: string;
  unit: string;
}

export interface HomeAssistantPowerHistoryChannels {
  import: HomeAssistantPowerHistoryChannel;
  export: HomeAssistantPowerHistoryChannel;
}

export class PowerHistoryNotConfiguredError extends Error {
  readonly name = "PowerHistoryNotConfiguredError";
  readonly code = "HISTORY_NOT_CONFIGURED" as const;

  constructor() {
    super("Vermogenshistory is niet geconfigureerd");
  }
}

export type HomeAssistantEntities = {
  importPower?: string;
  exportPower?: string;
  importEnergy?: string;
  exportEnergy?: string;
  voltage?: string;
  currentPrice?: string;
  nextPrice?: string;
  tomorrowPrice?: string;
};

const numericState = (state?: HassState) => {
  const value = Number(state?.state);
  return Number.isFinite(value) ? value : 0;
};

export const normalizePowerInWatts = (state?: HassState): number | undefined => {
  const rawValue = state?.state.trim();
  if (!rawValue || ["unknown", "unavailable", "none"].includes(rawValue.toLowerCase())) return undefined;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return undefined;
  const unit = String(state?.attributes.unit_of_measurement ?? "").trim().toLowerCase() || "w";
  if (unit !== "w" && unit !== "kw") return undefined;
  return Math.round(unit === "kw" ? value * 1_000 : value);
};

const selectedStates = (states: Map<string, HassState>, selector?: string) =>
  (selector ?? "").split(",").map((id) => states.get(id.trim())).filter((state): state is HassState => Boolean(state));

const summedState = (states: Map<string, HassState>, selector?: string) =>
  selectedStates(states, selector).reduce((total, state) => total + numericState(state), 0);

const score = (state: HassState, terms: string[], deviceClass?: string) => {
  const haystack = `${state.entity_id} ${String(state.attributes.friendly_name ?? "")}`.toLowerCase();
  let result = terms.reduce((total, term) => total + (haystack.includes(term) ? 3 : 0), 0);
  if (deviceClass && state.attributes.device_class === deviceClass) result += 2;
  if (["unknown", "unavailable", "none"].includes(state.state.toLowerCase())) result -= 20;
  return result;
};

const best = (states: HassState[], terms: string[], deviceClass: string) =>
  states.map((state) => ({ state, score: score(state, terms, deviceClass) }))
    .filter((candidate) => candidate.score > 3)
    .sort((a, b) => b.score - a.score)[0]?.state.entity_id;

export class HomeAssistantSource implements MeterSource {
  readonly name = "home-assistant";
  private entities: HomeAssistantEntities;

  constructor(private readonly baseUrl: string, private readonly token: string, configured: HomeAssistantEntities = {}) {
    this.entities = configured;
  }

  async states() {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/states`, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Home Assistant API antwoordde met ${response.status}`);
    return await response.json() as HassState[];
  }

  async resolvePriceState(kind: "current" | "tomorrow") {
    const entityId = (kind === "current" ? this.entities.currentPrice : this.entities.tomorrowPrice)?.trim();
    if (!entityId || entityId.includes(",")) throw new PowerHistoryNotConfiguredError();
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/api/states/${encodeURIComponent(entityId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) throw new PowerHistoryNotConfiguredError();
    if (!response.ok) throw new Error(`Home Assistant API antwoordde met ${response.status}`);
    const value = await response.json() as HassState | HassState[];
    const state = Array.isArray(value) ? value.find((candidate) => candidate.entity_id === entityId) : value;
    if (!state || state.entity_id !== entityId || typeof state.state !== "string" || !state.attributes || typeof state.attributes !== "object") throw new PowerHistoryNotConfiguredError();
    return state;
  }

  async history(entityId: string, start: string, end: string): Promise<HomeAssistantHistoryState[]> {
    const baseUrl = this.baseUrl.replace(/\/$/, "");
    const url = new URL(`${baseUrl}/api/history/period/${encodeURIComponent(start)}`);
    url.searchParams.set("end_time", end);
    url.searchParams.set("filter_entity_id", entityId);
    url.searchParams.set("minimal_response", "");
    url.searchParams.set("no_attributes", "");

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Home Assistant API antwoordde met ${response.status}`);
    const series = await response.json() as HomeAssistantHistoryState[][];
    return series[0] ?? [];
  }

  async resolvePowerHistoryChannels(): Promise<HomeAssistantPowerHistoryChannels> {
    const states = await this.states();
    this.detect(states);

    const resolve = (selector?: string): HomeAssistantPowerHistoryChannel => {
      const entityIds = (selector ?? "").split(",").map((value) => value.trim()).filter(Boolean);
      if (entityIds.length !== 1) throw new PowerHistoryNotConfiguredError();
      const matches = states.filter((state) => state.entity_id === entityIds[0]);
      if (matches.length !== 1) throw new PowerHistoryNotConfiguredError();
      const unit = String(matches[0]?.attributes.unit_of_measurement ?? "").trim();
      if (!["w", "kw"].includes(unit.toLowerCase())) throw new PowerHistoryNotConfiguredError();
      return { entityId: entityIds[0]!, unit };
    };

    return {
      import: resolve(this.entities.importPower),
      export: resolve(this.entities.exportPower),
    };
  }

  private detect(states: HassState[]) {
    this.entities = {
      importPower: this.entities.importPower ?? best(states, ["power consumption", "power_consumption", "energieverbruik", "active power import", "vermogen afname"], "power"),
      exportPower: this.entities.exportPower ?? best(states, ["power production", "power_production", "energieproductie", "active power export", "vermogen injectie"], "power"),
      importEnergy: this.entities.importEnergy ?? best(states, ["energy consumption", "energy_consumption", "energieverbruik", "total consumption", "afname"], "energy"),
      exportEnergy: this.entities.exportEnergy ?? best(states, ["energy production", "energy_production", "energieproductie", "total production", "injectie"], "energy"),
      voltage: this.entities.voltage ?? best(states, ["voltage", "spanning", "phase l1"], "voltage"),
      currentPrice: this.entities.currentPrice ?? best(states, ["current hour price", "huidig uur", "current_hour_price"], "monetary"),
      nextPrice: this.entities.nextPrice ?? best(states, ["next hour price", "volgend uur", "next_hour_price"], "monetary"),
    };
  }

  async read(): Promise<LiveMeterReading> {
    const states = await this.states();
    this.detect(states);
    const byId = new Map(states.map((state) => [state.entity_id, state]));
    const importPowerW = normalizePowerInWatts(byId.get(this.entities.importPower ?? ""));
    const exportPowerW = normalizePowerInWatts(byId.get(this.entities.exportPower ?? ""));
    if (importPowerW === undefined && exportPowerW === undefined) {
      throw new Error("Geen P1-vermogenssensoren automatisch gevonden");
    }
    return {
      timestamp: new Date().toISOString(),
      importPowerW: Math.max(0, importPowerW ?? 0),
      exportPowerW: Math.max(0, exportPowerW ?? 0),
      importEnergyKwh: summedState(byId, this.entities.importEnergy),
      exportEnergyKwh: summedState(byId, this.entities.exportEnergy),
      voltageV: numericState(byId.get(this.entities.voltage ?? "")) || undefined,
      currentPriceEurKwh: numericState(byId.get(this.entities.currentPrice ?? "")),
      nextPriceEurKwh: numericState(byId.get(this.entities.nextPrice ?? "")),
      quality: "measured",
      source: "home-assistant",
    };
  }

  get detectedEntities() { return { ...this.entities }; }
}

export class SimulatedP1Source implements MeterSource {
  readonly name = "simulated-p1";
  private importTotal = 12_843.21;
  private exportTotal = 4_921.84;
  private tick = 0;

  async read(): Promise<LiveMeterReading> {
    this.tick += 1;
    const daytime = new Date().getHours() >= 8 && new Date().getHours() <= 19;
    const solar = daytime ? Math.max(0, 1_100 + Math.sin(this.tick / 5) * 850) : 0;
    const load = 550 + Math.sin(this.tick / 3) * 230 + (this.tick % 17 === 0 ? 1_900 : 0);
    const net = load - solar;
    const importPowerW = Math.max(0, Math.round(net));
    const exportPowerW = Math.max(0, Math.round(-net));
    this.importTotal += importPowerW / 3_600_000;
    this.exportTotal += exportPowerW / 3_600_000;

    return {
      timestamp: new Date().toISOString(),
      importPowerW,
      exportPowerW,
      importEnergyKwh: Number(this.importTotal.toFixed(6)),
      exportEnergyKwh: Number(this.exportTotal.toFixed(6)),
      voltageV: 231.4,
      quality: "measured",
      source: "simulator",
    };
  }
}

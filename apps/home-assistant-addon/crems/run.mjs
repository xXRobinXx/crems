import { readFileSync } from "node:fs";

const optionsPath = "/data/options.json";
let options = {};
try { options = JSON.parse(readFileSync(optionsPath, "utf8")); } catch { /* defaults */ }

const mapping = {
  import_power_entity: "HASS_IMPORT_POWER_ENTITY",
  export_power_entity: "HASS_EXPORT_POWER_ENTITY",
  import_energy_entity: "HASS_IMPORT_ENERGY_ENTITY",
  export_energy_entity: "HASS_EXPORT_ENERGY_ENTITY",
  voltage_entity: "HASS_VOLTAGE_ENTITY",
  current_price_entity: "HASS_CURRENT_PRICE_ENTITY",
  next_price_entity: "HASS_NEXT_PRICE_ENTITY",
  tomorrow_price_entity: "HASS_TOMORROW_PRICE_ENTITY",
};
for (const [option, variable] of Object.entries(mapping)) {
  const value = options[option];
  if (typeof value === "string" && value.trim()) process.env[variable] = value.trim();
}
process.env.HASS_TOKEN = process.env.SUPERVISOR_TOKEN ?? "";
await import("./bridge/server.js");

import {
  HomeAssistantSource,
  SimulatedP1Source,
  type HomeAssistantEntities,
  type MeterSource,
} from "./meter-source.js";

export type MeterSourceConfiguration = {
  homeAssistantUrl?: string;
  homeAssistantToken?: string;
  entities?: HomeAssistantEntities;
};

export const createMeterSource = (configuration: MeterSourceConfiguration): MeterSource => {
  const url = configuration.homeAssistantUrl?.trim();
  const token = configuration.homeAssistantToken?.trim();

  return url && token
    ? new HomeAssistantSource(url, token, configuration.entities)
    : new SimulatedP1Source();
};

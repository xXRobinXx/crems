export const INVALID_BRIDGE_PORT = "INVALID_BRIDGE_PORT" as const;

export class InvalidBridgePortError extends Error {
  readonly name = "InvalidBridgePortError";
  readonly code = INVALID_BRIDGE_PORT;

  constructor() {
    super("Bridgepoort is ongeldig");
  }
}

export interface BridgeListenConfig {
  host: "127.0.0.1" | "0.0.0.0";
  port: number;
}

export const parseBridgeListenConfig = (rawPort?: string, rawHost?: string): BridgeListenConfig => {
  const host = rawHost?.trim() === "0.0.0.0" ? "0.0.0.0" : "127.0.0.1";
  const value = rawPort?.trim() ?? "";
  if (value === "") return { host, port: 8787 };
  if (!/^[0-9]+$/.test(value)) throw new InvalidBridgePortError();

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new InvalidBridgePortError();
  }

  return { host, port };
};

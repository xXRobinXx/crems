export const isHomeAssistantIngressPeer = (remoteAddress: string | undefined): boolean =>
  remoteAddress?.replace(/^::ffff:/, "") === "172.30.32.2";

export const stripHomeAssistantIngressPrefix = (requestUrl: string, host = "localhost"): URL => {
  const incoming = new URL(requestUrl, `http://${host}`);
  const prefix = incoming.pathname.match(/^(\/api\/hassio_ingress\/[^/]+)(?:\/|$)/)?.[1];
  if (!prefix) return incoming;
  return new URL(`${incoming.pathname.slice(prefix.length) || "/"}${incoming.search}`, incoming);
};

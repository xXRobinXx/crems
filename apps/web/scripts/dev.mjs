import { context } from "esbuild";
import { createReadStream, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { extname, resolve } from "node:path";

await import("./build.mjs");
const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const ctx = await context({
  entryPoints: [resolve(root, "src/main.tsx")], bundle: true, format: "esm",
  outfile: resolve(dist, "assets/app.js"), sourcemap: true, jsx: "automatic"
});
await ctx.watch();

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".map": "application/json" };
createServer(async (req, res) => {
  if (req.url?.startsWith("/api/")) {
    const upstream = request({ hostname: "127.0.0.1", port: 8787, path: req.url, method: req.method, headers: req.headers }, (reply) => {
      res.writeHead(reply.statusCode ?? 502, reply.headers); reply.pipe(res);
    });
    upstream.on("error", () => { if (!res.headersSent) res.writeHead(502); if (!res.writableEnded) res.end("Bridge unavailable"); });
    req.pipe(upstream); return;
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  const requested = req.url === "/" ? "index.html" : (req.url ?? "/").split("?")[0].slice(1);
  const file = resolve(dist, requested);
  if (!file.startsWith(dist) || !existsSync(file)) {
    res.setHeader("content-type", "text/html"); res.end(await readFile(resolve(dist, "index.html"))); return;
  }
  res.setHeader("content-type", types[extname(file)] ?? "application/octet-stream");
  createReadStream(file).pipe(res);
}).listen(5173, "127.0.0.1", () => console.log("CREMS web: http://127.0.0.1:5173"));

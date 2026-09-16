import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "assets"), { recursive: true });

await build({
  entryPoints: [resolve(root, "src/main.tsx")],
  bundle: true,
  format: "esm",
  outfile: resolve(dist, "assets/app.js"),
  sourcemap: true,
  jsx: "automatic",
  loader: { ".tsx": "tsx", ".ts": "ts" },
});

const html = (await readFile(resolve(root, "index.html"), "utf8"))
  .replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="/assets/app.js"></script>')
  .replace("</head>", '    <link rel="stylesheet" href="/assets/app.css" />\n  </head>');

await writeFile(resolve(dist, "index.html"), html);
try {
  await cp(resolve(root, "public"), dist, { recursive: true });
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

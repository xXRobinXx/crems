import { build } from "esbuild";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function buildWeb(root = resolve(dirname(fileURLToPath(import.meta.url)), ".."), production = true) {
  const dist = resolve(root, "dist");

  await rm(dist, { recursive: true, force: true });
  await mkdir(resolve(dist, "assets"), { recursive: true });

  const result = await build({
    entryPoints: [resolve(root, "src/main.tsx")],
    bundle: true,
    format: "esm",
    outfile: resolve(dist, "assets/app.js"),
    write: false,
    minify: production,
    sourcemap: production ? false : "linked",
    define: { "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development") },
    jsx: "automatic",
    loader: { ".tsx": "tsx", ".ts": "ts" },
  });

  const assets = {};
  for (const output of result.outputFiles) {
    const extension = output.path.endsWith(".css") ? "css" : output.path.endsWith(".js") ? "js" : undefined;
    const name = production && extension
      ? `app-${createHash("sha256").update(output.contents).digest("hex").slice(0, 16)}.${extension}`
      : basename(output.path);
    await writeFile(resolve(dist, "assets", name), output.contents);
    if (extension) assets[extension] = `assets/${name}`;
  }

  const html = (await readFile(resolve(root, "index.html"), "utf8"))
    .replace('<script type="module" src="/src/main.tsx"></script>', `<script type="module" src="${assets.js}"></script>`)
    .replace("</head>", assets.css ? `    <link rel="stylesheet" href="${assets.css}" />\n  </head>` : "</head>");

  await writeFile(resolve(dist, "index.html"), html);
  try {
    await cp(resolve(root, "public"), dist, { recursive: true });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildWeb();

import { readFile, access } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

export const routingFiles = [
  'AGENTS.md', 'AGENT_A_ARCHITECT_REVIEWER.md', 'AGENT_B_IMPLEMENTER.md',
  'AGENT_C_UX_BROWSER_QA.md', 'README.md', 'docs/README.md', 'PLAN.md', 'docs/guides/repository-map.md',
  '.agents/skills/crems-workflow/SKILL.md',
];

// Inspect only source/configuration: no runtime data, secrets, logs or subprocesses.
export async function checkStructure(root) {
  root = resolve(root);
  const errors = [];
  const read = async path => {
    try { return await readFile(resolve(root, path), 'utf8'); }
    catch { errors.push(`Ontbrekend/onleesbaar: ${path}`); return undefined; }
  };
  const ignore = await read('.gitignore');
  if (ignore !== undefined) {
    const rules = ignore.split(/\r?\n/).map(line => line.trim());
    for (const folder of ['archive', 'research']) {
      if (!rules.includes(`/${folder}/`) || rules.includes(`${folder}/`))
        errors.push(`Gitignore moet ${folder} alleen aan de repositoryroot uitsluiten.`);
    }
  }
  for (const [a, b] of [
    ['crems/config.yaml', 'apps/home-assistant-addon/crems/config.yaml'],
    ['repository.yaml', 'apps/home-assistant-addon/repository.yaml'],
  ]) {
    const left = await read(a), right = await read(b);
    if (left !== undefined && right !== undefined && left.replace(/\r\n/g, '\n') !== right.replace(/\r\n/g, '\n'))
      errors.push(`HA-metadata wijkt af: ${a} / ${b}`);
  }
  const workspace = await read('pnpm-workspace.yaml');
  if (workspace !== undefined) {
    const section = workspace.split(/^packages:\s*$/m)[1]?.split(/^\S/m)[0] ?? '';
    const patterns = [];
    for (const line of section.split(/\r?\n/)) {
      if (!line.trim() || /^\s*#/.test(line)) continue;
      const match = /^\s+-\s+(?:"([^"]+)"|'([^']+)'|([^\s#]+))\s*(?:#.*)?$/.exec(line);
      if (!match) errors.push('Onbekende workspace-listvorm; inspecteer buildgrens.');
      else patterns.push(match[1] ?? match[2] ?? match[3]);
    }
    patterns.sort();
    if (JSON.stringify(patterns) !== JSON.stringify(['apps/*', 'packages/*']))
      errors.push('Workspacegrens moet uitsluitend apps/* en packages/* zijn.');
  }
  const manifest = await read('packages/core/package.json');
  if (manifest !== undefined) {
    try {
      const targets = Object.values(JSON.parse(manifest).exports ?? {});
      if (!targets.length) errors.push('Core package heeft geen exports.');
      for (const target of targets) {
        if (typeof target !== 'string' || !target.startsWith('./')) { errors.push('Onverwachte core-exportvorm; inspecteer het packagecontract.'); continue; }
        const base = resolve(root, 'packages/core');
        const path = resolve(base, target), offset = relative(base, path);
        if (offset.startsWith('..') || isAbsolute(offset)) { errors.push(`Core-export buiten package: ${target}`); continue; }
        try { await access(path); } catch { errors.push(`Core-export ontbreekt: ${target}`); }
      }
    } catch { errors.push('Core package.json is geen geldige JSON.'); }
  }
  const dockerfile = await read('apps/home-assistant-addon/crems/Dockerfile');
  if (dockerfile !== undefined) {
    const allowedContext = new Set(['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.base.json',
      'packages/core', 'apps/web', 'apps/bridge', 'apps/home-assistant-addon/crems/run.mjs']);
    const allowedBuild = new Set(['/src/apps/bridge/dist', '/src/apps/web/dist', '/src/node_modules',
      '/src/packages/core/package.json', '/src/packages/core/dist',
      '/src/apps/bridge/data/belpex-day-ahead-2021-09-01_2026-08-31.csv']);
    for (const line of dockerfile.split(/\r?\n/)) {
      if (!/^\s*COPY\s/i.test(line)) continue;
      // This guard supports the repository's simple COPY form. Other syntax needs review.
      const match = /^\s*COPY\s+(--from=build\s+)?([^#\["\\]+?)\s*$/.exec(line);
      if (!match) { errors.push('Onbekende Docker COPY-vorm; inspecteer buildcontext.'); continue; }
      const tokens = match[2].trim().split(/\s+/);
      const sources = tokens.slice(0, -1);
      const allowed = match[1] ? allowedBuild : allowedContext;
      if (!sources.length || sources.some(source => !allowed.has(source.replace(/^\.\//, '').replace(/\/$/, ''))))
        errors.push('Docker COPY buiten goedgekeurde buildinputs; inspecteer buildcontext.');
    }
  }
  for (const file of routingFiles) {
    const content = await read(file);
    if (content === undefined) continue;
    if (file.endsWith('SKILL.md') && !/^---\r?\nname: crems-workflow\r?\ndescription: .+\r?\n---/.test(content))
      errors.push(`Ongeldige skillmetadata: ${file}`);
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, '').split('#')[0];
      if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue;
      const path = resolve(root, dirname(file), target), offset = relative(root, path);
      if (offset.startsWith('..') || isAbsolute(offset)) { errors.push(`Routerlink buiten repository: ${file} → ${target}`); continue; }
      try { await access(path); } catch { errors.push(`Gebroken routerlink: ${file} → ${target}`); }
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = await checkStructure(fileURLToPath(new URL('..', import.meta.url)));
  for (const error of errors) console.error(error);
  if (!errors.length) console.log('PASS: HA-metadata, workspacegrenzen, Docker COPY-grenzen, core-exports en repo-skill/routerlinks.');
  process.exitCode = errors.length ? 1 : 0;
}

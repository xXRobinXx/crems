import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { checkStructure, routingFiles } from './check-structure.mjs';

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'crems-structure-'));
  const write = async (path, text) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text);
  };
  try {
    for (const path of routingFiles) await write(path, '# Routing\n');
    await write('.gitignore', '/archive/\n/research/\n');
    await write('.agents/skills/crems-workflow/SKILL.md', '---\nname: crems-workflow\ndescription: Route CREMS work.\n---\n[Map](../../../docs/guides/repository-map.md)');
    for (const path of ['crems/config.yaml', 'apps/home-assistant-addon/crems/config.yaml']) await write(path, 'version: "0.1.15"\n');
    for (const path of ['repository.yaml', 'apps/home-assistant-addon/repository.yaml']) await write(path, 'name: CREMS\n');
    await write('pnpm-workspace.yaml', 'packages:\n  - apps/*\n  - packages/*\n');
    await write('packages/core/package.json', JSON.stringify({ exports: { '.': './src/index.ts' } }));
    await write('packages/core/src/index.ts', 'export {};');
    await write('apps/home-assistant-addon/crems/Dockerfile', 'COPY apps/web ./apps/web\nCOPY packages/core ./packages/core\n');
    assert.deepEqual(await checkStructure(root), []);
    await run(root, write);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('structure check detects HA mirror drift without inspecting data', () => fixture(async (root, write) => {
  await write('crems/config.yaml', 'version: "wrong"\n');
  assert.match((await checkStructure(root)).join('\n'), /HA-metadata wijkt af/);
}));
test('structure check rejects archived build inputs and missing exports', () => fixture(async (root, write) => {
  await write('pnpm-workspace.yaml', 'packages:\n  - apps/*\n  - packages/*\n  - archive/* # old code\n');
  await write('packages/core/package.json', JSON.stringify({ exports: { '.': './missing.ts' } }));
  await write('apps/home-assistant-addon/crems/Dockerfile', 'COPY research ./research\n');
  const errors = (await checkStructure(root)).join('\n');
  assert.match(errors, /Workspacegrens/);
  assert.match(errors, /Core-export ontbreekt/);
  assert.match(errors, /Docker COPY/);
}));
test('structure check fails closed on whole-context Docker copies and unknown YAML list syntax', () => fixture(async (root, write) => {
  await write('apps/home-assistant-addon/crems/Dockerfile', 'COPY . .\n');
  await write('pnpm-workspace.yaml', 'packages:\n  - apps/*\n  - packages/*\n  - [archive/*]\n');
  const errors = (await checkStructure(root)).join('\n');
  assert.match(errors, /Docker COPY/);
  assert.match(errors, /Workspacegrens/);
}));
test('structure check detects broken and escaping routing references', () => fixture(async (root, write) => {
  await write('AGENTS.md', '[Missing](docs/no-file.md)\n[Outside](../outside.md)');
  const errors = (await checkStructure(root)).join('\n');
  assert.match(errors, /Gebroken routerlink/);
  assert.match(errors, /Routerlink buiten repository/);
}));
test('root exclusions keep documentation research visible to Git', () => fixture(async (root, write) => {
  execFileSync('git', ['init', '-q', root]);
  const paths = 'archive/prototype.ts\nresearch/reference.ts\ndocs/research/skill-routing-research.md\n';
  const ignored = () => execFileSync('git', ['-C', root, 'check-ignore', '--no-index', '--stdin'], { input: paths, encoding: 'utf8' }).trim().split(/\r?\n/);
  assert.deepEqual(ignored(), ['archive/prototype.ts', 'research/reference.ts']);
  await write('.gitignore', 'archive/\nresearch/\n');
  assert.ok(ignored().includes('docs/research/skill-routing-research.md'));
  assert.match((await checkStructure(root)).join('\n'), /Gitignore moet research/);
}));

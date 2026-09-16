import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTasks, releaseGate, checks, fingerprint } from './harness.mjs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const evidence = { fingerprint: 'v1', stable: true, checks: checks.map(name => ({ name, exitCode: 0 })) };
const review = { fingerprint: 'v1', status: 'APPROVED', role: 'Agent A', report: 'docs/review.md' };
const browser = { fingerprint: 'v1', status: 'PASS', role: 'Agent C', report: 'docs/browser.md' };
test('deduplicates completed tasks without overwriting explicit status', () => {
  const tasks = parseTasks('### Task 035 — Rapport\n**Status:** READY FOR BROWSER REVIEW\n## Completed\n- Task 035 — Rapport — `APPROVED`.\n- Task 001 — Structuur.');
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].status, 'READY FOR BROWSER REVIEW');
  assert.match(tasks[1].status, /geen expliciete/);
});
test('separate refinement headings cannot overwrite the preceding task status', () => {
  const tasks = parseTasks('### H001 — Harness\nStatus: IN PROGRESS\n#### Actieve verfijning\nStatus: READY FOR BROWSER REVIEW');
  assert.equal(tasks[0].status, 'IN PROGRESS');
});
test('fails closed on missing, stale, interrupted and failed evidence', () => {
  for (const input of [null, { ...evidence, fingerprint: 'old' }, { ...evidence, stable: false },
    { ...evidence, checks: [] }, { ...evidence, checks: checks.map(name => ({ name, exitCode: 1 })) }])
    assert.equal(releaseGate(input, 'v1', review, browser).status, 'NOT APPROVED');
});
test('requires separate current review and browser attestations', () => {
  for (const [r, b] of [[null, browser], [review, null], [{ ...review, role: 'Agent B' }, browser],
    [review, { ...browser, fingerprint: 'old' }], [review, { ...browser, status: 'FAIL' }]])
    assert.equal(releaseGate(evidence, 'v1', r, b).status, 'NOT APPROVED');
  assert.equal(releaseGate(evidence, 'v1', review, browser).status, 'APPROVED');
});
test('fingerprint invalidates changed source and ignores secret/data/output contents', async () => {
  const root = await mkdtemp(join(tmpdir(), 'crems-harness-'));
  try {
    for (const dir of ['apps', 'packages', 'tools', 'apps/data', 'apps/dist']) await mkdir(join(root, dir), { recursive: true });
    for (const file of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.base.json', 'AGENTS.md', 'REQUIREMENTS.md', 'ARCHITECTURE.md', 'AGENT_PLAYBOOK.md', 'TASKS.md']) await writeFile(join(root, file), '{}');
    await writeFile(join(root, 'apps/code.ts'), 'first');
    const first = await fingerprint(root);
    for (const file of ['apps/.env', 'apps/data/local.json', 'apps/dist/build.js']) await writeFile(join(root, file), 'private');
    assert.equal(await fingerprint(root), first);
    await writeFile(join(root, 'apps/code.ts'), 'second');
    assert.notEqual(await fingerprint(root), first);
  } finally { await rm(root, { recursive: true, force: true }); }
});

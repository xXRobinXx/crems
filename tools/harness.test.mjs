import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTasks, releaseGate, checks, fingerprint, fingerprintRootFiles } from './harness.mjs';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

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
test('repeated task scope headings preserve the first active status and title', () => {
  const tasks = parseTasks('### Task 061 — Audit\n**Status:** IN PROGRESS\n### Task 061 — CSV scope\n### Task 061 — History\nStatus: APPROVED');
  assert.deepEqual(tasks, [{ id: '061', title: 'Audit', status: 'IN PROGRESS' }]);
});
test('a historical completed-list row cannot override a later explicit task definition', () => {
  const tasks = parseTasks('- Task 061 — History — `APPROVED`.\n### Task 061 — Current\nStatus: IN PROGRESS');
  assert.deepEqual(tasks, [{ id: '061', title: 'Current', status: 'IN PROGRESS' }]);
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
    for (const file of fingerprintRootFiles) { await mkdir(dirname(join(root, file)), { recursive: true }); await writeFile(join(root, file), '{}'); }
    await writeFile(join(root, 'apps/code.ts'), 'first');
    const first = await fingerprint(root);
    for (const file of ['apps/.env', 'apps/data/local.json', 'apps/dist/build.js']) await writeFile(join(root, file), 'private');
    assert.equal(await fingerprint(root), first);
    await writeFile(join(root, 'apps/code.ts'), 'second');
    assert.notEqual(await fingerprint(root), first);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('release fingerprint covers deployment code, metadata and repo skill instructions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'crems-harness-release-'));
  try {
    for (const dir of ['apps', 'packages', 'tools', '.github/workflows', 'crems', '.agents/skills/crems-workflow']) await mkdir(join(root, dir), { recursive: true });
    for (const file of fingerprintRootFiles) { await mkdir(dirname(join(root, file)), { recursive: true }); await writeFile(join(root, file), '{}'); }
    for (const file of ['tools/release.ps1', 'apps/Dockerfile', '.github/workflows/release.yml', 'crems/config.yaml', '.agents/skills/crems-workflow/SKILL.md', 'AGENT_B_IMPLEMENTER.md', 'docs/guides/repository-map.md', 'PLAN.md']) {
      const before = await fingerprint(root);
      await writeFile(join(root, file), 'changed');
      assert.notEqual(await fingerprint(root), before, file);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

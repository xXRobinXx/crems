import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export function parseTasks(markdown) {
  const tasks = new Map();
  let current;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^### (?:Task (\d{3})|(H\d{3})) — (.+)$/);
    if (heading) {
      current = { id: heading[1] ?? heading[2], title: heading[3], status: 'UNKNOWN' };
      tasks.set(current.id, current);
    } else if (/^#{1,6} /.test(line)) current = undefined;
    const status = line.match(/^(?:\*\*)?Status:(?:\*\*)?\s*(.+)$/);
    if (current && status) current.status = status[1];
    const completed = line.match(/^- Task (\d{3}) — (.+)$/);
    if (completed && !tasks.has(completed[1])) tasks.set(completed[1], {
      id: completed[1], title: completed[2].replace(/ — `APPROVED`\.$/, '').replace(/\.$/, ''),
      status: completed[2].includes('`APPROVED`') ? 'APPROVED' : 'COMPLETED (geen expliciete reviewstatus)'
    });
  }
  return [...tasks.values()];
}

// Hash source/configuration only. Never read local datasets, secrets or generated output.
const skipped = new Set(['node_modules', 'dist', 'data', '.git', '.harness', '.pnpm-store']);
export async function fingerprint(root) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(resolve(root, dir), { withFileTypes: true })) {
      if (entry.isSymbolicLink() || skipped.has(entry.name) || entry.name.startsWith('.env')) continue;
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (/\.(?:[cm]?[jt]sx?|json|ya?ml|css|html)$/.test(entry.name)) files.push(path);
    }
  }
  for (const dir of ['apps', 'packages', 'tools']) await walk(dir);
  files.push('package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.base.json',
    'AGENTS.md', 'REQUIREMENTS.md', 'ARCHITECTURE.md', 'AGENT_PLAYBOOK.md', 'TASKS.md');
  const hash = createHash('sha256');
  for (const file of files.sort()) {
    const bytes = await readFile(resolve(root, file));
    hash.update(`${file}\0${bytes.length}\0`); hash.update(bytes);
  }
  return hash.digest('hex');
}

export const checks = ['test:harness', 'build', 'test', 'typecheck'];
export function releaseGate(evidence, hash, review, browser) {
  const reasons = [];
  if (!evidence || evidence.fingerprint !== hash || evidence.stable !== true)
    reasons.push('Automatisch bewijs ontbreekt of is verouderd.');
  if (!checks.every(name => evidence?.checks?.some(c => c.name === name && c.exitCode === 0)))
    reasons.push('Niet alle automatische controles zijn geslaagd.');
  if (review?.fingerprint !== hash || review?.status !== 'APPROVED' || review?.role !== 'Agent A' || !review?.report)
    reasons.push('Agent A-review met APPROVED voor deze versie ontbreekt.');
  if (browser?.fingerprint !== hash || browser?.status !== 'PASS' || browser?.role !== 'Agent C' || !browser?.report)
    reasons.push('Agent C-browserrapport met PASS voor deze versie ontbreekt.');
  return { status: reasons.length ? 'NOT APPROVED' : 'APPROVED', reasons };
}

async function optionalJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT' || error instanceof SyntaxError) return null; throw error; }
}

export async function main(root, command = 'status') {
  if (!['status', 'check', 'gate'].includes(command)) throw new Error('Gebruik: pnpm harness [status|check|gate]');
  if (command === 'status') {
    const tasks = parseTasks(await readFile(resolve(root, 'TASKS.md'), 'utf8'));
    for (const task of tasks) console.log(`${task.id} | ${task.title} | ${task.status}`);
    console.log('\nUitbreidingen van Task 035: zie de actuele specificaties in TASKS.md. Historische APPROVED-status is geen huidige productrelease.');
    return 0;
  }
  const hash = await fingerprint(root);
  const directory = resolve(root, '.harness');
  if (command === 'check') {
    await mkdir(directory, { recursive: true });
    // Invalidate previous success before starting; interruption must not leave a green result.
    const evidence = { version: 1, startedAt: new Date().toISOString(), fingerprint: hash, stable: false, checks: [] };
    const save = () => writeFile(resolve(directory, 'checks.json'), JSON.stringify(evidence, null, 2) + '\n');
    await save();
    for (const name of checks) {
      console.log(`Controle: ${name}`);
      const result = process.platform === 'win32'
        ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `pnpm ${name}`], { cwd: root, stdio: 'inherit', windowsHide: true })
        : spawnSync('pnpm', [name], { cwd: root, stdio: 'inherit' });
      evidence.checks.push({ name, exitCode: result.status ?? 1 });
      await save();
      if (result.status !== 0) return 1;
    }
    evidence.stable = hash === await fingerprint(root);
    evidence.finishedAt = new Date().toISOString();
    await save();
    return evidence.stable ? 0 : 1;
  }
  async function attestation(name) {
    const value = await optionalJson(resolve(directory, name));
    if (!value || typeof value.report !== 'string') return null;
    const report = resolve(root, value.report);
    const path = relative(resolve(root, 'docs'), report);
    if (isAbsolute(path) || path.startsWith('..') || !path.endsWith('.md')) return null;
    try {
      const digest = createHash('sha256').update(await readFile(report)).digest('hex');
      return digest === value.reportSha256 ? value : null;
    } catch { return null; }
  }
  const gate = releaseGate(await optionalJson(resolve(directory, 'checks.json')), hash,
    await attestation('review.json'), await attestation('browser.json'));
  console.log(JSON.stringify(gate, null, 2));
  return gate.status === 'APPROVED' ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(resolve(fileURLToPath(new URL('..', import.meta.url))), process.argv[2])
    .then(code => { process.exitCode = code; })
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}

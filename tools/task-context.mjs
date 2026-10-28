import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Read only the first bounded task section; never infer approval from history.
export function currentTaskContext(markdown) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex(line => /^#{1,3} .*Task \d{3}\b/.test(line));
  if (start < 0) throw new Error('Geen actuele taaksectie gevonden; inspecteer TASKS.md.');
  let end = start + 1;
  while (end < lines.length && !/^#{1,3} /.test(lines[end])) end++;
  const section = lines.slice(start, end).join('\n').trim();
  if (!section.includes('Write set:')) throw new Error('Actuele write set ontbreekt; inspecteer TASKS.md.');
  return section;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = await readFile(new URL('../TASKS.md', import.meta.url), 'utf8');
  console.log(currentTaskContext(source));
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { currentTaskContext } from './task-context.mjs';

test('selects current scope including ownership and gates without historical approval', () => {
  const source = '# Tasks\r\n\r\n## Actuele eindstap Task 061 — herstel\r\nOwner: root\r\nWrite set: a.ts\r\nBrowser NOT RUN\r\n\r\n## Task 061 — vroeger\r\nAPPROVED\r\n';
  const context = currentTaskContext(source);
  assert.ok(context.includes('Owner: root'));
  assert.ok(context.includes('Browser NOT RUN'));
  assert.ok(!context.includes('APPROVED'));
});

test('fails closed instead of guessing a task or permitted files', () => {
  assert.throws(() => currentTaskContext('# Tasks\nGeen scope'), /taaksectie/);
  assert.throws(() => currentTaskContext('## Task 061 — herstel\nOwner: root'), /write set/);
});

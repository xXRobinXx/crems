import test from 'node:test';
import assert from 'node:assert/strict';
import { supervisorRequest } from './ha-supervisor.mjs';

const request = { url: 'http://ha.test:8123', token: 'test-secret', method: 'Get', path: 'addons/350f0e24_crems_energy/info' };
function transport(onSend) {
  return class extends EventTarget {
    constructor(url) { super(); assert.equal(url, 'ws://ha.test:8123/api/websocket'); queueMicrotask(() => this.receive({ type: 'auth_required' })); }
    receive(data) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) })); }
    send(data) { onSend(this, JSON.parse(data)); }
    close() { this.dispatchEvent(new Event('close')); }
  };
}
test('authenticates and accepts only the matching successful response', async () => {
  const sent = [];
  const WebSocketImpl = transport((ws, msg) => {
    sent.push(msg);
    if (msg.type === 'auth') { assert.equal(msg.access_token, 'test-secret'); ws.receive({ type: 'auth_ok' }); }
    else { ws.receive({ type: 'result', id: 99, success: false }); ws.receive({ type: 'result', id: 1, success: true, result: { version: '0.1.13', state: 'started', options: { private_key: 'test-secret' }, ingress_url: 'private-session' } }); }
  });
  const response = await supervisorRequest(request, { WebSocketImpl });
  assert.deepEqual(response.data, { version: '0.1.13', version_latest: undefined, state: 'started' });
  assert.equal(JSON.stringify(response).includes('test-secret'), false);
  assert.equal(JSON.stringify(response).includes('private-session'), false);
  assert.deepEqual(sent[1], { id: 1, type: 'supervisor/api', endpoint: '/addons/350f0e24_crems_energy/info', method: 'get', data: {}, timeout: 120 });
});
test('update always uses HA update command with backup', async () => {
  const WebSocketImpl = transport((ws, msg) => {
    if (msg.type === 'auth') ws.receive({ type: 'auth_ok' });
    else { assert.deepEqual(msg, { id: 1, type: 'hassio/update/addon', addon: '350f0e24_crems_energy', backup: true }); ws.receive({ type: 'result', id: 1, success: true, result: null }); }
  });
  await supervisorRequest({ ...request, method: 'Post', path: 'addons/350f0e24_crems_energy/update', body: { backup: true } }, { WebSocketImpl });
});
test('rejects authentication without leaking server text or credentials', async () => {
  const WebSocketImpl = transport(ws => ws.receive({ type: 'auth_invalid', message: 'test-secret' }));
  await assert.rejects(supervisorRequest(request, { WebSocketImpl }), { message: 'HA_AUTH_REJECTED' });
});
test('sanitizes Supervisor failure and stops on disconnect', async () => {
  for (const disconnect of [true, false]) {
    const WebSocketImpl = transport((ws, msg) => {
      if (msg.type === 'auth') ws.receive({ type: 'auth_ok' });
      else if (disconnect) ws.close();
      else ws.receive({ type: 'result', id: 1, success: false, error: { message: 'test-secret' } });
    });
    await assert.rejects(supervisorRequest(request, { WebSocketImpl }), { message: disconnect ? 'HA_CONNECTION_CLOSED' : 'HA_SUPERVISOR_REQUEST_FAILED' });
  }
});
test('timeout is bounded and warns against blindly retrying a mutation', async () => {
  await assert.rejects(supervisorRequest(request, { WebSocketImpl: transport(() => {}), timeoutMs: 5 }), { message: 'HA_TIMEOUT_VERIFY_STATE_BEFORE_RETRY' });
});
test('refuses other apps, insecure URL credentials and updates without backup', () => {
  for (const patch of [{ path: 'addons/other/update', method: 'Post', body: { backup: true } }, { path: 'addons/350f0e24_crems_energy/update', method: 'Post', body: { backup: false } }, { url: 'http://user:pass@ha.test' }]) {
    assert.throws(() => supervisorRequest({ ...request, ...patch }));
  }
});

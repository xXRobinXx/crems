import { pathToFileURL } from 'node:url';

// HA user tokens authenticate on WebSocket, not on the internal /api/hassio proxy.
export function supervisorRequest({ url, token, method, path, body }, { WebSocketImpl = WebSocket, timeoutMs = 600_000 } = {}) {
  const base = new URL(url);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || !token) throw new Error('HA_CONFIG_INVALID');
  const slug = '350f0e24_crems_energy';
  const allowed = (method === 'Get' && path === `addons/${slug}/info`) ||
    (method === 'Post' && path === 'store/reload') ||
    (method === 'Post' && path === `addons/${slug}/update` && body?.backup === true);
  if (!allowed) throw new Error('HA_OPERATION_NOT_ALLOWED');
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  base.pathname = `${base.pathname.replace(/\/$/, '')}/api/websocket`;
  base.search = ''; base.hash = '';
  return new Promise((resolve, reject) => {
    const socket = new WebSocketImpl(base.href);
    let settled = false;
    let authenticated = false;
    const finish = (error, data) => {
      if (settled) return;
      settled = true; clearTimeout(timer); token = null;
      try { socket.close(); } catch {}
      error ? reject(new Error(error)) : resolve({ result: 'ok', data });
    };
    const timer = setTimeout(() => finish('HA_TIMEOUT_VERIFY_STATE_BEFORE_RETRY'), timeoutMs);
    socket.addEventListener('error', () => finish('HA_CONNECTION_FAILED'));
    socket.addEventListener('close', () => finish('HA_CONNECTION_CLOSED'));
    socket.addEventListener('message', ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'auth_required' && !authenticated) {
          socket.send(JSON.stringify({ type: 'auth', access_token: token }));
        } else if (msg.type === 'auth_invalid') {
          finish('HA_AUTH_REJECTED');
        } else if (msg.type === 'auth_ok' && !authenticated) {
          authenticated = true; token = null;
          const command = path.endsWith('/update')
            ? { type: 'hassio/update/addon', addon: slug, backup: true }
            : { type: 'supervisor/api', endpoint: `/${path}`, method: method.toLowerCase(), data: body ?? {}, timeout: 120 };
          socket.send(JSON.stringify({ id: 1, ...command }));
        } else if (authenticated && msg.type === 'result' && msg.id === 1) {
          const result = method === 'Get' && path.endsWith('/info') && msg.success === true
            ? { version: msg.result?.version, version_latest: msg.result?.version_latest, state: msg.result?.state }
            : msg.result;
          finish(msg.success === true ? null : 'HA_SUPERVISOR_REQUEST_FAILED', result);
        }
      } catch { finish('HA_PROTOCOL_FAILED'); }
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    let input = '';
    for await (const chunk of process.stdin) {
      input += chunk;
      if (input.length > 16_384) throw new Error('HA_INPUT_TOO_LARGE');
    }
    const request = JSON.parse(input.replace(/^\uFEFF/, ''));
    input = '';
    const result = await supervisorRequest(request);
    request.token = null;
    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    // Never echo upstream errors or input: these may contain credentials.
    const safeCodes = new Set(['HA_CONFIG_INVALID', 'HA_OPERATION_NOT_ALLOWED', 'HA_AUTH_REJECTED', 'HA_SUPERVISOR_REQUEST_FAILED', 'HA_CONNECTION_FAILED', 'HA_CONNECTION_CLOSED', 'HA_PROTOCOL_FAILED', 'HA_TIMEOUT_VERIFY_STATE_BEFORE_RETRY', 'HA_INPUT_TOO_LARGE']);
    const code = safeCodes.has(error?.message) ? error.message : 'HA_REQUEST_FAILED';
    process.stderr.write(`${code}: controleer authenticatie en appstatus voordat je opnieuw probeert.\n`);
    process.exitCode = 1;
  }
}

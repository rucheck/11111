'use strict';

const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const http = require('node:http');
const test = require('node:test');
const {
  createBackend,
  createService,
  installSignalHandlers,
  parseAllowedOrigins,
  resolveRuntimeConfig
} = require('./server');

const AUTH_OK = JSON.stringify({
  ok: true,
  environment_set: false,
  keychain: 'found',
  verification: 'not_performed'
});
const QUOTA_OK = JSON.stringify({
  Data: [{APIID: 'zhida_openai', TotalQuota: 100, TotalUsed: 4, RemainingQuota: 96}]
});
const FRONTEND_QUESTION = require('./content/questions.json').questions[0];
const GENERATED_PLAN = JSON.stringify({beats: Array.from({length: 4}, () => ({
  situation: '新的情境推动故事发展。',
  options: Array.from({length: 5}, (_, index) => ({
    kind: ['核实事实', '建立信任', '正面对质', '探索支线', '观察等待'][index],
    hint: '影响将在选择后揭晓',
    text: `行动 ${index + 1}`,
    result: `行动 ${index + 1} 的具体后果`,
    trust: 0,
    evidence: index === 0 ? 1 : 0,
    quality: 1,
    heat: 0,
    energy: -1
  }))
}))});
const FRONTEND_CHAPTER_PAYLOAD = {
  genre: '悬疑反转',
  question: FRONTEND_QUESTION,
  chapter: 1,
  chapters: 6,
  beats: 4,
  tone: '克制现实',
  plan: '追寻事实',
  history: [],
  storyBible: [],
  continuity: {lastChapter: null, openThreads: [], relationship: 0, evidence: 0},
  editor: '加强开篇冲突，但不要改变既定人物动机。',
  feedback: 'stick',
  trust: 0,
  evidence: 0
};

function mockExec(handlers) {
  return (_binary, args, _options, callback) => {
    const key = args.slice(0, 2).join(' ');
    const handler = handlers[key] || handlers[args[0]];
    if (!handler) return callback(Object.assign(new Error('unexpected CLI call'), {code: 1}), '', '');
    if (handler instanceof Error) return callback(handler, handler.stdout || '', handler.stderr || '');
    if (typeof handler === 'function') return handler(args, callback);
    callback(null, handler, '');
  };
}

async function withServer(options, callback) {
  const backend = createBackend({
    cliPath: 'mock-zhihu-cli',
    existsSync: () => true,
    ...options
  });
  const server = http.createServer(backend.listener);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    await callback(`http://127.0.0.1:${address.port}`, backend);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function getJson(base, pathname, options) {
  const response = await fetch(`${base}${pathname}`, options);
  return {status: response.status, headers: response.headers, body: await response.json()};
}

const validChapterRequest = {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({genre: '悬疑反转', beats: 4})
};

function chapterRequest(payload) {
  return {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  };
}

test('runtime config defaults to loopback and honors deployment environment', () => {
  const local = resolveRuntimeConfig({LOCALAPPDATA: 'C:\\Local'});
  assert.equal(local.host, '127.0.0.1');
  assert.equal(local.port, 4173);
  assert.equal(local.cliPath, 'C:\\Local\\ZhihuCLI\\current\\zhihu-cli.exe');
  assert.deepEqual(local.allowedOrigins, []);

  const deployed = resolveRuntimeConfig({
    HOST: '0.0.0.0',
    PORT: '8088',
    ZHIHU_CLI_PATH: '/usr/local/bin/zhihu-cli',
    ALLOWED_ORIGINS: 'https://rucheck.github.io, https://preview.example'
  });
  assert.equal(deployed.host, '0.0.0.0');
  assert.equal(deployed.port, 8088);
  assert.equal(deployed.cliPath, '/usr/local/bin/zhihu-cli');
  assert.deepEqual(deployed.allowedOrigins, ['https://rucheck.github.io', 'https://preview.example']);
  assert.deepEqual(parseAllowedOrigins(' https://a.example,https://a.example, https://b.example '), [
    'https://a.example',
    'https://b.example'
  ]);
});

test('backend invokes the explicitly configured CLI path', async () => {
  const binaries = [];
  await withServer({
    cliPath: '/usr/local/bin/zhihu-cli',
    execFile: (binary, args, _options, callback) => {
      binaries.push(binary);
      if (args[0] === 'auth') callback(null, AUTH_OK, '');
      else callback(null, QUOTA_OK, '');
    }
  }, async base => {
    const result = await getJson(base, '/api/health');
    assert.equal(result.body.ok, true);
    assert.deepEqual(binaries, ['/usr/local/bin/zhihu-cli', '/usr/local/bin/zhihu-cli']);
  });
});

test('allowed cross-origin API requests receive explicit CORS headers', async () => {
  await withServer({allowedOrigins: ['https://rucheck.github.io']}, async base => {
    const result = await getJson(base, '/api/chapter/00000000-0000-4000-8000-000000000000', {
      headers: {Origin: 'https://rucheck.github.io'}
    });
    assert.equal(result.status, 404);
    assert.equal(result.headers.get('access-control-allow-origin'), 'https://rucheck.github.io');
    assert.equal(result.headers.get('vary'), 'Origin');
    assert.equal(result.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
    assert.equal(result.headers.get('access-control-allow-headers'), 'Content-Type');
  });
});

test('disallowed cross-origin API requests are rejected without CORS authorization', async () => {
  await withServer({allowedOrigins: ['https://rucheck.github.io']}, async base => {
    const result = await getJson(base, '/api/health', {headers: {Origin: 'https://attacker.example'}});
    assert.equal(result.status, 403);
    assert.equal(result.body.error, 'ORIGIN_REJECTED');
    assert.equal(result.headers.get('access-control-allow-origin'), null);
  });
});

test('allowed OPTIONS preflight returns 204 with CORS headers', async () => {
  await withServer({allowedOrigins: ['https://rucheck.github.io']}, async base => {
    const response = await fetch(`${base}/api/chapter`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://rucheck.github.io',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://rucheck.github.io');
    assert.equal(response.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
    assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type');
  });
});

test('GET /api/health reports a ready server without running generation', async () => {
  const calls = [];
  await withServer({
    execFile: mockExec({
      'auth status': (args, callback) => { calls.push(args); callback(null, AUTH_OK, ''); },
      'quota --api-id': (args, callback) => { calls.push(args); callback(null, QUOTA_OK, ''); }
    })
  }, async base => {
    const result = await getJson(base, '/api/health');
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.deepEqual(result.body.server, {ok: true});
    assert.deepEqual(result.body.cli, {installed: true, callable: true});
    assert.equal(result.body.authentication.configured, true);
    assert.equal(result.body.authentication.valid, true);
    assert.equal(result.body.mode, 'zhihu');
    assert.equal(result.body.usage.source, 'zhihu-cli');
    assert.equal(result.body.usage.remaining, 96);
    assert.equal(calls.some(args => args[0] === 'answer'), false);
  });
});

test('formal frontend chapter payload accepts the narrative protagonist secret', async () => {
  await withServer({
    fetch: async () => ({ok: true, json: async () => []}),
    execFile: mockExec({
      'auth status': AUTH_OK,
      'quota --api-id': QUOTA_OK,
      'answer --query': GENERATED_PLAN
    })
  }, async base => {
    const result = await getJson(base, '/api/chapter', chapterRequest(FRONTEND_CHAPTER_PAYLOAD));
    assert.equal(result.status, 202);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.status, 'pending');
    assert.equal(typeof result.body.jobId, 'string');
  });
});

test('secret fields outside the narrative protagonist path remain rejected', async () => {
  const payload = {...FRONTEND_CHAPTER_PAYLOAD, secret: 'test-only-not-a-real-credential'};
  await withServer({execFile: mockExec({})}, async base => {
    const result = await getJson(base, '/api/chapter', chapterRequest(payload));
    assert.equal(result.status, 400);
    assert.equal(result.body.error, 'INVALID_REQUEST');
  });
});

test('missing CLI is a degraded health result and a standardized API error', async () => {
  await withServer({existsSync: () => false, execFile: mockExec({})}, async base => {
    const health = await getJson(base, '/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.ok, false);
    assert.equal(health.body.cli.installed, false);
    assert.equal(health.body.usage, null);
    assert.equal(health.body.diagnostic.error, 'CLI_NOT_FOUND');

    const chapter = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(chapter.status, 503);
    assert.equal(chapter.body.ok, false);
    assert.equal(chapter.body.error, 'CLI_NOT_FOUND');
  });
});

test('unconfigured authentication returns ZHIHU_AUTH_REQUIRED', async () => {
  const authMissing = JSON.stringify({ok: true, environment_set: false, keychain: 'not_found', verification: 'not_performed'});
  await withServer({execFile: mockExec({'auth status': authMissing})}, async base => {
    const chapter = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(chapter.status, 401);
    assert.equal(chapter.body.error, 'ZHIHU_AUTH_REQUIRED');
  });
});

test('invalid authentication is distinguished from missing authentication', async () => {
  const authInvalid = JSON.stringify({ok: true, environment_set: true, keychain: 'not_found', verification: 'invalid'});
  await withServer({execFile: mockExec({'auth status': authInvalid})}, async base => {
    const chapter = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(chapter.status, 401);
    assert.equal(chapter.body.error, 'ZHIHU_AUTH_INVALID');
  });
});

test('CLI timeout is converted to ZHIHU_TIMEOUT', async () => {
  const timeout = Object.assign(new Error('private machine path'), {killed: true, signal: 'SIGTERM'});
  await withServer({execFile: mockExec({'auth status': AUTH_OK, 'quota --api-id': timeout})}, async base => {
    const chapter = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(chapter.status, 504);
    assert.equal(chapter.body.error, 'ZHIHU_TIMEOUT');
    assert.equal(JSON.stringify(chapter.body).includes('private machine path'), false);
  });
});

test('CLI network failure is converted to ZHIHU_NETWORK_ERROR', async () => {
  const network = Object.assign(new Error('network'), {code: 5});
  await withServer({execFile: mockExec({'auth status': AUTH_OK, 'quota --api-id': network})}, async base => {
    const chapter = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(chapter.status, 502);
    assert.equal(chapter.body.error, 'ZHIHU_NETWORK_ERROR');
  });
});

test('exhausted quota is reported without starting a generation task', async () => {
  const emptyQuota = JSON.stringify({Data: [{APIID: 'zhida_openai', TotalQuota: 100, TotalUsed: 100, RemainingQuota: 0}]});
  await withServer({execFile: mockExec({'auth status': AUTH_OK, 'quota --api-id': emptyQuota})}, async base => {
    const chapter = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(chapter.status, 429);
    assert.equal(chapter.body.error, 'ZHIHU_QUOTA_EXHAUSTED');
  });
});

test('invalid CLI JSON is returned as a safe structured error', async () => {
  await withServer({execFile: mockExec({'auth status': '<not-json>'})}, async base => {
    const chapter = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(chapter.status, 502);
    assert.equal(chapter.body.error, 'ZHIHU_INVALID_JSON');
    assert.deepEqual(Object.keys(chapter.body).sort(), ['error', 'message', 'ok']);
  });
});

test('valid JSON with missing quota fields is ZHIHU_INVALID_RESPONSE', async () => {
  await withServer({execFile: mockExec({'auth status': AUTH_OK, 'quota --api-id': '{"Data":[]}'})}, async base => {
    const chapter = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(chapter.status, 502);
    assert.equal(chapter.body.error, 'ZHIHU_INVALID_RESPONSE');
  });
});

test('invalid generation output is stored as a safe task error', async () => {
  let quotaCalls = 0;
  await withServer({
    fetch: async () => ({ok: true, json: async () => []}),
    execFile: mockExec({
      'auth status': AUTH_OK,
      'quota --api-id': (_args, callback) => { quotaCalls += 1; callback(null, QUOTA_OK, ''); },
      'answer --query': '<not-json>'
    })
  }, async base => {
    const accepted = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(accepted.status, 202);
    assert.equal(typeof accepted.body.jobId, 'string');

    let result;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      result = await getJson(base, `/api/chapter/${accepted.body.jobId}`);
      if (result.status !== 202) break;
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    assert.equal(result.status, 502);
    assert.equal(result.body.error, 'ZHIHU_INVALID_JSON');
    assert.equal(quotaCalls, 1);
  });
});

test('unknown generation task returns GENERATION_JOB_NOT_FOUND', async () => {
  await withServer({execFile: mockExec({})}, async base => {
    const result = await getJson(base, '/api/chapter/00000000-0000-4000-8000-000000000000');
    assert.equal(result.status, 404);
    assert.deepEqual(result.body, {
      ok: false,
      error: 'GENERATION_JOB_NOT_FOUND',
      message: '生成任务不存在、已过期，或因服务重启而丢失。'
    });
  });
});

test('GET /api/status keeps compatibility fields and adds diagnostics', async () => {
  const calls = [];
  await withServer({execFile: mockExec({
    'auth status': (args, callback) => { calls.push(args); callback(null, AUTH_OK, ''); },
    'quota --api-id': (args, callback) => { calls.push(args); callback(null, QUOTA_OK, ''); }
  })}, async base => {
    const health = await getJson(base, '/api/health');
    assert.equal(health.body.ok, true);
    const result = await getJson(base, '/api/status');
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.equal(result.body.mode, 'zhihu');
    assert.equal(result.body.cliInstalled, true);
    assert.equal(result.body.authentication.valid, true);
    assert.equal(calls.length, 2);
  });
});

test('API responses never expose CLI error details or runtime secrets', async () => {
  const marker = 'test-only-sensitive-marker';
  const failure = Object.assign(new Error(`Bearer ${marker}`), {
    killed: true,
    signal: 'SIGTERM',
    stderr: JSON.stringify({message: `ZHIHU_ACCESS_SECRET=${marker}`})
  });
  await withServer({execFile: mockExec({'auth status': AUTH_OK, 'quota --api-id': failure})}, async base => {
    const chapter = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(chapter.status, 504);
    assert.equal(chapter.body.error, 'ZHIHU_TIMEOUT');
    assert.equal(JSON.stringify(chapter.body).includes(marker), false);
    assert.equal(JSON.stringify(chapter.body).includes('ZHIHU_ACCESS_SECRET'), false);
  });
});

test('backend stops accepting new generation jobs during shutdown', async () => {
  await withServer({execFile: mockExec({})}, async (base, backend) => {
    assert.equal(backend.beginShutdown(), true);
    assert.equal(backend.beginShutdown(), false);
    const result = await getJson(base, '/api/chapter', validChapterRequest);
    assert.equal(result.status, 503);
    assert.equal(result.body.error, 'SERVER_SHUTTING_DOWN');
  });
});

test('shutdown terminates an active CLI child process', async () => {
  let finish;
  let killedWith = null;
  const child = {kill: signal => { killedWith = signal; }};
  const backend = createBackend({
    cliPath: 'mock-zhihu-cli',
    existsSync: () => true,
    execFile: (_binary, _args, _options, callback) => {
      finish = callback;
      return child;
    }
  });
  const healthPromise = backend.health();
  await new Promise(resolve => setImmediate(resolve));

  backend.beginShutdown();
  assert.equal(killedWith, 'SIGTERM');
  finish(Object.assign(new Error('terminated'), {killed: true, signal: 'SIGTERM'}), '', '');
  const health = await healthPromise;
  assert.equal(health.ok, false);
  assert.equal(health.diagnostic.error, 'ZHIHU_TIMEOUT');
});

test('SIGTERM and SIGINT initiate graceful service shutdown once', () => {
  for (const signal of ['SIGTERM', 'SIGINT']) {
    const signalSource = new EventEmitter();
    const events = [];
    const backend = {beginShutdown: () => events.push('backend')};
    const server = {close: callback => { events.push('server'); callback(); }};
    const logger = {
      log: message => events.push(message),
      error: message => events.push(message)
    };
    const service = createService({backend, server, logger, onClosed: error => events.push(error)});
    const uninstall = installSignalHandlers(service, signalSource);

    signalSource.emit(signal);
    signalSource.emit(signal);
    assert.equal(service.stopping, true);
    assert.deepEqual(events, [`收到 ${signal}，服务正在关闭。`, 'backend', 'server', null]);
    uninstall();
  }
});

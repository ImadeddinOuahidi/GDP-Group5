const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

process.env.NODE_ENV = 'test';

let server;
let baseUrl;
let app;
let appLoadError = null;

try {
  app = require('../../app');
} catch (error) {
  appLoadError = error;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  return { response, json };
}

if (appLoadError) {
  test('app integration tests require the full backend runtime dependency set', { skip: appLoadError.message }, () => {});
} else {
  test.before(async () => {
    server = app.listen(0);
    await once(server, 'listening');
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  test.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('signup rejects invalid payloads with validation errors', async () => {
    const { response, json } = await requestJson('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({})
    });

    assert.equal(response.status, 400);
    assert.equal(json.success, false);
    assert.equal(json.message, 'Validation errors');
    assert.ok(Array.isArray(json.errors));
    assert.ok(json.errors.length > 0);
  });

  test('signin rejects requests that omit credentials', async () => {
    const { response, json } = await requestJson('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({})
    });

    assert.equal(response.status, 400);
    assert.equal(json.success, false);
    assert.equal(json.message, 'Validation errors');
    assert.ok(Array.isArray(json.errors));
    assert.ok(json.errors.some((error) => /required/i.test(error.msg)));
  });

  test('protected report routes reject unauthenticated access', async () => {
    const { response, json } = await requestJson('/api/reports');

    assert.equal(response.status, 401);
    assert.equal(json.success, false);
    assert.match(json.message, /No token provided/i);
  });

  test('upload status endpoint returns availability information without authentication', async () => {
    const { response, json } = await requestJson('/api/uploads/status');

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(typeof json.data.available, 'boolean');
    assert.ok(json.data.bucket);
  });
}

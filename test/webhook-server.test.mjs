import assert from 'node:assert/strict';
import test from 'node:test';

import { WebhookServer } from '../dist/webhook-server.js';

const TOKEN = 'a-secure-test-token';

test('can stop before it has started', async () => {
  const server = new WebhookServer({
    bindAddress: '127.0.0.1',
    port: 0,
    token: TOKEN,
    onTrigger: () => false,
  });
  await server.stop();
});

async function withServer(onTrigger, run) {
  const server = new WebhookServer({
    bindAddress: '127.0.0.1',
    port: 0,
    token: TOKEN,
    onTrigger,
  });
  await server.start();
  const address = server.address();
  assert.ok(address);
  const port = Number(address.split(':').at(-1));
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await server.stop();
  }
}

test('reports health without authentication', async () => {
  await withServer(() => false, async baseUrl => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });
});

test('accepts an authenticated known sensor', async () => {
  let triggered;
  await withServer(id => {
    triggered = id;
    return id === 'product-stock';
  }, async baseUrl => {
    const response = await fetch(`${baseUrl}/webhook/product-stock`, {
      method: 'POST',
      headers: { 'x-changedetection-token': TOKEN },
      body: '{}',
    });
    assert.equal(response.status, 202);
    assert.equal(triggered, 'product-stock');
  });
});

test('rejects missing credentials and unknown sensors', async () => {
  await withServer(() => false, async baseUrl => {
    const unauthorized = await fetch(`${baseUrl}/webhook/known`, { method: 'POST' });
    assert.equal(unauthorized.status, 401);

    const unknown = await fetch(`${baseUrl}/webhook/unknown`, {
      method: 'POST',
      headers: { 'x-changedetection-token': TOKEN },
    });
    assert.equal(unknown.status, 404);
  });
});

test('contains trigger failures without terminating the server', async () => {
  await withServer(() => {
    throw new Error('simulated HomeKit failure');
  }, async baseUrl => {
    const response = await fetch(`${baseUrl}/webhook/known`, {
      method: 'POST',
      headers: { 'x-changedetection-token': TOKEN },
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'trigger_failed' });

    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
  });
});

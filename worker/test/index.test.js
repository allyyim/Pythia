import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../index.js';

const origin = 'https://allyyim.github.io';
const env = {
  ALLOWED_ORIGIN: origin,
  FOUNDRY_ENDPOINT: 'https://example.openai.azure.com/',
  FOUNDRY_DEPLOYMENT: 'gpt-4o-mini',
  FOUNDRY_API_KEY: 'test-key',
  RECOMMENDATION_LIMITER: { limit: async () => ({ success: true }) },
};
const request = (body, options = {}) => new Request('https://pythia.workers.dev/api/recommendations', {
  method: options.method ?? 'POST',
  headers: { origin, 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.9', ...(options.headers ?? {}) },
  body,
});

test('handles CORS preflight and rejects other browser origins', async () => {
  const preflight = await handleRequest(request(null, { method: 'OPTIONS' }), env);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  assert.equal(preflight.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
  const denied = await handleRequest(request(JSON.stringify({}), { headers: { origin: 'https://attacker.example' } }), env);
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});

test('rejects wrong methods, invalid JSON and oversized bodies', async () => {
  const method = await handleRequest(request(null, { method: 'GET' }), env);
  assert.equal(method.status, 405);
  const malformed = await handleRequest(request('{'), env);
  assert.equal(malformed.status, 400);
  const oversized = await handleRequest(request('x'.repeat(8193)), env);
  assert.equal(oversized.status, 413);
});

test('requires an API key and rate limiter rather than returning fallback recommendations', async () => {
  const missingKey = await handleRequest(request(JSON.stringify({ mode: 'vibes', value: 'Coastal mystery' })), { ...env, FOUNDRY_API_KEY: '' });
  assert.equal(missingKey.status, 503);
  const missingLimit = await handleRequest(request(JSON.stringify({ mode: 'vibes', value: 'Coastal mystery' })), { ...env, RECOMMENDATION_LIMITER: undefined });
  assert.equal(missingLimit.status, 503);
});

test('rate limits requests before calling catalogs or Foundry', async () => {
  let fetchCalls = 0;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { fetchCalls++; throw new Error('Should not fetch'); };
  try {
    const limited = await handleRequest(request(JSON.stringify({ mode: 'genre', value: 'Gothic fiction' })), {
      ...env,
      RECOMMENDATION_LIMITER: { limit: async ({ key }) => { assert.equal(key, '203.0.113.9'); return { success: false }; } },
    });
    assert.equal(limited.status, 429);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('authenticates with Microsoft Entra when Azure resource keys are disabled', async () => {
  const calls = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('login.microsoftonline.com')) {
      const form = new URLSearchParams(options.body);
      assert.equal(form.get('client_id'), '11111111-1111-1111-1111-111111111111');
      assert.equal(form.get('scope'), 'https://cognitiveservices.azure.com/.default');
      assert.equal(form.get('grant_type'), 'client_credentials');
      return Response.json({ access_token: 'mock-entra-token' });
    }
    if (String(url).includes('chat/completions')) {
      assert.equal(options.headers.Authorization, 'Bearer mock-entra-token');
      assert.equal(options.headers['api-key'], undefined);
      const name = JSON.parse(options.body).response_format.json_schema.name;
      const output = name === 'catalog_plan'
        ? { queries: ['forest mystery', 'family secrets', 'quiet suspense'] }
        : { picks: Array.from({ length: 5 }, (_, index) => ({ id: `c${index + 1}`, reason: 'Its catalog themes match the quiet mystery and close family relationships you requested.' })) };
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) } }] });
    }
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.headers['api-key'], undefined);
    return Response.json({ docs: Array.from({ length: 8 }, (_, index) => ({ key: `/works/OL${index + 1}W`, title: `Dynamic title ${index + 1}`, author_name: [`Author ${index + 1}`] })) });
  };
  try {
    const response = await handleRequest(request(JSON.stringify({ mode: 'vibes', value: 'Quiet mystery about family secrets' })), {
      ...env,
      FOUNDRY_API_KEY: 'stale-key-is-ignored',
      FOUNDRY_TENANT_ID: 'contoso.onmicrosoft.com',
      FOUNDRY_CLIENT_ID: '11111111-1111-1111-1111-111111111111',
      FOUNDRY_CLIENT_SECRET: 'test-only-client-secret',
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.recommendations.length, 5);
    assert.equal(calls.filter((call) => call.url.includes('login.microsoftonline.com')).length, 1);
    assert.equal(calls.filter((call) => call.url.includes('chat/completions')).length, 2);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('returns AI selections from live catalog data without forwarding secrets to catalog requests', async () => {
  const calls = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('chat/completions')) {
      const name = JSON.parse(options.body).response_format.json_schema.name;
      const output = name === 'catalog_plan'
        ? { queries: ['coastal fiction', 'ocean friendships', 'seaside suspense'] }
        : { picks: Array.from({ length: 5 }, (_, index) => ({ id: `c${index + 1}`, reason: 'Its catalog themes match the atmospheric coastal reading mood you described.' })) };
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) } }] });
    }
    assert.equal(options.headers['api-key'], undefined);
    const query = new URL(String(url)).searchParams.get('q');
    return Response.json({ docs: Array.from({ length: 8 }, (_, index) => ({ key: `/works/OL${index + 1}W`, title: `${query} Book ${index + 1}`, author_name: [`Author ${index + 1}`], subject: ['Coastal fiction'] })) });
  };
  try {
    const response = await handleRequest(request(JSON.stringify({ mode: 'vibes', value: 'Atmospheric coastal friendships and mystery' })), env);
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(result.recommendations.length, 5);
    assert.equal(calls.filter((call) => call.url.includes('chat/completions')).length, 2);
    assert.equal(calls.filter((call) => call.url.includes('openlibrary')).length, 3);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

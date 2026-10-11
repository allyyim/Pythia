import test from 'node:test';
import assert from 'node:assert/strict';
import functions from '@azure/functions';
import { handleRecommendations } from '../src/functions.js';

const { HttpRequest } = functions;
const request = (body, headers = {}) => new HttpRequest({ method: 'POST', url: 'http://localhost:7071/api/recommendations', headers: { 'content-type': 'application/json', ...headers }, body: { string: body } });
const context = { error() {} };

test('HTTP boundary rejects invalid content types, JSON, input, and declared/streamed oversized bodies', async () => {
  const cases = [
    [request('{}', { 'content-type': 'text/plain' }), 415, 'INVALID_CONTENT_TYPE'],
    [request('{}', { 'content-type': 'application/jsonfake' }), 415, 'INVALID_CONTENT_TYPE'],
    [request('{'), 400, 'INVALID_JSON'],
    [request('{}'), 400, 'INVALID_INPUT'],
    [request('{}', { 'content-length': '8193' }), 413, 'INPUT_TOO_LARGE'],
    [request('x'.repeat(8193)), 413, 'INPUT_TOO_LARGE'],
  ];
  for (const [input, status, errorCode] of cases) {
    const response = await handleRecommendations(input, context);
    assert.equal(response.status, status);
    assert.equal(response.jsonBody.error.code, errorCode);
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.equal(response.headers['Access-Control-Allow-Origin'], undefined, 'CORS must be managed by host/gateway');
  }
});

test('HTTP missing configuration is an explicit 503, not curated success', async (t) => {
  const previous = process.env.FOUNDRY_ENDPOINT;
  delete process.env.FOUNDRY_ENDPOINT;
  t.after(() => { if (previous === undefined) delete process.env.FOUNDRY_ENDPOINT; else process.env.FOUNDRY_ENDPOINT = previous; });
  const response = await handleRecommendations(request(JSON.stringify({ mode: 'genre', value: 'Gothic fiction' })), context);
  assert.equal(response.status, 503);
  assert.equal(response.jsonBody.error.code, 'NOT_CONFIGURED');
});

test('HTTP configured flow returns only model-selected live catalog books and personalized reasons', async (t) => {
  const keys = ['FOUNDRY_ENDPOINT', 'FOUNDRY_DEPLOYMENT', 'FOUNDRY_API_KEY', 'GOOGLE_BOOKS_API_KEY'];
  const previous = keys.map((key) => process.env[key]);
  const previousFetch = globalThis.fetch;
  t.after(() => {
    keys.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; });
    globalThis.fetch = previousFetch;
  });
  process.env.FOUNDRY_ENDPOINT = 'https://test.openai.azure.com/';
  process.env.FOUNDRY_DEPLOYMENT = 'gpt-4o';
  process.env.FOUNDRY_API_KEY = 'backend-test-key';
  delete process.env.GOOGLE_BOOKS_API_KEY;
  let modelCalls = 0;
  globalThis.fetch = async (url, options) => {
    if (url.includes('chat/completions')) {
      modelCalls++;
      const name = JSON.parse(options.body).response_format.json_schema.name;
      const content = name === 'catalog_plan' ? { queries: ['ocean fiction', 'seaside friendships', 'coastal mystery'] } : { picks: Array.from({ length: 5 }, (_, index) => ({ id: `c${index + 1}`, reason: 'Its catalog subjects match the coastal atmosphere you requested.' })) };
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(content) } }] });
    }
    return Response.json({ docs: Array.from({ length: 6 }, (_, index) => ({ key: `/works/OL${index + 1}W`, title: `Dynamic book ${index + 1}`, author_name: ['Catalog author'], subject: ['Coastal fiction'] })) });
  };
  const response = await handleRecommendations(request(JSON.stringify({ mode: 'vibes', value: 'Coastal friendships and mystery' }), { 'content-type': 'application/json; charset=utf-8' }), context);
  assert.equal(response.status, 200);
  assert.equal(modelCalls, 2);
  assert.equal(response.jsonBody.recommendations.length, 5);
  assert.equal(response.jsonBody.recommendations[0].title, 'Dynamic book 1');
  assert.match(response.jsonBody.recommendations[0].reason, /coastal atmosphere/);
});

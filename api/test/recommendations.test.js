import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, fetchJson, loadConfig, normalizeCatalog, recommend, validatePlan, validateRequest, validateSelection } from '../src/recommendations.js';

const config = { endpoint: 'https://example.openai.azure.com', deployment: 'gpt-4o', apiKey: 'server-only-key', catalogAgent: 'Pythia tests' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const docs = (prefix = 'Live') => Array.from({ length: 8 }, (_, index) => ({ key: `/works/OL${index + 1}W`, title: `${prefix} Book ${index + 1}`, author_name: [`Author ${index + 1}`], subject: ['Fiction', prefix], first_sentence: ['A catalog description.'] }));
const picks = () => ({ picks: Array.from({ length: 5 }, (_, index) => ({ id: `c${index + 1}`, reason: 'This catalog book matches your requested tone and themes.' })) });
const candidates = docs().map((doc, index) => ({ id: `c${index + 1}`, title: doc.title, author: doc.author_name[0], source: 'openlibrary' }));
const code = (expected) => (error) => error instanceof ApiError && error.code === expected;

function dynamicFetch(prefix, overrides = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('chat/completions')) {
      const body = JSON.parse(options.body);
      const name = body.response_format.json_schema.name;
      const result = name === 'catalog_plan' ? { queries: [`${prefix} fiction`, `${prefix} friendships`, `${prefix} atmosphere`] } : picks();
      assert.equal(body.response_format.json_schema.strict, true);
      assert.doesNotMatch(JSON.stringify(body.response_format.json_schema.schema), /"(?:minItems|maxItems|uniqueItems)"/);
      assert.equal(options.headers['api-key'], config.apiKey);
      return json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(overrides[name] ?? result) } }] });
    }
    assert.equal(options.headers['api-key'], undefined);
    if (overrides.catalogStatus) return json({}, overrides.catalogStatus);
    if (overrides.partial && url.includes('friendships')) return json({}, 503);
    if (url.includes('googleapis')) return json({ items: [{ id: 'google1', volumeInfo: { title: `${prefix} Google Book`, authors: ['Google Author'], description: 'Catalog description' } }] });
    return json({ docs: overrides.empty ? [] : docs(prefix) });
  };
  return { calls, fetchImpl };
}

test('validates all modes and rejects malformed, unknown and oversized input', () => {
  for (const mode of ['title', 'genre', 'vibes']) assert.deepEqual(validateRequest({ mode, value: '  Good books  ' }), { mode, value: 'Good books', vibe: '' });
  for (const body of [null, [], {}, { mode: 'other', value: 'abc' }, { mode: 'title', value: 'a' }, { mode: 'genre', value: 'a'.repeat(601) }, { mode: 'vibes', value: 'abc', vibe: 'a'.repeat(1001) }, { mode: 'title', value: 'abc', apiKey: 'bad' }, { mode: 'title', value: 123 }, { mode: 'title', value: 'ab\u0000' }]) assert.throws(() => validateRequest(body), code('INVALID_INPUT'));
});

test('requires secure Foundry deployment configuration', () => {
  assert.equal(loadConfig({ FOUNDRY_ENDPOINT: config.endpoint, FOUNDRY_DEPLOYMENT: 'gpt-4o' }).endpoint, config.endpoint);
  for (const endpoint of ['http://example.openai.azure.com', 'https://evil.example', 'https://example.openai.azure.com/projects/test', 'https://example.openai.azure.com?key=secret']) assert.throws(() => loadConfig({ FOUNDRY_ENDPOINT: endpoint, FOUNDRY_DEPLOYMENT: 'gpt-4o' }), code('NOT_CONFIGURED'));
  assert.throws(() => loadConfig({}), code('NOT_CONFIGURED'));
});

test('normalizes real catalog records and excludes missing authors/invalid source IDs', () => {
  const normalized = normalizeCatalog({ docs: [...docs(), { title: 'Unknown', key: '/works/OL99W' }, { title: 'Bad ID', author_name: ['A'], key: 'javascript:bad' }] }, 'openlibrary');
  assert.equal(normalized.length, 8);
  assert.equal(normalized[0].sourceUrl, 'https://openlibrary.org/works/OL1W');
  const google = normalizeCatalog({ items: [{ id: 'abc-123', volumeInfo: { title: 'A real title', authors: ['Author'], description: '<p>Actual summary</p>', categories: ['Fiction'] } }] }, 'googlebooks');
  assert.equal(google[0].description, 'Actual summary');
  assert.equal(google[0].sourceUrl, 'https://books.google.com/books?id=abc-123');
  assert.throws(() => normalizeCatalog({}, 'openlibrary'), code('INVALID_CATALOG'));
});

test('validates planned query bounds, uniqueness and schema', () => {
  assert.equal(validatePlan({ queries: ['fantasy', 'magic schools', 'friendship'] }).length, 3);
  for (const plan of [{ queries: ['a', 'b', 'c'] }, { queries: ['fantasy', 'Fantasy', 'magic'] }, { queries: ['fantasy'] }, { queries: ['fantasy', 'magic', 'a'.repeat(161)] }, { queries: ['fantasy', 'magic', 'books'], extra: true }]) assert.throws(() => validatePlan(plan), code('INVALID_AI_OUTPUT'));
});

test('resolves AI IDs to catalog titles; rejects invented IDs, duplicates and invalid reasons/count', () => {
  assert.equal(validateSelection(picks(), candidates)[0].title, 'Live Book 1');
  for (const change of [(p) => { p.picks[0].id = 'invented'; }, (p) => { p.picks[1].id = 'c1'; }, (p) => { p.picks.pop(); }, (p) => { p.picks[0].reason = 'short'; }, (p) => { p.picks[0].reason = 'x'.repeat(801); }, (p) => { p.picks[0].title = 'Invented title'; }]) {
    const value = picks(); change(value);
    assert.throws(() => validateSelection(value, candidates), code('INVALID_AI_OUTPUT'));
  }
});

for (const mode of ['title', 'genre', 'vibes']) {
  test(`${mode} uses structured Foundry planning and selection with live, deduplicated candidates`, async () => {
    const mock = dynamicFetch(mode);
    const response = await recommend({ mode, value: mode === 'title' ? `${mode} Book 1 by Author 1` : 'Specific reader request', vibe: 'Gentle friendships' }, { config, fetchImpl: mock.fetchImpl });
    assert.equal(response.recommendations.length, 5);
    assert.equal(new Set(response.recommendations.map((book) => book.title)).size, 5);
    assert.match(response.source, /Azure AI Foundry/);
    assert.equal(mock.calls.filter((call) => call.url.includes('chat/completions')).length, 2);
    assert.equal(mock.calls.filter((call) => call.url.includes('openlibrary')).length, mode === 'title' ? 4 : 3);
    const selection = JSON.parse(mock.calls.filter((call) => call.url.includes('chat/completions'))[1].options.body);
    const data = JSON.parse(selection.messages[1].content);
    assert.equal(data.candidates.length, mode === 'title' ? 7 : 8);
    assert.deepEqual(selection.response_format.json_schema.schema.properties.picks.items.properties.id.enum, data.candidates.map((candidate) => candidate.id));
    if (mode === 'title') {
      assert.ok(response.recommendations.every((book) => book.title !== 'title Book 1'));
      const seedUrl = new URL(mock.calls[0].url);
      assert.equal(seedUrl.searchParams.get('title'), 'title Book 1');
      assert.equal(seedUrl.searchParams.get('author'), 'Author 1');
    }
  });
}

test('different dynamic catalog data produces different recommendations, with no local picks', async () => {
  const run = async (prefix) => recommend({ mode: 'vibes', value: prefix }, { config, fetchImpl: dynamicFetch(prefix).fetchImpl });
  assert.notDeepEqual((await run('Ocean')).recommendations, (await run('Space')).recommendations);
});

test('optional Google Books participates without exposing Foundry credentials', async () => {
  const mock = dynamicFetch('Ocean');
  await recommend({ mode: 'genre', value: 'Ocean stories' }, { config: { ...config, googleKey: 'catalog-key' }, fetchImpl: mock.fetchImpl });
  assert.equal(mock.calls.filter((call) => call.url.includes('googleapis')).length, 3);
});

test('partial catalog failure is explicit; total failures and empty catalogs never return fallback success', async () => {
  const partial = await recommend({ mode: 'vibes', value: 'Ocean themes' }, { config, fetchImpl: dynamicFetch('Ocean', { partial: true }).fetchImpl });
  assert.equal(partial.warnings.length, 1);
  for (const [overrides, expected] of [[{ catalogStatus: 503 }, 'UPSTREAM_ERROR'], [{ catalogStatus: 429 }, 'UPSTREAM_ERROR'], [{ empty: true }, 'INSUFFICIENT_CANDIDATES'], [{ book_selection: { picks: [] } }, 'INVALID_AI_OUTPUT']]) {
    await assert.rejects(recommend({ mode: 'vibes', value: 'Ocean themes' }, { config, fetchImpl: dynamicFetch('Ocean', overrides).fetchImpl }), code(expected));
  }
});

test('supports identity tokens instead of API keys', async () => {
  let requestedToken = false;
  const mock = dynamicFetch('Ocean');
  const fetchImpl = (url, options) => {
    if (url.includes('chat/completions')) {
      assert.equal(options.headers.Authorization, 'Bearer identity-token');
      assert.equal(options.headers['api-key'], undefined);
      return mock.fetchImpl(url, { ...options, headers: { ...options.headers, 'api-key': config.apiKey } });
    }
    return mock.fetchImpl(url, options);
  };
  await recommend({ mode: 'vibes', value: 'Ocean themes' }, { config: { ...config, apiKey: undefined }, fetchImpl, getToken: async () => { requestedToken = true; return 'identity-token'; } });
  assert.ok(requestedToken);
});

test('upstream malformed JSON, excessive responses, refusal, and timeout are explicit errors', async () => {
  const signal = AbortSignal.timeout(10000);
  await assert.rejects(fetchJson('https://example.test', {}, async () => new Response('not JSON'), signal), code('UPSTREAM_ERROR'));
  await assert.rejects(fetchJson('https://example.test', {}, async () => new Response('x'.repeat(2_000_001)), signal), code('UPSTREAM_ERROR'));
  const aborted = AbortSignal.abort();
  await assert.rejects(fetchJson('https://example.test', {}, async () => { throw new Error('abort'); }, aborted), code('UPSTREAM_TIMEOUT'));
  await assert.rejects(recommend({ mode: 'vibes', value: 'Ocean themes' }, { config, fetchImpl: async () => json({ choices: [{ finish_reason: 'stop', message: { refusal: 'Refused' } }] }) }), code('INVALID_AI_OUTPUT'));
});

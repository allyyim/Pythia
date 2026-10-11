import { ApiError, loadConfig, recommend, validateRequest } from '../api/src/recommendations.js';

const MAX_BODY_BYTES = 8192;
const API_PATH = '/api/recommendations';

function headersFor(origin, env) {
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };
  if (origin && origin === env.ALLOWED_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function jsonResponse(body, status, origin, env, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headersFor(origin, env), ...extraHeaders },
  });
}

async function fetchUpstream(url, options) {
  const hostname = new URL(url).hostname;
  try {
    const response = await fetch(url, options);
    if (!response.ok) console.error('Recommendation upstream response error:', hostname, response.status);
    return response;
  } catch (error) {
    console.error('Recommendation upstream network error:', hostname, error instanceof Error ? error.name : 'UNKNOWN');
    throw error;
  }
}

async function requestEntraToken(env, signal) {
  if (!/^[a-zA-Z0-9.-]{1,200}$/.test(env.FOUNDRY_TENANT_ID ?? '') || !/^[0-9a-f-]{36}$/i.test(env.FOUNDRY_CLIENT_ID ?? '') || !env.FOUNDRY_CLIENT_SECRET) {
    throw new ApiError(503, 'AI_AUTH_UNAVAILABLE', 'Microsoft Entra authentication is not configured. Set the tenant ID, application client ID, and client secret as Worker secrets.');
  }
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(env.FOUNDRY_TENANT_ID)}/oauth2/v2.0/token`;
  let response;
  try {
    response = await fetchUpstream(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.FOUNDRY_CLIENT_ID,
        client_secret: env.FOUNDRY_CLIENT_SECRET,
        scope: 'https://cognitiveservices.azure.com/.default',
        grant_type: 'client_credentials',
      }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    });
  } catch {
    throw new ApiError(503, 'AI_AUTH_UNAVAILABLE', 'Could not reach Microsoft Entra to authenticate with Azure OpenAI.');
  }
  if (!response.ok) {
    throw new ApiError(503, 'AI_AUTH_UNAVAILABLE', 'Microsoft Entra rejected the service-principal credentials. Check the tenant, application ID, and client secret in Worker secrets.');
  }
  let payload;
  try { payload = await response.json(); } catch {
    throw new ApiError(503, 'AI_AUTH_UNAVAILABLE', 'Microsoft Entra returned an invalid authentication response.');
  }
  if (typeof payload?.access_token !== 'string' || !payload.access_token) {
    throw new ApiError(503, 'AI_AUTH_UNAVAILABLE', 'Microsoft Entra did not issue an Azure OpenAI access token.');
  }
  return payload.access_token;
}

async function readJson(request, signal) {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
    throw new ApiError(413, 'INPUT_TOO_LARGE', 'Request body must not exceed 8 KB.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'INVALID_INPUT', 'A JSON request body is required.');
  const chunks = [];
  let size = 0;
  const abort = () => { void reader.cancel(); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        throw new ApiError(413, 'INPUT_TOO_LARGE', 'Request body must not exceed 8 KB.');
      }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel();
  }
  if (signal.aborted) throw new ApiError(408, 'REQUEST_TIMEOUT', 'Request body timed out.');
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
  }
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (url.pathname !== API_PATH) {
    return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Not found.' } }, 404, origin, env);
  }
  if (!env.ALLOWED_ORIGIN) {
    return jsonResponse({ error: { code: 'NOT_CONFIGURED', message: 'The recommendation service is not configured.' } }, 503, origin, env);
  }
  if (origin && origin !== env.ALLOWED_ORIGIN) {
    return jsonResponse({ error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This site is not allowed to use the recommendation service.' } }, 403, origin, env);
  }
  const headers = headersFor(origin, env);
  if (request.method === 'OPTIONS') {
    if (origin !== env.ALLOWED_ORIGIN) {
      return jsonResponse({ error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This site is not allowed to use the recommendation service.' } }, 403, origin, env);
    }
    return new Response(null, {
      status: 204,
      headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' },
    });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for recommendations.' } }, 405, origin, env, { Allow: 'POST, OPTIONS' });
  }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return jsonResponse({ error: { code: 'INVALID_CONTENT_TYPE', message: 'Send an application/json request.' } }, 415, origin, env);
  }

  const signal = AbortSignal.timeout(75000);
  try {
    const body = await readJson(request, signal);
    validateRequest(body);
    if (!env.RECOMMENDATION_LIMITER) {
      throw new ApiError(503, 'NOT_CONFIGURED', 'The recommendation service is not configured.');
    }
    const { success } = await env.RECOMMENDATION_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' });
    if (!success) throw new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again in a minute.');
    const config = loadConfig(env);
    const hasServicePrincipal = Boolean(config.tenantId && config.clientId && config.clientSecret);
    if (!config.apiKey && !hasServicePrincipal) {
      throw new ApiError(503, 'NOT_CONFIGURED', 'Configure Microsoft Entra service-principal credentials or a Foundry API key as Worker secrets.');
    }
    let tokenPromise;
    const getToken = (abortSignal) => tokenPromise ??= requestEntraToken(env, abortSignal);
    const authenticatedConfig = hasServicePrincipal ? { ...config, apiKey: undefined } : config;
    const result = await recommend(body, { config: authenticatedConfig, signal, fetchImpl: fetchUpstream, getToken });
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    const known = error instanceof ApiError;
    console.error('Recommendation request failed:', known ? error.code : 'INTERNAL_ERROR');
    return jsonResponse({ error: { code: known ? error.code : 'INTERNAL_ERROR', message: known ? error.message : 'The recommendation service encountered an unexpected error.' } }, known ? error.status : 500, origin, env);
  }
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};

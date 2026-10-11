import functions from '@azure/functions';
import { DefaultAzureCredential } from '@azure/identity';
import { ApiError, loadConfig, recommend, validateRequest } from './recommendations.js';

const { app } = functions;
const credential = new DefaultAzureCredential();

export const handleRecommendations = async (request, context) => {
    const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
    try {
      if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        throw new ApiError(415, 'INVALID_CONTENT_TYPE', 'Send an application/json request.');
      }
      if (Number(request.headers.get('content-length')) > 8192) throw new ApiError(413, 'INPUT_TOO_LARGE', 'Request body must not exceed 8 KB.');
      const signal = AbortSignal.timeout(75000);
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
          if (size > 8192) throw new ApiError(413, 'INPUT_TOO_LARGE', 'Request body must not exceed 8 KB.');
          chunks.push(Buffer.from(value));
        }
      } finally {
        signal.removeEventListener('abort', abort);
        await reader.cancel();
      }
      if (signal.aborted) throw new ApiError(408, 'REQUEST_TIMEOUT', 'Request body timed out.');
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); }
      validateRequest(body);
      const result = await recommend(body, {
        config: loadConfig(), signal,
        getToken: async (abortSignal) => {
          try {
            const token = await credential.getToken('https://cognitiveservices.azure.com/.default', { abortSignal });
            if (!token?.token) throw new Error('Missing access token');
            return token.token;
          } catch {
            throw new ApiError(503, 'AI_AUTH_UNAVAILABLE', 'The AI service identity is not configured or available. Contact the site owner.');
          }
        },
      });
      return { status: 200, headers, jsonBody: result };
    } catch (error) {
      const known = error instanceof ApiError;
      // Never log prompts, upstream payloads, keys, or bearer tokens.
      context.error('Recommendation request failed', known ? error.code : 'INTERNAL_ERROR');
      return { status: known ? error.status : 500, headers, jsonBody: { error: { code: known ? error.code : 'INTERNAL_ERROR', message: known ? error.message : 'The recommendation service encountered an unexpected error.' } } };
    }
};

app.http('recommendations', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'recommendations',
  handler: handleRecommendations,
});

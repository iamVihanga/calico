import { corsHeaders } from './cors.ts';

export { corsPreflight } from './cors.ts';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) return json({ error: e.code }, e.status);
  // zod errors from request parsing
  if (e && typeof e === 'object' && 'issues' in e) return json({ error: 'bad_request' }, 400);
  console.error(e);
  return json({ error: 'internal' }, 500);
}

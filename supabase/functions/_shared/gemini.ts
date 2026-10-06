// One way to call Gemini from the edge functions (extract-book reads covers with it).

/** Google's alias for the current Flash model; the GEMINI_MODEL secret overrides it. */
export const DEFAULT_MODEL = 'gemini-flash-latest';
const TIMEOUT_MS = 30_000;

export type GeminiDeps = {
  fetch: typeof fetch;
  env: (key: string) => string | undefined;
  /** Where failures are reported (console.error in production; captured in tests). */
  log?: (line: string) => void;
};

export type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
export type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

export type GenerateRequest = {
  contents: GeminiContent[];
  /** System instruction (persona, language, rules). */
  system?: string;
  /** JSON Schema for a JSON reply; omitted for plain text. */
  jsonSchema?: Record<string, unknown>;
};

export type GenerateResult =
  | { ok: true; text: string }
  /** `status` is Gemini's HTTP status, or 0 when the request never got an answer (timeout, network). */
  | { ok: false; status: number };

type GeminiError = { code?: number; status?: string; message?: string };

async function readError(res: Response): Promise<GeminiError> {
  try {
    const body = await res.json();
    return (body?.error ?? {}) as GeminiError;
  } catch {
    return {};
  }
}

/**
 * Calls generateContent and returns the reply text. Failures are logged with Gemini's own status and
 * message (never the prompt, photos or user text) so they show up in the function logs. If Gemini
 * rejects `responseJsonSchema`, it retries once with the older OpenAPI-style `responseSchema`.
 */
export async function generate(deps: GeminiDeps, req: GenerateRequest): Promise<GenerateResult> {
  const log = deps.log ?? ((line: string) => console.error(line));
  const model = deps.env('GEMINI_MODEL') || DEFAULT_MODEL;
  const call = (generationConfig?: Record<string, unknown>) =>
    deps.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': deps.env('GEMINI_API_KEY') ?? '' },
      body: JSON.stringify({
        contents: req.contents,
        ...(req.system ? { system_instruction: { parts: [{ text: req.system }] } } : {}),
        // No temperature/top_p/top_k: deprecated on current Gemini models.
        ...(generationConfig ? { generationConfig } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

  let res: Response;
  try {
    res = await call(
      req.jsonSchema ? { responseMimeType: 'application/json', responseJsonSchema: req.jsonSchema } : undefined,
    );
    if (!res.ok && res.status === 400 && req.jsonSchema) {
      const err = await readError(res);
      if (!/schema/i.test(err.message ?? '')) {
        log(`gemini ${model}: 400 ${err.status ?? ''} ${err.message ?? ''}`.trim());
        return { ok: false, status: 400 };
      }
      log(`gemini ${model}: responseJsonSchema rejected, retrying with responseSchema`);
      res = await call({ responseMimeType: 'application/json', responseSchema: toOpenApiSchema(req.jsonSchema) });
    }
  } catch (e) {
    log(`gemini ${model}: no response (${e instanceof Error ? e.name : 'error'})`);
    return { ok: false, status: 0 };
  }

  if (!res.ok) {
    const err = await readError(res);
    log(`gemini ${model}: ${res.status} ${err.status ?? ''} ${err.message ?? ''}`.trim());
    return { ok: false, status: res.status };
  }
  const body = await res.json().catch(() => ({}));
  const candidate = body.candidates?.[0];
  const text: string | undefined = candidate?.content?.parts?.find(
    (p: { text?: string }) => typeof p.text === 'string',
  )?.text;
  if (!text) {
    log(`gemini ${model}: empty reply (finishReason ${candidate?.finishReason ?? 'none'})`);
    return { ok: false, status: 200 };
  }
  return { ok: true, text };
}

const OPENAPI_KEYS = new Set(['type', 'enum', 'properties', 'required', 'items', 'description', 'minimum', 'maximum']);

/**
 * JSON Schema → the OpenAPI 3 subset of Gemini's `responseSchema`: `type: ['x', 'null']` becomes
 * `type: 'X', nullable: true`; types are upper-case; unsupported keywords are dropped.
 */
export function toOpenApiSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (!OPENAPI_KEYS.has(key)) continue;
    if (key === 'type') {
      const types = (Array.isArray(value) ? value : [value]) as string[];
      const real = types.filter((t) => t !== 'null');
      out.type = (real[0] ?? 'string').toUpperCase();
      if (real.length < types.length) out.nullable = true;
    } else if (key === 'properties') {
      out.properties = Object.fromEntries(
        Object.entries(value as Record<string, Record<string, unknown>>).map(([k, v]) => [k, toOpenApiSchema(v)]),
      );
    } else if (key === 'items') {
      out.items = toOpenApiSchema(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

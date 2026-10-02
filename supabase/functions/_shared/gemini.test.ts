import { assertEquals } from '@std/assert';

import { DEFAULT_MODEL, generate, type GeminiDeps, toOpenApiSchema } from './gemini.ts';

type Call = { url: string; body: Record<string, any> };

function deps(responses: (() => Response | Promise<Response>)[], env: Record<string, string> = {}) {
  const calls: Call[] = [];
  const logs: string[] = [];
  const d: GeminiDeps = {
    fetch: (input, init) => {
      calls.push({ url: String(input), body: JSON.parse(String(init?.body)) });
      const next = responses[calls.length - 1];
      return next ? Promise.resolve(next()) : Promise.reject(new Error('no more responses'));
    },
    env: (k) => ({ GEMINI_API_KEY: 'k', ...env })[k],
    log: (line) => logs.push(line),
  };
  return { d, calls, logs };
}

const reply = (text: string) => () => Response.json({ candidates: [{ content: { parts: [{ text }] } }] });
const error = (code: number, status: string, message: string) => () =>
  Response.json({ error: { code, status, message } }, { status: code });
const SCHEMA = { type: 'object', properties: { title: { type: ['string', 'null'] } }, required: ['title'] };
const req = { contents: [{ role: 'user' as const, parts: [{ text: 'hi' }] }], jsonSchema: SCHEMA };

Deno.test('returns the reply text from the default model, with the system instruction', async () => {
  const { d, calls } = deps([reply('{"title":"IT"}')]);
  const r = await generate(d, { ...req, system: 'be kind' });
  assertEquals(r, { ok: true, text: '{"title":"IT"}' });
  assertEquals(calls[0]!.url.includes(`/models/${DEFAULT_MODEL}:generateContent`), true);
  assertEquals(calls[0]!.body.system_instruction, { parts: [{ text: 'be kind' }] });
  assertEquals(calls[0]!.body.generationConfig.responseJsonSchema, SCHEMA);
});

Deno.test('GEMINI_MODEL overrides the model', async () => {
  const { d, calls } = deps([reply('x')], { GEMINI_MODEL: 'gemini-x-flash' });
  await generate(d, { contents: req.contents });
  assertEquals(calls[0]!.url.includes('/models/gemini-x-flash:'), true);
  assertEquals(calls[0]!.body.generationConfig, undefined);
});

Deno.test("logs Gemini's error (not the prompt) and reports the status", async () => {
  const { d, logs } = deps([error(404, 'NOT_FOUND', 'models/gemini-3.6-flash is not found')]);
  const r = await generate(d, req);
  assertEquals(r, { ok: false, status: 404 });
  assertEquals(logs, [`gemini ${DEFAULT_MODEL}: 404 NOT_FOUND models/gemini-3.6-flash is not found`]);
});

Deno.test('a rejected responseJsonSchema is retried once with responseSchema', async () => {
  const { d, calls } = deps([
    error(400, 'INVALID_ARGUMENT', 'Invalid JSON payload: Unknown name "responseJsonSchema"'),
    reply('{"title":null}'),
  ]);
  const r = await generate(d, req);
  assertEquals(r, { ok: true, text: '{"title":null}' });
  assertEquals(calls.length, 2);
  assertEquals(calls[1]!.body.generationConfig.responseSchema, {
    type: 'OBJECT',
    properties: { title: { type: 'STRING', nullable: true } },
    required: ['title'],
  });
});

Deno.test('other 400s are not retried', async () => {
  const { d, calls, logs } = deps([error(400, 'INVALID_ARGUMENT', 'API key not valid')]);
  assertEquals(await generate(d, req), { ok: false, status: 400 });
  assertEquals(calls.length, 1);
  assertEquals(logs[0], `gemini ${DEFAULT_MODEL}: 400 INVALID_ARGUMENT API key not valid`);
});

Deno.test('no answer and an empty reply are failures', async () => {
  const thrown = deps([() => Promise.reject(new DOMException('timed out', 'TimeoutError'))]);
  assertEquals(await generate(thrown.d, req), { ok: false, status: 0 });
  assertEquals(thrown.logs, [`gemini ${DEFAULT_MODEL}: no response (TimeoutError)`]);

  const empty = deps([() => Response.json({ candidates: [{ finishReason: 'SAFETY' }] })]);
  assertEquals(await generate(empty.d, req), { ok: false, status: 200 });
  assertEquals(empty.logs, [`gemini ${DEFAULT_MODEL}: empty reply (finishReason SAFETY)`]);
});

Deno.test('toOpenApiSchema keeps enums and nested objects', () => {
  assertEquals(
    toOpenApiSchema({
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { type: 'string', enum: ['a', 'b'] },
        n: { type: ['integer', 'null'] },
        tags: { type: 'array', items: { type: 'string' } },
      },
    }),
    {
      type: 'OBJECT',
      properties: {
        kind: { type: 'STRING', enum: ['a', 'b'] },
        n: { type: 'INTEGER', nullable: true },
        tags: { type: 'ARRAY', items: { type: 'STRING' } },
      },
    },
  );
});

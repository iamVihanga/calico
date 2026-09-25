import { assertEquals } from '@std/assert';

import { type Admin, type Deps, handle } from './handler.ts';

const UID = 'aaaaaaaa-0000-4000-8000-000000000001';
const ITEM = 'b0000000-0000-4000-8000-000000000001';
const PATH = `${UID}/${ITEM}/front.jpg`;

function deps(opts: { used?: number; gemini?: () => Response; limit?: string } = {}) {
  const usage: boolean[] = [];
  const admin: Admin = {
    countUsageSince: () => Promise.resolve((opts.used ?? 0) + usage.length),
    recordUsage: (_u, ok) => {
      usage.push(ok);
      return Promise.resolve();
    },
    download: (p) => Promise.resolve(p === PATH ? new Uint8Array([1, 2, 3]) : null),
  };
  const gemini =
    opts.gemini ??
    (() =>
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    script_on_cover: 'sinhala',
                    title_native: ' මඩොල් දූව ',
                    title_romanized: 'Madol Doova',
                    author_native: 'මාර්ටින් වික්‍රමසිංහ',
                    author_romanized: 'Martin Wickramasinghe',
                    language: 'Sinhala',
                    isbn: '955-20-0000-0',
                    publisher: null,
                    published_year: 1947,
                    total_pages: 214,
                    confidence: { title_native: 0.95, title_romanized: 0.9, total_pages: 0.4, isbn: 0.9 },
                  }),
                },
              ],
            },
          },
        ],
      }));
  const d: Deps = {
    requireUser: () => Promise.resolve({ uid: UID, admin }),
    fetch: () => Promise.resolve(gemini()),
    env: (k) => ({ AI_DAILY_LIMIT: opts.limit ?? '30', GEMINI_API_KEY: 'k' })[k],
    now: () => new Date('2026-09-23T15:30:00Z'),
  };
  return { d, usage };
}

const req = (paths = [PATH]) =>
  new Request('http://localhost/extract-book', { method: 'POST', body: JSON.stringify({ itemId: ITEM, paths }) });

Deno.test('reads the cover and normalises the fields', async () => {
  const { d, usage } = deps();
  const res = await handle(req(), d);
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.fields.title_native, 'මඩොල් දූව');
  assertEquals(body.fields.isbn, null); // bad checksum dropped
  assertEquals(body.fields.confidence.isbn, 0); // null field → 0
  assertEquals(body.fields.confidence.total_pages, 0.4);
  assertEquals(body.remaining, 29);
  assertEquals(usage, [true]);
});

Deno.test('the 31st read of the day hits the daily limit', async () => {
  const { d, usage } = deps({ used: 30 });
  const res = await handle(req(), d);
  assertEquals(res.status, 429);
  const body = await res.json();
  assertEquals(body.error, 'daily_limit');
  assertEquals(body.limit, 30);
  assertEquals(body.resetsAt, '2026-09-23T18:30:00.000Z'); // next Colombo midnight
  assertEquals(usage, []); // Gemini not called, nothing recorded
});

Deno.test('the 30th read still works', async () => {
  const { d } = deps({ used: 29 });
  const res = await handle(req(), d);
  assertEquals(res.status, 200);
  assertEquals((await res.json()).remaining, 0);
});

Deno.test('rejects paths outside the user\'s item folder', async () => {
  const { d } = deps();
  const res = await handle(req([`someone-else/${ITEM}/front.jpg`]), d);
  assertEquals(res.status, 403);
});

Deno.test('unreadable model output → 422 ai_unreadable', async () => {
  const { d } = deps({ gemini: () => Response.json({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] }) });
  const res = await handle(req(), d);
  assertEquals(res.status, 422);
  assertEquals((await res.json()).error, 'ai_unreadable');
});

Deno.test('Gemini failure → 502 ai_failed, counted', async () => {
  const { d, usage } = deps({ gemini: () => new Response('boom', { status: 500 }) });
  const res = await handle(req(), d);
  assertEquals(res.status, 502);
  assertEquals(usage, [false]);
});

Deno.test('missing image → 404', async () => {
  const { d } = deps();
  const res = await handle(req([`${UID}/${ITEM}/back.jpg`]), d);
  assertEquals(res.status, 404);
});

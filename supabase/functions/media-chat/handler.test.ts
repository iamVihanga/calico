import { assert, assertEquals, assertStringIncludes } from '@std/assert';

import { type ChatStore, type ChatTurn, type Deps, handle, systemPrompt, type TitleContext } from './handler.ts';

const UID = 'aaaaaaaa-0000-4000-8000-000000000001';
const ITEM = 'b0000000-0000-4000-8000-000000000001';

const show: TitleContext = {
  kind: 'show',
  title: 'House of the Dragon',
  titleNative: null,
  year: 2022,
  overview: 'The Targaryen civil war.',
  genres: [],
  runtimeMin: null,
  network: 'HBO',
  tmdbStatus: 'Returning Series',
  seasons: 2,
  watchedUpTo: { season: 2, episode: 4 },
  status: 'watching',
};
const movie: TitleContext = {
  ...show,
  kind: 'movie',
  title: 'IT',
  year: 2017,
  genres: ['Horror'],
  runtimeMin: 135,
  network: null,
  tmdbStatus: null,
  seasons: null,
  watchedUpTo: null,
  status: 'watched',
};

function deps(
  opts: { context?: TitleContext | null; history?: ChatTurn[]; used?: number; gemini?: () => Response } = {},
) {
  const saved: { turns: ChatTurn[]; language: string }[] = [];
  const usage: boolean[] = [];
  const sent: Record<string, any>[] = [];
  const store: ChatStore = {
    context: () => Promise.resolve(opts.context === undefined ? show : opts.context),
    history: () => Promise.resolve(opts.history ?? []),
    save: (_id, turns, language) => {
      saved.push({ turns, language });
      return Promise.resolve();
    },
    countUsageSince: () => Promise.resolve(opts.used ?? 0),
    recordUsage: (_u, ok) => {
      usage.push(ok);
      return Promise.resolve();
    },
  };
  const d: Deps = {
    requireUser: () => Promise.resolve({ uid: UID, store }),
    fetch: (_url, init) => {
      sent.push(JSON.parse(String(init?.body)));
      return Promise.resolve(
        opts.gemini?.() ??
          Response.json({ candidates: [{ content: { parts: [{ text: ' Dragons, and a family at war. ' }] } }] }),
      );
    },
    env: (k) => ({ GEMINI_API_KEY: 'k' })[k],
    now: () => new Date('2026-10-02T10:00:00Z'),
    log: () => undefined,
  };
  return { d, saved, usage, sent };
}

const post = (body: Record<string, unknown>) =>
  new Request('http://localhost/media-chat', { method: 'POST', body: JSON.stringify(body) });
const ask = (message: string, extra: Record<string, unknown> = {}) =>
  post({ itemId: ITEM, message, language: 'en', ...extra });

Deno.test('answers with the conversation as memory and saves both turns', async () => {
  const history: ChatTurn[] = [
    { role: 'user', content: 'Give me an overview' },
    { role: 'assistant', content: 'A Targaryen succession war.' },
  ];
  const { d, saved, usage, sent } = deps({ history });
  const res = await handle(ask('Who is Rhaenyra?'), d);
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { reply: 'Dragons, and a family at war.', remaining: 49 });
  assertEquals(
    sent[0]!.contents.map((c: { role: string; parts: { text: string }[] }) => [c.role, c.parts[0]!.text]),
    [
      ['user', 'Give me an overview'],
      ['model', 'A Targaryen succession war.'],
      ['user', 'Who is Rhaenyra?'],
    ],
  );
  assertEquals(saved, [
    {
      turns: [
        { role: 'user', content: 'Who is Rhaenyra?' },
        { role: 'assistant', content: 'Dragons, and a family at war.' },
      ],
      language: 'en',
    },
  ]);
  assertEquals(usage, [true]);
});

Deno.test('Sinhala replies are asked for in Sinhala script', async () => {
  const { d, sent, saved } = deps();
  await handle(ask('Give me an overview', { language: 'si' }), d);
  assertStringIncludes(sent[0]!.system_instruction.parts[0].text, 'Reply in Sinhala, in Sinhala script');
  assertEquals(saved[0]!.language, 'si');
});

Deno.test('spoiler-safe by default: shows stop at the last watched episode, movies keep the ending', () => {
  const s = systemPrompt(show, 'en', false);
  assertStringIncludes(s, 'watched up to season 2, episode 4');
  assertStringIncludes(s, "turn on 'Spoilers OK'");
  assertStringIncludes(s, 'Network: HBO');
  assertStringIncludes(systemPrompt({ ...show, watchedUpTo: null }, 'en', false), "hasn't started watching");
  assertStringIncludes(systemPrompt(movie, 'en', false), "Don't reveal the ending");
  assertStringIncludes(systemPrompt(movie, 'en', true), 'allowed spoilers');
  assert(!systemPrompt(show, 'en', true).includes('watched up to'));
});

Deno.test('the 51st message of the day hits the daily limit', async () => {
  const { d, sent, usage } = deps({ used: 50 });
  const res = await handle(ask('hi'), d);
  assertEquals(res.status, 429);
  const body = await res.json();
  assertEquals([body.error, body.limit], ['daily_limit', 50]);
  assertEquals([sent.length, usage.length], [0, 0]);
});

Deno.test('unknown or foreign titles are 404; Gemini failures are 502 and nothing is saved', async () => {
  assertEquals((await handle(ask('hi'), deps({ context: null }).d)).status, 404);
  const failing = deps({ gemini: () => Response.json({ error: { message: 'down' } }, { status: 503 }) });
  const res = await handle(ask('hi'), failing.d);
  assertEquals(res.status, 502);
  assertEquals((await res.json()).error, 'ai_failed');
  assertEquals(failing.saved, []);
  assertEquals(failing.usage, [false]);
});

Deno.test('bad requests are 400', async () => {
  const { d } = deps();
  assertEquals((await handle(post({ itemId: ITEM, message: '', language: 'en' }), d)).status, 400);
  assertEquals((await handle(post({ itemId: ITEM, message: 'hi', language: 'ta' }), d)).status, 400);
  assertEquals((await handle(post({ itemId: 'nope', message: 'hi', language: 'en' }), d)).status, 400);
});

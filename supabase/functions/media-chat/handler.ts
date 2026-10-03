import { z } from 'zod';

import { type GeminiContent, generate } from '../_shared/gemini.ts';
import { corsPreflight, errorResponse, HttpError, json } from '../_shared/http.ts';
import { colomboDayWindow } from '../_shared/time.ts';

const Body = z.object({
  itemId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
  language: z.enum(['en', 'si']),
  spoilers: z.boolean().default(false),
});
export type Language = 'en' | 'si';

/** What the AI is told about the title (from the user's own rows: items + movies/shows). */
export type TitleContext = {
  kind: 'movie' | 'show';
  title: string;
  titleNative: string | null;
  year: number | null;
  overview: string | null;
  genres: string[];
  runtimeMin: number | null;
  network: string | null;
  tmdbStatus: string | null;
  seasons: number | null;
  /** Shows: the furthest episode the user has marked watched. */
  watchedUpTo: { season: number; episode: number } | null;
  /** The user's status for it (watchlist, watching, watched, dropped). */
  status: string;
};

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

/** Reads and writes as the user (RLS), except usage, which only the service role sees. */
export type ChatStore = {
  context: (itemId: string) => Promise<TitleContext | null>;
  history: (itemId: string, limit: number) => Promise<ChatTurn[]>;
  save: (itemId: string, turns: ChatTurn[], language: Language) => Promise<void>;
  countUsageSince: (uid: string, since: string) => Promise<number>;
  recordUsage: (uid: string, ok: boolean) => Promise<void>;
};

export type Deps = {
  requireUser: (req: Request) => Promise<{ uid: string; store: ChatStore }>;
  fetch: typeof fetch;
  env: (key: string) => string | undefined;
  now: () => Date;
  log?: (line: string) => void;
};

export const HISTORY = 20;

/** The system instruction: persona, language, spoiler rule, and the title's facts. */
export function systemPrompt(c: TitleContext, language: Language, spoilers: boolean): string {
  const facts = [
    `Title: ${c.title}${c.titleNative ? ` (${c.titleNative})` : ''}`,
    `Type: ${c.kind === 'movie' ? 'movie' : 'TV show'}`,
    c.year ? `Year: ${c.year}` : null,
    c.genres.length ? `Genres: ${c.genres.join(', ')}` : null,
    c.runtimeMin ? `Runtime: ${c.runtimeMin} minutes` : null,
    c.network ? `Network: ${c.network}` : null,
    c.tmdbStatus ? `Status: ${c.tmdbStatus}` : null,
    c.seasons ? `Seasons: ${c.seasons}` : null,
    c.overview ? `TMDB overview: ${c.overview}` : null,
  ].filter(Boolean);

  const lang =
    language === 'si'
      ? 'Reply in Sinhala, in Sinhala script, the way a Sri Lankan friend would talk: natural and everyday, not formal or literary. Keep names of people, places and titles as they are usually written.'
      : 'Reply in English.';

  let spoilerRule: string;
  if (spoilers) {
    spoilerRule = 'The user has allowed spoilers: you may discuss any part of the story.';
  } else if (c.kind === 'show') {
    spoilerRule = c.watchedUpTo
      ? `The user has watched up to season ${c.watchedUpTo.season}, episode ${c.watchedUpTo.episode}. Never reveal anything that happens after that point: no later plot events, deaths, twists, returns or reveals. Recaps cover only what they've seen.`
      : "The user hasn't started watching yet. Stay with the premise and setup; reveal nothing beyond the first episode.";
    spoilerRule +=
      " If they ask about later events, say it would spoil things and that they can turn on 'Spoilers OK'.";
  } else {
    spoilerRule =
      "Don't reveal the ending, twists or late plot points. If the user asks, say it would spoil the film and that they can turn on 'Spoilers OK'.";
  }

  return [
    "You are Pinki, the cat who lives in the user's Calico app and their film and TV companion: warm, concise, and honest. The user keeps this title in their personal library.",
    lang,
    spoilerRule,
    'Use the facts below and your own knowledge of this title. If you are not sure about something (cast, dates, plot), say so instead of guessing. Never invent details.',
    'Write plain text only: no markdown, no headings, no asterisks. Short paragraphs; a simple list with "•" is fine. Keep replies under about 180 words unless the user asks for more.',
    '',
    'About the title:',
    ...facts,
  ].join('\n');
}

/**
 * POST { itemId, message, language, spoilers } → { reply, remaining } | 404 not_found |
 * 429 daily_limit | 502 ai_failed. The conversation (last HISTORY turns) is the memory; the user's
 * message and the reply are saved to it.
 */
export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return corsPreflight();
  try {
    const { uid, store } = await deps.requireUser(req);
    const body = Body.parse(await req.json());

    const limit = Number(deps.env('AI_CHAT_DAILY_LIMIT') ?? 50);
    const { since, resetsAt } = colomboDayWindow(deps.now());
    const used = await store.countUsageSince(uid, since);
    if (used >= limit) return json({ error: 'daily_limit', limit, resetsAt }, 429);

    const context = await store.context(body.itemId);
    if (!context) throw new HttpError(404, 'not_found');
    const history = await store.history(body.itemId, HISTORY);

    const contents: GeminiContent[] = [
      ...history.map((t) => ({
        role: t.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: t.content }],
      })),
      { role: 'user', parts: [{ text: body.message }] },
    ];
    const result = await generate(deps, {
      system: systemPrompt(context, body.language, body.spoilers),
      contents,
    });
    await store.recordUsage(uid, result.ok);
    if (!result.ok) return json({ error: 'ai_failed' }, 502);

    const reply = result.text.trim().slice(0, 8000);
    await store.save(
      body.itemId,
      [
        { role: 'user', content: body.message },
        { role: 'assistant', content: reply },
      ],
      body.language,
    );
    return json({ reply, remaining: Math.max(0, limit - used - 1) });
  } catch (e) {
    return errorResponse(e);
  }
}

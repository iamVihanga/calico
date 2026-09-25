import { encodeBase64 } from '@std/encoding/base64';
import { z } from 'zod';

import { EXTRACTION_JSON_SCHEMA, Extraction, normalizeExtraction } from '../_shared/extraction.ts';
import { corsPreflight, errorResponse, HttpError, json } from '../_shared/http.ts';
import { colomboDayWindow } from '../_shared/time.ts';

const Body = z.object({ itemId: z.string().uuid(), paths: z.array(z.string()).min(1).max(2) });

/** The parts of the Supabase admin client the handler uses (stubbed in tests). */
export type Admin = {
  countUsageSince: (uid: string, since: string) => Promise<number>;
  recordUsage: (uid: string, ok: boolean) => Promise<void>;
  download: (path: string) => Promise<Uint8Array | null>;
};

export type Deps = {
  requireUser: (req: Request) => Promise<{ uid: string; admin: Admin }>;
  fetch: typeof fetch;
  env: (key: string) => string | undefined;
  now: () => Date;
};

export const PROMPT = `You are reading photos of a book's cover (and possibly its back cover or copyright page).
The book is most likely from Sri Lanka and may be in Sinhala, English or Tamil.
Return only what is printed or clearly implied by the photos.

Rules:
- title_native / author_native: exactly as printed in the non-Latin script (Sinhala or Tamil). Null if the cover has only Latin text.
- title_romanized / author_romanized: if the cover is in Sinhala or Tamil, give the common Sri Lankan English spelling
  (for example "Madol Doova", "Martin Wickramasinghe"), not ISO 15919 with diacritics and not a translation.
  If the cover is in English, copy the English title and author exactly.
- language: the language of the book's text.
- isbn, publisher, published_year, total_pages: only if printed in the photos. Never guess; use null.
- Strip series labels, prices and marketing text from the title.
- confidence: 0 to 1 for each field; below 0.6 means a person should check it.`;

/** POST { itemId, paths } → { fields, remaining } | 429 daily_limit | 422 ai_unreadable | 502 ai_failed. */
export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return corsPreflight();
  try {
    const { uid, admin } = await deps.requireUser(req);
    const { itemId, paths } = Body.parse(await req.json());
    if (!paths.every((p) => p.startsWith(`${uid}/${itemId}/`))) throw new HttpError(403, 'bad_path');

    const limit = Number(deps.env('AI_DAILY_LIMIT') ?? 30);
    const model = deps.env('GEMINI_MODEL') ?? 'gemini-3.6-flash';
    const { since, resetsAt } = colomboDayWindow(deps.now());
    const used = await admin.countUsageSince(uid, since);
    if (used >= limit) return json({ error: 'daily_limit', limit, resetsAt }, 429);

    const images = await Promise.all(
      paths.map(async (p) => {
        const bytes = await admin.download(p);
        if (!bytes) throw new HttpError(404, 'image_missing');
        return { inline_data: { mime_type: 'image/jpeg', data: encodeBase64(bytes) } };
      }),
    );

    let res: Response;
    try {
      res = await deps.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': deps.env('GEMINI_API_KEY') ?? '' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [...images, { text: PROMPT }] }],
          // No temperature/top_p/top_k: deprecated on current Gemini models.
          generationConfig: { responseMimeType: 'application/json', responseJsonSchema: EXTRACTION_JSON_SCHEMA },
        }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      await admin.recordUsage(uid, false);
      return json({ error: 'ai_failed' }, 502);
    }
    await admin.recordUsage(uid, res.ok);
    if (!res.ok) return json({ error: 'ai_failed' }, 502);

    const body = await res.json();
    const text: string =
      body.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => typeof p.text === 'string')?.text ?? '{}';
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return json({ error: 'ai_unreadable' }, 422);
    }
    const parsed = Extraction.safeParse(raw);
    if (!parsed.success) return json({ error: 'ai_unreadable' }, 422);
    return json({ fields: normalizeExtraction(parsed.data), remaining: Math.max(0, limit - used - 1) });
  } catch (e) {
    return errorResponse(e);
  }
}

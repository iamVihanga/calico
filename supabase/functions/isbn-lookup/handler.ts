import { z } from 'zod';

import type { IsbnLookup } from '../_shared/extraction.ts';
import { corsPreflight, errorResponse, HttpError, json } from '../_shared/http.ts';
import { toIsbn13 } from '../_shared/isbn.ts';

const Body = z.object({ isbn: z.string().min(10).max(20) });

export type Deps = {
  requireUser: (req: Request) => Promise<unknown>;
  fetch: typeof fetch;
  env: (key: string) => string | undefined;
};

type Language = IsbnLookup['language'];
const OL_LANG: Record<string, Language> = { eng: 'English', sin: 'Sinhala', tam: 'Tamil' };
const GB_LANG: Record<string, Language> = { en: 'English', si: 'Sinhala', ta: 'Tamil' };

const yearOf = (s: string | undefined) => {
  const m = s?.match(/\b(1[4-9]\d\d|20\d\d)\b/);
  return m ? Number(m[1]) : null;
};

async function openLibrary(isbn: string, deps: Deps, headers: HeadersInit): Promise<IsbnLookup | null> {
  const res = await deps.fetch(`https://openlibrary.org/isbn/${isbn}.json`, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const book = await res.json();
  if (!book?.title) return null;
  const authors: string[] = [];
  for (const a of (book.authors ?? []).slice(0, 3) as { key: string }[]) {
    const r = await deps.fetch(`https://openlibrary.org${a.key}.json`, { headers, signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const author = await r.json();
      if (author?.name) authors.push(author.name);
    }
  }
  const cover = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
  const coverOk = await deps
    .fetch(cover, { method: 'HEAD', headers, signal: AbortSignal.timeout(5000) })
    .then((r) => r.ok)
    .catch(() => false);
  const lang = (book.languages?.[0]?.key as string | undefined)?.split('/').pop();
  return {
    found: true,
    isbn,
    title: book.subtitle ? `${book.title}: ${book.subtitle}` : book.title,
    author: authors.join(', ') || null,
    pages: typeof book.number_of_pages === 'number' ? book.number_of_pages : null,
    publisher: book.publishers?.[0] ?? null,
    year: yearOf(book.publish_date),
    language: (lang && OL_LANG[lang]) || (lang ? 'Other' : null),
    coverUrl: coverOk ? cover : null,
    source: 'openlibrary',
  };
}

async function googleBooks(isbn: string, deps: Deps): Promise<IsbnLookup | null> {
  const key = deps.env('GOOGLE_BOOKS_API_KEY');
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${key ? `&key=${key}` : ''}`;
  const res = await deps.fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const v = (await res.json())?.items?.[0]?.volumeInfo;
  if (!v?.title) return null;
  const thumb: string | undefined = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail;
  return {
    found: true,
    isbn,
    title: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
    author: (v.authors as string[] | undefined)?.join(', ') ?? null,
    pages: typeof v.pageCount === 'number' && v.pageCount > 0 ? v.pageCount : null,
    publisher: v.publisher ?? null,
    year: yearOf(v.publishedDate),
    language: (v.language && GB_LANG[v.language]) || (v.language ? 'Other' : null),
    coverUrl: thumb ? thumb.replace(/^http:/, 'https:') : null,
    source: 'googlebooks',
  };
}

/** POST { isbn } → IsbnLookup. Open Library first, then Google Books. No AI quota used. */
export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return corsPreflight();
  try {
    await deps.requireUser(req);
    const { isbn: raw } = Body.parse(await req.json());
    const isbn = toIsbn13(raw);
    if (!isbn) throw new HttpError(400, 'bad_isbn');
    // Open Library asks API users to identify themselves.
    const headers = { 'User-Agent': `Calico/1.0 (${deps.env('CONTACT_EMAIL') ?? 'calico-app'})` };
    const found =
      (await openLibrary(isbn, deps, headers).catch(() => null)) ?? (await googleBooks(isbn, deps).catch(() => null));
    const empty: IsbnLookup = {
      found: false,
      isbn,
      title: null,
      author: null,
      pages: null,
      publisher: null,
      year: null,
      language: null,
      coverUrl: null,
      source: null,
    };
    return json(found ?? empty);
  } catch (e) {
    return errorResponse(e);
  }
}

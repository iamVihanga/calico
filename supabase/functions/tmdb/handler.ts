import { z } from 'zod';

import { corsPreflight, errorResponse, HttpError, json } from '../_shared/http.ts';
import {
  type EpisodeRow,
  episodesOf,
  fromEpisodeRow,
  isStale,
  mapCollection,
  mapMovie,
  mapSearch,
  mapShow,
  seasonChunks,
  type TmdbEpisode,
  toEpisodeRow,
} from '../_shared/tmdb.ts';

const TMDB = 'https://api.themoviedb.org/3';

const Body = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('search'),
    type: z.enum(['movie', 'tv']),
    query: z.string().trim().min(1).max(200),
    page: z.number().int().min(1).max(50).default(1),
  }),
  z.object({ action: z.literal('movie'), id: z.number().int().positive() }),
  z.object({ action: z.literal('collection'), id: z.number().int().positive() }),
  z.object({ action: z.literal('show'), id: z.number().int().positive() }),
  z.object({ action: z.literal('season'), id: z.number().int().positive(), season: z.number().int().min(0).max(200) }),
]);

/** Service-role access to the shared episode cache (and a show's status, for cache freshness). */
export type EpisodeCache = {
  upsert: (rows: EpisodeRow[]) => Promise<void>;
  season: (tmdbShowId: number, season: number) => Promise<EpisodeRow[]>;
  showStatus: (tmdbShowId: number) => Promise<string | null>;
};

export type Deps = {
  requireUser: (req: Request) => Promise<{ cache: EpisodeCache }>;
  fetch: typeof fetch;
  env: (key: string) => string | undefined;
  now: () => Date;
};

export function tmdbGetter(deps: Pick<Deps, 'fetch' | 'env'>) {
  const token = deps.env('TMDB_READ_TOKEN');
  if (!token) throw new HttpError(500, 'tmdb_not_configured');
  return async (path: string, params: Record<string, string> = {}) => {
    const qs = new URLSearchParams({ language: 'en-US', ...params });
    const res = await deps.fetch(`${TMDB}${path}?${qs}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 404) throw new HttpError(404, 'not_found');
    if (!res.ok) throw new HttpError(502, 'tmdb_failed');
    return res.json();
  };
}

/** POST { action, … } → trimmed TMDB DTOs (plan §8.2). `show` also fills the shared episode cache. */
export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return corsPreflight();
  try {
    const { cache } = await deps.requireUser(req);
    const body = Body.parse(await req.json());
    const get = tmdbGetter(deps);

    switch (body.action) {
      case 'search': {
        const kind = body.type === 'movie' ? 'movie' : 'show';
        const data = await get(`/search/${body.type}`, {
          query: body.query,
          page: String(body.page),
          include_adult: 'false',
        });
        return json({
          results: (data.results ?? []).map((r: unknown) => mapSearch(kind, r)),
          page: data.page ?? body.page,
          totalPages: data.total_pages ?? 1,
        });
      }
      case 'movie':
        return json(mapMovie(await get(`/movie/${body.id}`)));
      case 'collection':
        return json(mapCollection(await get(`/collection/${body.id}`)));
      case 'show': {
        const raw = await get(`/tv/${body.id}`);
        const show = mapShow(raw);
        const fetchedAt = deps.now().toISOString();
        const rows: EpisodeRow[] = [];
        for (const chunk of seasonChunks(show.seasons)) {
          const withSeasons = await get(`/tv/${body.id}`, {
            append_to_response: chunk.map((n) => `season/${n}`).join(','),
          });
          for (const n of chunk) {
            for (const e of episodesOf(withSeasons[`season/${n}`], n))
              rows.push(toEpisodeRow(show.tmdbId, e, fetchedAt));
          }
        }
        if (rows.length) await cache.upsert(rows);
        return json(show);
      }
      case 'season': {
        const cached = await cache.season(body.id, body.season);
        const oldest = cached.length
          ? cached.reduce((a, r) => (r.fetched_at < a ? r.fetched_at : a), cached[0]!.fetched_at)
          : null;
        if (cached.length && !isStale(oldest, await cache.showStatus(body.id), deps.now())) {
          return json({ episodes: cached.map(fromEpisodeRow) });
        }
        const episodes: TmdbEpisode[] = episodesOf(await get(`/tv/${body.id}/season/${body.season}`), body.season);
        const fetchedAt = deps.now().toISOString();
        if (episodes.length) await cache.upsert(episodes.map((e) => toEpisodeRow(body.id, e, fetchedAt)));
        return json({ episodes });
      }
    }
  } catch (e) {
    return errorResponse(e);
  }
}

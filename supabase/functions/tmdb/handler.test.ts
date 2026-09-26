import { assert, assertEquals } from '@std/assert';

import { HttpError } from '../_shared/http.ts';
import type { EpisodeRow } from '../_shared/tmdb.ts';
import { type Deps, handle } from './handler.ts';

type Route = (url: URL, init?: RequestInit) => unknown;

function deps(route: Route, cached: EpisodeRow[] = [], status: string | null = null) {
  const upserts: EpisodeRow[][] = [];
  const calls: URL[] = [];
  const d: Deps = {
    requireUser: () =>
      Promise.resolve({
        cache: {
          upsert: (rows) => {
            upserts.push(rows);
            return Promise.resolve();
          },
          season: (id, n) => Promise.resolve(cached.filter((r) => r.tmdb_show_id === id && r.season === n)),
          showStatus: () => Promise.resolve(status),
        },
      }),
    env: (k) => (k === 'TMDB_READ_TOKEN' ? 'token' : undefined),
    now: () => new Date('2026-09-23T12:00:00Z'),
    fetch: ((input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push(url);
      assertEquals(new Headers(init?.headers).get('Authorization'), 'Bearer token');
      const body = route(url, init);
      return Promise.resolve(body === undefined ? new Response('nope', { status: 404 }) : Response.json(body));
    }) as typeof fetch,
  };
  return { d, upserts, calls };
}

const post = (body: unknown) => new Request('http://localhost/tmdb', { method: 'POST', body: JSON.stringify(body) });

Deno.test('search returns trimmed results without adult titles', async () => {
  const { d, calls } = deps(() => ({
    page: 1,
    total_pages: 1,
    results: [{ id: 346364, title: 'IT', release_date: '2017-09-06', poster_path: '/it.jpg', overview: 'Derry.' }],
  }));
  const res = await handle(post({ action: 'search', type: 'movie', query: 'it' }), d);
  assertEquals(await res.json(), {
    results: [{ tmdbId: 346364, kind: 'movie', title: 'IT', year: 2017, posterPath: '/it.jpg', overview: 'Derry.' }],
    page: 1,
    totalPages: 1,
  });
  assertEquals(calls[0]!.pathname, '/3/search/movie');
  assertEquals(calls[0]!.searchParams.get('include_adult'), 'false');
});

Deno.test('movie DTO has runtime, genres and collection', async () => {
  const { d } = deps(() => ({
    id: 346364,
    title: 'IT',
    release_date: '2017-09-06',
    runtime: 135,
    genres: [{ id: 27, name: 'Horror' }],
    belongs_to_collection: { id: 477962, name: 'IT Collection' },
  }));
  const body = await (await handle(post({ action: 'movie', id: 346364 }), d)).json();
  assertEquals(body.runtimeMin, 135);
  assertEquals(body.genres, ['Horror']);
  assertEquals(body.collection, { id: 477962, name: 'IT Collection' });
});

Deno.test('collection parts are sorted by release date', async () => {
  const { d } = deps(() => ({
    id: 477962,
    name: 'IT Collection',
    parts: [
      { id: 474350, title: 'IT Chapter Two', release_date: '2019-09-04' },
      { id: 346364, title: 'IT', release_date: '2017-09-06' },
    ],
  }));
  const body = await (await handle(post({ action: 'collection', id: 477962 }), d)).json();
  assertEquals(
    body.parts.map((p: { title: string }) => p.title),
    ['IT', 'IT Chapter Two'],
  );
});

Deno.test('show fetches every season in one appended call and caches the episodes', async () => {
  const { d, upserts, calls } = deps((url) => {
    const base = {
      id: 94997,
      name: 'House of the Dragon',
      first_air_date: '2022-08-21',
      status: 'Returning Series',
      networks: [{ name: 'HBO' }],
      number_of_seasons: 2,
      next_episode_to_air: { season_number: 3, episode_number: 1, air_date: '2026-06-21' },
      seasons: [
        { season_number: 0, episode_count: 1 },
        { season_number: 1, episode_count: 2 },
        { season_number: 2, episode_count: 1 },
      ],
    };
    if (!url.searchParams.get('append_to_response')) return base;
    return {
      ...base,
      'season/0': { episodes: [{ season_number: 0, episode_number: 1, name: 'Inside', air_date: '2022-08-01' }] },
      'season/1': {
        episodes: [
          {
            season_number: 1,
            episode_number: 1,
            name: 'The Heirs of the Dragon',
            air_date: '2022-08-21',
            vote_average: 8.42,
          },
          { season_number: 1, episode_number: 2, name: 'The Rogue Prince', air_date: '2022-08-28' },
        ],
      },
      'season/2': { episodes: [{ season_number: 2, episode_number: 1, name: 'A Son for a Son', air_date: null }] },
    };
  });
  const show = await (await handle(post({ action: 'show', id: 94997 }), d)).json();
  assertEquals(show.network, 'HBO');
  assertEquals(show.nextEpisodeToAir, { season: 3, episode: 1, airDate: '2026-06-21' });
  assertEquals(calls[1]!.searchParams.get('append_to_response'), 'season/0,season/1,season/2');
  assertEquals(upserts[0]!.length, 4);
  assertEquals(upserts[0]![1], {
    tmdb_show_id: 94997,
    season: 1,
    episode: 1,
    name: 'The Heirs of the Dragon',
    air_date: '2022-08-21',
    still_path: null,
    vote_average: 8.4,
    runtime_min: null,
    fetched_at: '2026-09-23T12:00:00.000Z',
  });
});

Deno.test('season serves a fresh cache without calling TMDB', async () => {
  const row: EpisodeRow = {
    tmdb_show_id: 1399,
    season: 1,
    episode: 1,
    name: 'Winter Is Coming',
    air_date: '2011-04-17',
    still_path: null,
    vote_average: 8.1,
    runtime_min: 62,
    fetched_at: '2026-09-10T00:00:00Z', // 13 days old: fresh for an ended show
  };
  const { d, calls } = deps(() => undefined, [row], 'Ended');
  const body = await (await handle(post({ action: 'season', id: 1399, season: 1 }), d)).json();
  assertEquals(calls.length, 0);
  assertEquals(body.episodes[0].name, 'Winter Is Coming');
});

Deno.test('season refetches a stale cache for a running show', async () => {
  const row = {
    tmdb_show_id: 94997,
    season: 2,
    episode: 1,
    name: 'old',
    air_date: null,
    still_path: null,
    vote_average: null,
    runtime_min: null,
    fetched_at: '2026-09-22T00:00:00Z', // 36h old
  };
  const { d, upserts } = deps(
    () => ({ episodes: [{ episode_number: 1, name: 'A Son for a Son', air_date: '2024-06-16' }] }),
    [row],
    'Returning Series',
  );
  const body = await (await handle(post({ action: 'season', id: 94997, season: 2 }), d)).json();
  assertEquals(body.episodes[0].name, 'A Son for a Son');
  assertEquals(upserts[0]![0]!.season, 2);
});

Deno.test('TMDB 404 and bad requests map to clean errors', async () => {
  const { d } = deps(() => undefined);
  assertEquals((await handle(post({ action: 'movie', id: 1 }), d)).status, 404);
  assertEquals((await handle(post({ action: 'nope' }), d)).status, 400);
  const noUser = { ...d, requireUser: () => Promise.reject(new HttpError(401, 'unauthorized')) };
  assert((await handle(post({ action: 'movie', id: 1 }), noUser)).status === 401);
});

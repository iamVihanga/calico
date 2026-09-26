import { assertEquals } from '@std/assert';

import type { EpisodeRow } from '../_shared/tmdb.ts';
import { type Deps, handle } from './handler.ts';

function deps(ids: number[], failing: number[] = []) {
  const updates: [number, Record<string, unknown>][] = [];
  const upserts: EpisodeRow[][] = [];
  const logs: string[] = [];
  let query: [string[], string] | null = null;
  const d: Deps = {
    admin: {
      showsToRefresh: (ended, before) => {
        query = [ended, before];
        return Promise.resolve(ids);
      },
      updateShows: (id, patch) => {
        updates.push([id, patch]);
        return Promise.resolve();
      },
      upsertEpisodes: (rows) => {
        upserts.push(rows);
        return Promise.resolve();
      },
    },
    env: (k) => ({ CRON_SECRET: 's3cret', TMDB_READ_TOKEN: 'token' })[k],
    now: () => new Date('2026-09-23T20:30:00Z'),
    log: (l) => logs.push(l),
    fetch: ((input: string | URL | Request) => {
      const url = new URL(String(input));
      const id = Number(url.pathname.split('/')[3]);
      if (failing.includes(id)) return Promise.resolve(new Response('boom', { status: 500 }));
      if (url.pathname.includes('/season/')) {
        return Promise.resolve(
          Response.json({ episodes: [{ episode_number: 5, name: 'Regent', air_date: '2026-09-28' }] }),
        );
      }
      return Promise.resolve(
        Response.json({
          id,
          name: 'House of the Dragon',
          status: 'Returning Series',
          number_of_seasons: 3,
          last_episode_to_air: { season_number: 3, episode_number: 4, air_date: '2026-09-21' },
          next_episode_to_air: { season_number: 3, episode_number: 5, air_date: '2026-09-28' },
        }),
      );
    }) as typeof fetch,
  };
  return { d, updates, upserts, logs, query: () => query };
}

const cron = (secret?: string) =>
  new Request('http://localhost/refresh-shows', {
    method: 'POST',
    headers: secret ? { 'x-cron-secret': secret } : {},
    body: '{}',
  });

Deno.test('rejects calls without the cron secret', async () => {
  const { d } = deps([94997]);
  assertEquals((await handle(cron(), d)).status, 401);
  assertEquals((await handle(cron('wrong'), d)).status, 401);
});

Deno.test('updates next air date and re-caches the current season', async () => {
  const { d, updates, upserts, logs, query } = deps([94997]);
  const res = await handle(cron('s3cret'), d);
  assertEquals(await res.json(), { shows: 1, refreshed: 1, episodes: 1, failed: [] });
  assertEquals(query(), [['Ended', 'Canceled'], '2026-08-24T20:30:00.000Z']);
  assertEquals(updates[0], [
    94997,
    {
      tmdb_status: 'Returning Series',
      number_of_seasons: 3,
      next_air_date: '2026-09-28',
      next_season: 3,
      next_episode: 5,
      last_synced_at: '2026-09-23T20:30:00.000Z',
    },
  ]);
  assertEquals(upserts[0]![0]!.name, 'Regent');
  assertEquals(logs.length, 1);
});

Deno.test('one failing show does not stop the rest', async () => {
  const { d, updates } = deps([1, 2, 3, 4, 5], [3]);
  const body = await (await handle(cron('s3cret'), d)).json();
  assertEquals(body.refreshed, 4);
  assertEquals(body.failed, [3]);
  assertEquals(updates.length, 4);
});

import { errorResponse, HttpError, json } from '../_shared/http.ts';
import { type EpisodeRow, episodesOf, ENDED, mapShow, showPatch, toEpisodeRow } from '../_shared/tmdb.ts';
import { tmdbGetter } from '../tmdb/handler.ts';

export type ShowsAdmin = {
  /** Distinct TMDB ids of shows still running, or not synced since `staleBefore`. */
  showsToRefresh: (ended: string[], staleBefore: string) => Promise<number[]>;
  /** Update every user's `shows` row for this TMDB id. */
  updateShows: (tmdbId: number, patch: ReturnType<typeof showPatch>) => Promise<void>;
  upsertEpisodes: (rows: EpisodeRow[]) => Promise<void>;
};

export type Deps = {
  admin: ShowsAdmin;
  fetch: typeof fetch;
  env: (key: string) => string | undefined;
  now: () => Date;
  log?: (line: string) => void;
};

const CONCURRENCY = 4;
const DAY = 24 * 60 * 60 * 1000;

/** Run `fn` over `items` with at most `n` in flight. */
async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  const worker = async () => {
    while (i < items.length) await fn(items[i++]!);
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
}

/**
 * Nightly cron (plan §8.4): refresh status, season count and next air date of every running show, and
 * re-cache the seasons around the last and next episodes. Guarded by `x-cron-secret`.
 */
export async function handle(req: Request, deps: Deps): Promise<Response> {
  try {
    const secret = deps.env('CRON_SECRET');
    if (!secret || req.headers.get('x-cron-secret') !== secret) throw new HttpError(401, 'unauthorized');
    const get = tmdbGetter(deps);
    const now = deps.now();
    const ids = await deps.admin.showsToRefresh(ENDED, new Date(now.getTime() - 30 * DAY).toISOString());
    let refreshed = 0;
    let episodes = 0;
    const failed: number[] = [];

    await pool(ids, CONCURRENCY, async (id) => {
      try {
        const show = mapShow(await get(`/tv/${id}`));
        await deps.admin.updateShows(id, showPatch(show, now));
        const seasons = new Set(
          [show.lastEpisodeToAir?.season, show.nextEpisodeToAir?.season].filter((n): n is number => n !== undefined),
        );
        const fetchedAt = now.toISOString();
        for (const n of seasons) {
          const rows = episodesOf(await get(`/tv/${id}/season/${n}`), n).map((e) => toEpisodeRow(id, e, fetchedAt));
          if (rows.length) await deps.admin.upsertEpisodes(rows);
          episodes += rows.length;
        }
        refreshed++;
      } catch {
        failed.push(id);
      }
    });

    const summary = { shows: ids.length, refreshed, episodes, failed };
    (deps.log ?? console.log)(`refresh-shows ${JSON.stringify(summary)}`);
    return json(summary);
  } catch (e) {
    return errorResponse(e);
  }
}

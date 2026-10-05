import { ENDED } from '@shared/tmdb.ts';

import { copy } from '@/i18n/en';
import type { LocalDate } from '@/lib/dates';

import type { Episode, EpisodeRef, MovieStatus, ShowStatus } from './types';
import { DEFAULT_DIR, type LibrarySort, type SortDir, type Sortable, sortItems } from '@/features/library/sort';

/** TMDB statuses of shows that won't get new episodes. */
export const ENDED_STATUS = ENDED;

export const MOVIE_STOPS: MovieStatus[] = ['watchlist', 'watched'];
export const SHOW_STOPS: ShowStatus[] = ['watchlist', 'watching', 'watched'];
export const MOVIE_STATUSES: MovieStatus[] = ['watchlist', 'watched', 'dropped'];
export const SHOW_STATUSES: ShowStatus[] = ['watchlist', 'watching', 'watched', 'dropped'];

export const epKey = (season: number, episode: number) => `${season}:${episode}`;
export const watchSet = (w: EpisodeRef[]) => new Set(w.map((x) => epKey(x.season, x.episode)));

const aired = (e: Episode, today: LocalDate) => !!e.airDate && e.airDate <= today;
const counted = (e: Episode, includeSpecials: boolean) => e.season > 0 || includeSpecials;
const byOrder = (a: EpisodeRef, b: EpisodeRef) => a.season - b.season || a.episode - b.episode;

/**
 * The earliest aired episode not yet watched: the same rule as SQL `show_progress` (plan §11.5), so
 * optimistic updates can move "Next up" before the server answers. Specials (season 0) are never
 * "next" — they'd sort before season 1 — even when included in the counts; episodes without an air
 * date, or airing after today, never come next either.
 */
export function nextEpisode(
  episodes: Episode[],
  watched: Set<string>,
  today: LocalDate,
  includeSpecials: boolean,
): Episode | null {
  return (
    episodes
      .filter(
        (e) =>
          e.season > 0 && counted(e, includeSpecials) && aired(e, today) && !watched.has(epKey(e.season, e.episode)),
      )
      .sort(byOrder)[0] ?? null
  );
}

export type Progress = { aired: number; watched: number; total: number; next: Episode | null; caughtUp: boolean };

/** Client twin of `show_progress` for one show. */
export function progressOf(
  episodes: Episode[],
  watched: Set<string>,
  today: LocalDate,
  includeSpecials: boolean,
): Progress {
  const eps = episodes.filter((e) => counted(e, includeSpecials));
  const next = nextEpisode(eps, watched, today, true);
  return {
    aired: eps.filter((e) => aired(e, today)).length,
    watched: eps.filter((e) => watched.has(epKey(e.season, e.episode))).length,
    total: eps.length,
    next,
    caughtUp: next === null,
  };
}

export type Season = { n: number; episodes: Episode[] };

/** Seasons in order (specials first when included), episodes in order. */
export function seasonsOf(episodes: Episode[], includeSpecials: boolean): Season[] {
  const map = new Map<number, Episode[]>();
  for (const e of [...episodes].sort(byOrder)) {
    if (!counted(e, includeSpecials)) continue;
    map.set(e.season, [...(map.get(e.season) ?? []), e]);
  }
  return [...map].map(([n, eps]) => ({ n, episodes: eps }));
}

/** Aired episode numbers of a season (what "hold to fill the season" marks, like SQL `mark_season`). */
export const airedIn = (s: Season, today: LocalDate) => s.episodes.filter((e) => aired(e, today)).map((e) => e.episode);

/**
 * After marking: was that the very last episode of a finished show? Then offer "Mark the show as
 * watched?" (plan §11.1). Only for Ended/Canceled shows, never automatically.
 */
export function finishedShow(
  tmdbStatus: string | null,
  status: ShowStatus,
  p: Pick<Progress, 'aired' | 'watched' | 'total' | 'caughtUp'>,
): boolean {
  return (
    !!tmdbStatus &&
    ENDED.includes(tmdbStatus) &&
    status !== 'watched' &&
    p.caughtUp &&
    p.total > 0 &&
    p.watched >= p.aired
  );
}

/** "2h 15m" */
export function fmtRuntime(min: number | null): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** "S2 E5" */
export const epCode = (season: number, episode: number) =>
  season === 0 ? copy.shows.specialCode(episode) : `S${season} E${episode}`;

/** Series films other than the ones you already have (franchise sheet). */
export function franchiseOthers<T extends { tmdbId: number }>(parts: T[], have: Set<number>, added: number): T[] {
  return parts.filter((p) => p.tmdbId !== added && !have.has(p.tmdbId));
}

export type MediaSort = LibrarySort;

/** Library order for movies and shows (`sortItems`). */
export function sortMedia<T extends Sortable>(items: T[], sort: MediaSort, dir: SortDir = DEFAULT_DIR[sort]): T[] {
  return sortItems(items, sort, dir);
}

export function countBy<S extends string>(items: { status: S }[], statuses: readonly S[]): Record<S, number> {
  const counts = Object.fromEntries(statuses.map((s) => [s, 0])) as Record<S, number>;
  for (const i of items) counts[i.status] = (counts[i.status] ?? 0) + 1;
  return counts;
}

/**
 * The season show detail opens on: the one holding the most recently watched episode (by
 * `watchedAt`; marks made this session have none and count as newest, then the furthest along),
 * else the next episode's, else the first. Only seasons on screen count (specials may be hidden).
 */
export function defaultOpenSeason(
  seasons: Season[],
  watches: EpisodeRef[],
  next: { season: number } | null,
): number | null {
  const shown = new Set(seasons.map((s) => s.n));
  const latest = watches
    .filter((w) => shown.has(w.season))
    .sort((a, b) => {
      const at = (w: EpisodeRef) => w.watchedAt ?? '￿';
      if (at(a) !== at(b)) return at(a) < at(b) ? 1 : -1;
      return b.season - a.season || b.episode - a.episode;
    })[0];
  if (latest) return latest.season;
  if (next && shown.has(next.season)) return next.season;
  return seasons[0]?.n ?? null;
}

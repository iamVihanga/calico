/**
 * TMDB DTOs and pure mappers (plan §8.2), shared by the `tmdb` / `refresh-shows` functions and the app
 * (`@shared/tmdb.ts`). The app only ever sees these trimmed shapes, never raw TMDB JSON.
 */

export type TmdbKind = 'movie' | 'show';

export type TmdbSearchResult = {
  tmdbId: number;
  kind: TmdbKind;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string | null;
};

export type TmdbMovie = {
  tmdbId: number;
  kind: 'movie';
  title: string;
  year: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  runtimeMin: number | null;
  genres: string[];
  collection: { id: number; name: string } | null;
};

export type TmdbCollection = { id: number; name: string; parts: TmdbMovie[] };

export type TmdbEpisodeRef = { season: number; episode: number; airDate: string | null };

export type TmdbShow = {
  tmdbId: number;
  kind: 'show';
  title: string;
  year: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  /** 'Returning Series' | 'Ended' | 'Canceled' | 'In Production' … */
  tmdbStatus: string | null;
  network: string | null;
  numberOfSeasons: number | null;
  nextEpisodeToAir: TmdbEpisodeRef | null;
  lastEpisodeToAir: TmdbEpisodeRef | null;
  seasons: { n: number; episodeCount: number }[];
};

export type TmdbEpisode = {
  season: number;
  episode: number;
  name: string | null;
  airDate: string | null;
  stillPath: string | null;
  voteAverage: number | null;
  runtimeMin: number | null;
};

/** A `tmdb_episodes` row. */
export type EpisodeRow = {
  tmdb_show_id: number;
  season: number;
  episode: number;
  name: string | null;
  air_date: string | null;
  still_path: string | null;
  vote_average: number | null;
  runtime_min: number | null;
  fetched_at: string;
};

// deno-lint-ignore no-explicit-any
type Json = any;

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const date = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
export const yearOf = (d: unknown) => {
  const s = date(d);
  return s ? Number(s.slice(0, 4)) : null;
};

export function mapSearch(kind: TmdbKind, r: Json): TmdbSearchResult {
  return {
    tmdbId: r.id,
    kind,
    title: str(kind === 'movie' ? r.title : r.name) ?? str(r.original_title ?? r.original_name) ?? '?',
    year: yearOf(kind === 'movie' ? r.release_date : r.first_air_date),
    posterPath: str(r.poster_path),
    overview: str(r.overview),
  };
}

export function mapMovie(m: Json): TmdbMovie {
  const c = m.belongs_to_collection;
  return {
    tmdbId: m.id,
    kind: 'movie',
    title: str(m.title) ?? str(m.original_title) ?? '?',
    year: yearOf(m.release_date),
    posterPath: str(m.poster_path),
    backdropPath: str(m.backdrop_path),
    overview: str(m.overview),
    runtimeMin: num(m.runtime) || null,
    genres: Array.isArray(m.genres) ? m.genres.map((g: Json) => str(g?.name)).filter(Boolean) : [],
    collection: c && typeof c.id === 'number' ? { id: c.id, name: str(c.name) ?? '' } : null,
  };
}

export function mapCollection(c: Json): TmdbCollection {
  const parts = (Array.isArray(c.parts) ? c.parts : []).map(mapMovie) as TmdbMovie[];
  // Released films first, in release order; unreleased ones (no date) last.
  parts.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.title.localeCompare(b.title));
  return { id: c.id, name: str(c.name) ?? '', parts };
}

const epRef = (e: Json): TmdbEpisodeRef | null =>
  e && typeof e.season_number === 'number' && typeof e.episode_number === 'number'
    ? { season: e.season_number, episode: e.episode_number, airDate: date(e.air_date) }
    : null;

export function mapShow(s: Json): TmdbShow {
  return {
    tmdbId: s.id,
    kind: 'show',
    title: str(s.name) ?? str(s.original_name) ?? '?',
    year: yearOf(s.first_air_date),
    posterPath: str(s.poster_path),
    backdropPath: str(s.backdrop_path),
    overview: str(s.overview),
    tmdbStatus: str(s.status),
    network: str(s.networks?.[0]?.name),
    numberOfSeasons: num(s.number_of_seasons),
    nextEpisodeToAir: epRef(s.next_episode_to_air),
    lastEpisodeToAir: epRef(s.last_episode_to_air),
    seasons: (Array.isArray(s.seasons) ? s.seasons : [])
      .filter((x: Json) => typeof x?.season_number === 'number')
      .map((x: Json) => ({ n: x.season_number, episodeCount: num(x.episode_count) ?? 0 }))
      .sort((a: { n: number }, b: { n: number }) => a.n - b.n),
  };
}

export function mapEpisode(e: Json, season: number): TmdbEpisode {
  return {
    season: typeof e.season_number === 'number' ? e.season_number : season,
    episode: e.episode_number,
    name: str(e.name),
    airDate: date(e.air_date),
    stillPath: str(e.still_path),
    voteAverage: num(e.vote_average) ? Math.round(e.vote_average * 10) / 10 : null,
    runtimeMin: num(e.runtime) || null,
  };
}

export const episodesOf = (season: Json, n: number): TmdbEpisode[] =>
  (Array.isArray(season?.episodes) ? season.episodes : [])
    .filter((e: Json) => typeof e?.episode_number === 'number')
    .map((e: Json) => mapEpisode(e, n));

export const toEpisodeRow = (tmdbShowId: number, e: TmdbEpisode, fetchedAt: string): EpisodeRow => ({
  tmdb_show_id: tmdbShowId,
  season: e.season,
  episode: e.episode,
  name: e.name,
  air_date: e.airDate,
  still_path: e.stillPath,
  vote_average: e.voteAverage,
  runtime_min: e.runtimeMin,
  fetched_at: fetchedAt,
});

export const fromEpisodeRow = (r: Omit<EpisodeRow, 'tmdb_show_id' | 'fetched_at'>): TmdbEpisode => ({
  season: r.season,
  episode: r.episode,
  name: r.name,
  airDate: r.air_date,
  stillPath: r.still_path,
  voteAverage: r.vote_average === null ? null : Number(r.vote_average),
  runtimeMin: r.runtime_min,
});

/** TMDB allows 20 appended sub-requests per call: season numbers in chunks of 20. */
export function seasonChunks(seasons: { n: number }[], size = 20): number[][] {
  const ns = seasons.map((s) => s.n);
  const out: number[][] = [];
  for (let i = 0; i < ns.length; i += size) out.push(ns.slice(i, i + size));
  return out;
}

export const ENDED = ['Ended', 'Canceled'];
const HOUR = 60 * 60 * 1000;

/** Episode cache freshness: 24h for ongoing shows, 30 days for ended ones (plan §8.2). */
export function isStale(fetchedAt: string | null, tmdbStatus: string | null, now: Date): boolean {
  if (!fetchedAt) return true;
  const maxAge = tmdbStatus && ENDED.includes(tmdbStatus) ? 30 * 24 * HOUR : 24 * HOUR;
  return now.getTime() - new Date(fetchedAt).getTime() > maxAge;
}

/** `shows` columns refreshed from a TMDB show (add and nightly refresh). */
export function showPatch(s: TmdbShow, now: Date) {
  return {
    tmdb_status: s.tmdbStatus,
    number_of_seasons: s.numberOfSeasons,
    next_air_date: s.nextEpisodeToAir?.airDate ?? null,
    next_season: s.nextEpisodeToAir?.season ?? null,
    next_episode: s.nextEpisodeToAir?.episode ?? null,
    last_synced_at: now.toISOString(),
  };
}

/** Posters w342, backdrops w780, stills w300, loaded straight from TMDB (never re-hosted). */
export const tmdbImage = (path: string | null | undefined, size: 'w342' | 'w780' | 'w300' | 'w185') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

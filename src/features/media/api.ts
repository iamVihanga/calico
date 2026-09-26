import type { TmdbCollection, TmdbMovie, TmdbSearchResult, TmdbShow } from '@shared/tmdb.ts';
import { fromEpisodeRow } from '@shared/tmdb.ts';

import { colomboToday, type LocalDate } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/db';

import type { Episode, EpisodeRef, MediaStatus, Movie, Show, ShowProgress, Viewing } from './types';

type MovieRow = Tables<'items'> & { movies: Tables<'movies'>[]; watch_logs: Tables<'watch_logs'>[] };
type ShowRow = Tables<'items'> & { shows: Tables<'shows'>[] };

const base = (r: Tables<'items'>) => ({
  id: r.id,
  title: r.title,
  titleNative: r.title_native,
  posterPath: r.poster_path,
  backdropPath: r.backdrop_path,
  rating: r.rating,
  note: r.note,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const toViewing = (l: Tables<'watch_logs'>): Viewing => ({
  id: l.id,
  watchedOn: l.watched_on,
  rating: l.rating,
  note: l.note,
});

/** Latest viewing first (then the most recently logged, for two on the same day). */
export const byLatest = (a: Viewing & { createdAt?: string }, b: Viewing & { createdAt?: string }) =>
  b.watchedOn.localeCompare(a.watchedOn) || (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

export function toMovie(r: MovieRow): Movie {
  const m = r.movies[0];
  return {
    ...base(r),
    kind: 'movie',
    status: r.status as Movie['status'],
    tmdbId: m?.tmdb_id ?? 0,
    overview: m?.overview ?? null,
    year: m?.release_year ?? null,
    runtimeMin: m?.runtime_min ?? null,
    genres: m?.genres ?? [],
    collection: m?.tmdb_collection_id ? { id: m.tmdb_collection_id, name: m.tmdb_collection_name ?? '' } : null,
    viewings: [...r.watch_logs]
      .sort((a, b) => b.watched_on.localeCompare(a.watched_on) || b.created_at.localeCompare(a.created_at))
      .map(toViewing),
  };
}

export function toShow(r: ShowRow): Show {
  const s = r.shows[0];
  return {
    ...base(r),
    kind: 'show',
    status: r.status as Show['status'],
    tmdbId: s?.tmdb_id ?? 0,
    overview: s?.overview ?? null,
    year: s?.first_air_year ?? null,
    network: s?.network ?? null,
    tmdbStatus: s?.tmdb_status ?? null,
    numberOfSeasons: s?.number_of_seasons ?? null,
    nextAirDate: s?.next_air_date ?? null,
    nextSeason: s?.next_season ?? null,
    nextEpisode: s?.next_episode ?? null,
    lastSyncedAt: s?.last_synced_at ?? null,
  };
}

// Reads -----------------------------------------------------------------------------------------

export async function fetchMovies(): Promise<Movie[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*, movies(*), watch_logs(*)')
    .eq('kind', 'movie')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as MovieRow[]).map(toMovie);
}

export async function fetchShows(): Promise<Show[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*, shows(*)')
    .eq('kind', 'show')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as ShowRow[]).map(toShow);
}

export async function fetchShowProgress(): Promise<ShowProgress[]> {
  const { data, error } = await supabase.rpc('show_progress', {});
  if (error) throw error;
  return data.map((r) => ({
    itemId: r.item_id,
    aired: r.aired,
    watched: r.watched,
    total: r.total,
    next:
      r.next_season === null
        ? null
        : { season: r.next_season, episode: r.next_episode, name: r.next_name, stillPath: r.next_still },
    caughtUp: r.caught_up,
    nextAirDate: r.next_air_date,
    tmdbStatus: r.tmdb_status,
  }));
}

/** The shared episode cache for a show. Empty means it was never fetched: ask TMDB to fill it. */
export async function fetchEpisodes(tmdbId: number): Promise<Episode[]> {
  const read = async () => {
    const { data, error } = await supabase
      .from('tmdb_episodes')
      .select('season, episode, name, air_date, still_path, vote_average, runtime_min')
      .eq('tmdb_show_id', tmdbId)
      .order('season')
      .order('episode')
      .range(0, 4999);
    if (error) throw error;
    return data.map(fromEpisodeRow);
  };
  const eps = await read();
  if (eps.length) return eps;
  await tmdbShow(tmdbId);
  return read();
}

export async function fetchWatches(itemId: string): Promise<EpisodeRef[]> {
  const { data, error } = await supabase
    .from('episode_watches')
    .select('season, episode')
    .eq('item_id', itemId)
    .range(0, 4999);
  if (error) throw error;
  return data;
}

// TMDB (edge function) ----------------------------------------------------------------------------

async function tmdb<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('tmdb', { body });
  if (error) throw error;
  return data as T;
}

export const searchTmdb = (type: 'movie' | 'show', query: string, page = 1) =>
  tmdb<{ results: TmdbSearchResult[]; page: number; totalPages: number }>({
    action: 'search',
    type: type === 'movie' ? 'movie' : 'tv',
    query,
    page,
  });
export const tmdbMovie = (id: number) => tmdb<TmdbMovie>({ action: 'movie', id });
export const tmdbCollection = (id: number) => tmdb<TmdbCollection>({ action: 'collection', id });
export const tmdbShow = (id: number) => tmdb<TmdbShow>({ action: 'show', id });

// Writes ----------------------------------------------------------------------------------------

/** `add_tmdb_item` payload: everything the item needs, fetched from TMDB before the (replayable) write. */
export type NewMedia = {
  id: string;
  kind: 'movie' | 'show';
  status: MediaStatus;
  title: string;
  tmdbId: number;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  year: number | null;
  watchedOn?: LocalDate;
  rating?: number | null;
  upNextPosition?: string;
  // movies
  runtimeMin?: number | null;
  genres?: string[];
  collection?: { id: number; name: string } | null;
  // shows
  network?: string | null;
  tmdbStatus?: string | null;
  numberOfSeasons?: number | null;
  nextAirDate?: string | null;
  nextSeason?: number | null;
  nextEpisode?: number | null;
};

export function newMediaFrom(
  d: TmdbMovie | TmdbShow,
  id: string,
  status: MediaStatus,
  extra: Partial<NewMedia> = {},
): NewMedia {
  const common = {
    id,
    kind: d.kind,
    status,
    title: d.title,
    tmdbId: d.tmdbId,
    posterPath: d.posterPath,
    backdropPath: d.backdropPath,
    overview: d.overview,
    year: d.year,
  };
  return d.kind === 'movie'
    ? { ...common, runtimeMin: d.runtimeMin, genres: d.genres, collection: d.collection, ...extra }
    : {
        ...common,
        network: d.network,
        tmdbStatus: d.tmdbStatus,
        numberOfSeasons: d.numberOfSeasons,
        nextAirDate: d.nextEpisodeToAir?.airDate ?? null,
        nextSeason: d.nextEpisodeToAir?.season ?? null,
        nextEpisode: d.nextEpisodeToAir?.episode ?? null,
        ...extra,
      };
}

export async function addTmdbItem(v: NewMedia): Promise<void> {
  const movie = v.kind === 'movie';
  const { error } = await supabase.rpc('add_tmdb_item', {
    p: {
      id: v.id,
      kind: v.kind,
      status: v.status,
      title: v.title,
      tmdb_id: v.tmdbId,
      poster_path: v.posterPath,
      backdrop_path: v.backdropPath,
      overview: v.overview,
      watched_on: v.watchedOn ?? null,
      rating: v.rating ?? null,
      ...(v.upNextPosition ? { up_next_position: v.upNextPosition } : {}),
      ...(movie
        ? {
            release_year: v.year,
            runtime_min: v.runtimeMin ?? null,
            genres: v.genres ?? [],
            tmdb_collection_id: v.collection?.id ?? null,
            tmdb_collection_name: v.collection?.name ?? null,
          }
        : {
            first_air_year: v.year,
            network: v.network ?? null,
            tmdb_status: v.tmdbStatus ?? null,
            number_of_seasons: v.numberOfSeasons ?? null,
            next_air_date: v.nextAirDate ?? null,
            next_season: v.nextSeason ?? null,
            next_episode: v.nextEpisode ?? null,
          }),
    },
  });
  if (error) throw error;
}

export type ViewingVars = { id: string; itemId: string; on: LocalDate; rating: number | null; note: string | null };
export async function logViewing(v: ViewingVars): Promise<void> {
  const { error } = await supabase.rpc('log_viewing', {
    p_id: v.id,
    p_item: v.itemId,
    p_on: v.on,
    p_rating: v.rating as number,
    p_note: v.note as string,
  });
  if (error) throw error;
}

export type MarkVars = { itemId: string; season: number; episodes: number[]; watched: boolean };
export async function markEpisodes(v: MarkVars): Promise<void> {
  const { error } = await supabase.rpc('mark_episodes', {
    p_item: v.itemId,
    p_season: v.season,
    p_episodes: v.episodes,
    p_watched: v.watched,
  });
  if (error) throw error;
}

export type SeasonVars = { itemId: string; season: number; episodes: number[] };
/** Server marks every aired episode (`mark_season`); `episodes` is the client's copy for the optimistic update. */
export async function markSeason(v: SeasonVars): Promise<void> {
  const { error } = await supabase.rpc('mark_season', { p_item: v.itemId, p_season: v.season });
  if (error) throw error;
}

export type MediaStatusVars = { itemId: string; status: MediaStatus; on?: LocalDate };
export async function setItemStatus(v: MediaStatusVars): Promise<void> {
  const { error } = await supabase.rpc('set_item_status', {
    p_item: v.itemId,
    p_status: v.status,
    p_on: v.on ?? colomboToday(),
  });
  if (error) throw error;
}

export type CollectionVars = {
  id: string;
  name: string;
  description?: string | null;
  position: string;
  items: string[];
  positions: string[];
};
export async function createCollection(v: CollectionVars): Promise<void> {
  const { error } = await supabase.rpc('create_collection', {
    p_id: v.id,
    p_name: v.name,
    p_position: v.position,
    p_items: v.items,
    p_positions: v.positions,
    ...(v.description ? { p_description: v.description } : {}),
  });
  if (error) throw error;
}

export async function fetchCollectionPositions(): Promise<{ position: string }[]> {
  const { data, error } = await supabase.from('collections').select('position');
  if (error) throw error;
  return data;
}

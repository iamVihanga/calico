import type { TmdbEpisode } from '@shared/tmdb.ts';

export type MovieStatus = 'watchlist' | 'watched' | 'dropped';
export type ShowStatus = 'watchlist' | 'watching' | 'watched' | 'dropped';
export type MediaStatus = MovieStatus | ShowStatus;

export type Viewing = { id: string; watchedOn: string; rating: number | null; note: string | null };

type MediaBase = {
  id: string;
  title: string;
  titleNative: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number | null;
  note: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tmdbId: number;
  overview: string | null;
};

export type Movie = MediaBase & {
  kind: 'movie';
  status: MovieStatus;
  year: number | null;
  runtimeMin: number | null;
  genres: string[];
  collection: { id: number; name: string } | null;
  /** Latest first. */
  viewings: Viewing[];
};

export type Show = MediaBase & {
  kind: 'show';
  status: ShowStatus;
  year: number | null;
  network: string | null;
  tmdbStatus: string | null;
  numberOfSeasons: number | null;
  nextAirDate: string | null;
  nextSeason: number | null;
  nextEpisode: number | null;
  lastSyncedAt: string | null;
};

export type Media = Movie | Show;

/** One row of `show_progress()` (Home, Library). */
export type ShowProgress = {
  itemId: string;
  aired: number;
  watched: number;
  total: number;
  next: { season: number; episode: number; name: string | null; stillPath: string | null } | null;
  caughtUp: boolean;
  nextAirDate: string | null;
  tmdbStatus: string | null;
};

export type Episode = TmdbEpisode;
export type EpisodeRef = { season: number; episode: number };

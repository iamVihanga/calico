import type { TmdbKind, TmdbMovie, TmdbShow } from '@shared/tmdb.ts';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { newId } from '@/features/books/api';
import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';

import * as api from './api';
import { MOVIES, useAddMedia } from './hooks';
import { franchiseOthers } from './logic';
import type { Movie } from './types';

const HOUR = 60 * 60 * 1000;

export const tmdbKeys = {
  movie: (id: number) => ['tmdb', 'movie', id] as const,
  show: (id: number) => ['tmdb', 'show', id] as const,
  collection: (id: number) => ['tmdb', 'collection', id] as const,
};

export const fetchMovieDetails = (qc: QueryClient, id: number) =>
  qc.fetchQuery({ queryKey: tmdbKeys.movie(id), queryFn: () => api.tmdbMovie(id), staleTime: 24 * HOUR });
/** Also fills the shared episode cache on the server. */
export const fetchShowDetails = (qc: QueryClient, id: number) =>
  qc.fetchQuery({ queryKey: tmdbKeys.show(id), queryFn: () => api.tmdbShow(id), staleTime: HOUR });
export const fetchCollection = (qc: QueryClient, id: number) =>
  qc.fetchQuery({ queryKey: tmdbKeys.collection(id), queryFn: () => api.tmdbCollection(id), staleTime: 24 * HOUR });

export type AddTarget = { tmdbId: number; kind: TmdbKind; title: string };

/**
 * Add from TMDB (plan §11.11): fetch the details (a show's also fill the episode cache), then a
 * replayable `add_tmdb_item`. "Already watched" on a show opens it so seasons can be marked; a movie
 * from a series offers the rest of the series.
 */
export function useAddFromTmdb() {
  const qc = useQueryClient();
  const add = useAddMedia();
  return async (r: AddTarget, status: 'watchlist' | 'watched'): Promise<string | null> => {
    let d: TmdbMovie | TmdbShow;
    try {
      d = r.kind === 'movie' ? await fetchMovieDetails(qc, r.tmdbId) : await fetchShowDetails(qc, r.tmdbId);
    } catch {
      toast({ message: copy.tmdb.failed });
      return null;
    }
    const id = newId();
    const asWatched = d.kind === 'movie' && status === 'watched';
    add.mutate(
      api.newMediaFrom(d, id, asWatched ? 'watched' : 'watchlist', asWatched ? { watchedOn: colomboToday() } : {}),
    );
    const href = d.kind === 'movie' ? `/movie/${id}` : `/show/${id}`;
    if (d.kind === 'show' && status === 'watched') {
      router.push(href as never);
      return id;
    }
    toast({
      message: copy.tmdb.addedToast(d.title),
      action: { label: copy.tmdb.open, onPress: () => router.push(href as never) },
    });
    if (d.kind === 'movie' && d.collection) void offerFranchise(qc, d, id);
    return id;
  };
}

async function offerFranchise(qc: QueryClient, movie: TmdbMovie, itemId: string) {
  try {
    const c = await fetchCollection(qc, movie.collection!.id);
    const have = new Set((qc.getQueryData<Movie[]>(MOVIES) ?? []).map((m) => m.tmdbId));
    if (franchiseOthers(c.parts, have, movie.tmdbId).length === 0) return;
    openSheet('franchise', { itemId, tmdbId: movie.tmdbId, collectionId: c.id });
  } catch {
    // no series offer offline; the movie is still added
  }
}

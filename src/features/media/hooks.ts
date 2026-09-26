import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { failed, leaveQueue, useAddToUpNext } from '@/features/books/hooks';
import { useProfile } from '@/features/profile/hooks';
import { colomboToday } from '@/lib/dates';
import { MEDIA_SCOPE, mk } from '@/lib/mutations';
import { qk } from '@/lib/queryKeys';

import * as api from './api';
import { epKey, progressOf, watchSet } from './logic';
import type { Episode, EpisodeRef, Movie, Show, ShowProgress } from './types';

export const MOVIES = qk.items('movie', 'all');
export const SHOWS = qk.items('show', 'all');
const PROGRESS = qk.showProgress();
const HOUR = 60 * 60 * 1000;

export const useMovies = () => useQuery({ queryKey: MOVIES, queryFn: api.fetchMovies });
export const useShows = () => useQuery({ queryKey: SHOWS, queryFn: api.fetchShows });
export const useShowProgress = () => useQuery({ queryKey: PROGRESS, queryFn: api.fetchShowProgress });

export function useMovie(id: string) {
  const q = useMovies();
  return { ...q, data: q.data?.find((m) => m.id === id) };
}
export function useShow(id: string) {
  const q = useShows();
  return { ...q, data: q.data?.find((s) => s.id === id) };
}

export const useEpisodes = (tmdbId: number | undefined) =>
  useQuery({
    queryKey: qk.episodes(tmdbId ?? 0),
    queryFn: () => api.fetchEpisodes(tmdbId!),
    enabled: !!tmdbId,
    staleTime: HOUR,
  });

export const useWatches = (itemId: string) =>
  useQuery({ queryKey: qk.watches(itemId), queryFn: () => api.fetchWatches(itemId) });

export function useIncludeSpecials() {
  return useProfile().data?.include_specials ?? false;
}

/** Live progress for one show from its episodes and watches (null until both are loaded). */
export function useProgress(show: Pick<Show, 'id' | 'tmdbId'> | undefined) {
  const episodes = useEpisodes(show?.tmdbId).data;
  const watches = useWatches(show?.id ?? '').data;
  const specials = useIncludeSpecials();
  return useMemo(() => {
    if (!episodes || !watches) return null;
    const set = watchSet(watches);
    return { episodes, watchedSet: set, ...progressOf(episodes, set, colomboToday(), specials) };
  }, [episodes, watches, specials]);
}

// Cache helpers -----------------------------------------------------------------------------------

type Snap = { movies?: Movie[]; shows?: Show[]; progress?: ShowProgress[]; watches?: EpisodeRef[] };

async function snap(qc: QueryClient, itemId?: string): Promise<Snap> {
  await Promise.all([
    qc.cancelQueries({ queryKey: MOVIES }),
    qc.cancelQueries({ queryKey: SHOWS }),
    qc.cancelQueries({ queryKey: PROGRESS }),
    ...(itemId ? [qc.cancelQueries({ queryKey: qk.watches(itemId) })] : []),
  ]);
  return {
    movies: qc.getQueryData(MOVIES),
    shows: qc.getQueryData(SHOWS),
    progress: qc.getQueryData(PROGRESS),
    watches: itemId ? qc.getQueryData(qk.watches(itemId)) : undefined,
  };
}

function restoreSnap(qc: QueryClient, s: Snap | undefined, itemId?: string) {
  if (!s) return;
  qc.setQueryData(MOVIES, s.movies);
  qc.setQueryData(SHOWS, s.shows);
  qc.setQueryData(PROGRESS, s.progress);
  if (itemId) qc.setQueryData(qk.watches(itemId), s.watches);
}

function settleMedia(qc: QueryClient, itemId?: string) {
  void qc.invalidateQueries({ queryKey: MOVIES });
  void qc.invalidateQueries({ queryKey: SHOWS });
  void qc.invalidateQueries({ queryKey: PROGRESS });
  void qc.invalidateQueries({ queryKey: qk.upNext });
  void qc.invalidateQueries({ queryKey: qk.homeStats });
  if (itemId) void qc.invalidateQueries({ queryKey: qk.watches(itemId) });
}

const now = () => new Date().toISOString();

function patchMovie(qc: QueryClient, id: string, patch: (m: Movie) => Partial<Movie>) {
  qc.setQueryData<Movie[]>(MOVIES, (l) => l?.map((m) => (m.id === id ? { ...m, ...patch(m), updatedAt: now() } : m)));
}
function patchShow(qc: QueryClient, id: string, patch: (s: Show) => Partial<Show>) {
  qc.setQueryData<Show[]>(SHOWS, (l) => l?.map((s) => (s.id === id ? { ...s, ...patch(s), updatedAt: now() } : s)));
}

/** Apply a watch change locally: the watch set, Watchlist → Watching, and the Home/Library progress row. */
function applyWatches(qc: QueryClient, itemId: string, season: number, episodes: number[], watched: boolean) {
  const keys = new Set(episodes.map((e) => epKey(season, e)));
  qc.setQueryData<EpisodeRef[]>(qk.watches(itemId), (w = []) => {
    const rest = w.filter((x) => !keys.has(epKey(x.season, x.episode)));
    return watched ? [...rest, ...episodes.map((episode) => ({ season, episode }))] : rest;
  });
  if (watched) {
    patchShow(qc, itemId, (s) =>
      s.status === 'watchlist' ? { status: 'watching', startedAt: s.startedAt ?? colomboToday() } : {},
    );
  }
  const show = qc.getQueryData<Show[]>(SHOWS)?.find((s) => s.id === itemId);
  const eps = show && qc.getQueryData<Episode[]>(qk.episodes(show.tmdbId));
  const w = qc.getQueryData<EpisodeRef[]>(qk.watches(itemId));
  if (!eps || !w) return;
  const specials =
    (qc.getQueryData(qk.profile) as { include_specials?: boolean } | undefined)?.include_specials ?? false;
  const p = progressOf(eps, watchSet(w), colomboToday(), specials);
  qc.setQueryData<ShowProgress[]>(PROGRESS, (rows) =>
    rows?.map((r) =>
      r.itemId === itemId
        ? {
            ...r,
            aired: p.aired,
            watched: p.watched,
            total: p.total,
            caughtUp: p.caughtUp,
            next: p.next && {
              season: p.next.season,
              episode: p.next.episode,
              name: p.next.name,
              stillPath: p.next.stillPath,
            },
          }
        : r,
    ),
  );
}

// Mutations ---------------------------------------------------------------------------------------

function optimisticMedia(v: api.NewMedia): Movie | Show {
  const common = {
    id: v.id,
    title: v.title,
    titleNative: null,
    posterPath: v.posterPath,
    backdropPath: v.backdropPath,
    rating: v.status === 'watched' ? (v.rating ?? null) : null,
    note: null,
    startedAt: v.status === 'watching' ? colomboToday() : null,
    finishedAt: v.status === 'watched' ? (v.watchedOn ?? colomboToday()) : null,
    createdAt: now(),
    updatedAt: now(),
    tmdbId: v.tmdbId,
    overview: v.overview,
    year: v.year,
  };
  return v.kind === 'movie'
    ? {
        ...common,
        kind: 'movie',
        status: v.status as Movie['status'],
        runtimeMin: v.runtimeMin ?? null,
        genres: v.genres ?? [],
        collection: v.collection ?? null,
        viewings:
          v.status === 'watched'
            ? [{ id: `new-${v.id}`, watchedOn: v.watchedOn ?? colomboToday(), rating: v.rating ?? null, note: null }]
            : [],
      }
    : {
        ...common,
        kind: 'show',
        status: v.status as Show['status'],
        network: v.network ?? null,
        tmdbStatus: v.tmdbStatus ?? null,
        numberOfSeasons: v.numberOfSeasons ?? null,
        nextAirDate: v.nextAirDate ?? null,
        nextSeason: v.nextSeason ?? null,
        nextEpisode: v.nextEpisode ?? null,
        lastSyncedAt: now(),
      };
}

export function useAddMedia() {
  const qc = useQueryClient();
  return useMutation<void, Error, api.NewMedia, Snap>({
    mutationKey: mk.mediaAdd,
    scope: MEDIA_SCOPE,
    onMutate: async (v) => {
      const s = await snap(qc);
      const item = optimisticMedia(v);
      if (item.kind === 'movie')
        qc.setQueryData<Movie[]>(MOVIES, (l) => [item, ...(l ?? []).filter((m) => m.id !== v.id)]);
      else qc.setQueryData<Show[]>(SHOWS, (l) => [item, ...(l ?? []).filter((m) => m.id !== v.id)]);
      return s;
    },
    onError: (_e, _v, ctx) => {
      restoreSnap(qc, ctx);
      failed();
    },
    onSettled: () => settleMedia(qc),
  });
}

export function useLogViewing() {
  const qc = useQueryClient();
  const requeue = useAddToUpNext();
  return useMutation<void, Error, api.ViewingVars, Snap>({
    mutationKey: mk.mediaViewing,
    scope: MEDIA_SCOPE,
    onMutate: async (v) => {
      const s = await snap(qc);
      patchMovie(qc, v.itemId, (m) => {
        const latest = !m.finishedAt || v.on >= m.finishedAt;
        return {
          status: 'watched',
          finishedAt: latest ? v.on : m.finishedAt,
          rating: latest ? (v.rating ?? m.rating) : m.rating,
          viewings: [{ id: v.id, watchedOn: v.on, rating: v.rating, note: v.note }, ...m.viewings].sort((a, b) =>
            b.watchedOn.localeCompare(a.watchedOn),
          ),
        };
      });
      leaveQueue(qc, v.itemId, 'watched', (e) => requeue.mutate(e));
      return s;
    },
    onError: (_e, _v, ctx) => {
      restoreSnap(qc, ctx);
      failed();
    },
    onSettled: (_d, _e, v) => settleMedia(qc, v.itemId),
  });
}

export function useMarkEpisodes() {
  const qc = useQueryClient();
  return useMutation<void, Error, api.MarkVars, Snap>({
    mutationKey: mk.mediaMarkEpisodes,
    scope: MEDIA_SCOPE,
    onMutate: async (v) => {
      const s = await snap(qc, v.itemId);
      applyWatches(qc, v.itemId, v.season, v.episodes, v.watched);
      return s;
    },
    onError: (_e, v, ctx) => {
      restoreSnap(qc, ctx, v.itemId);
      failed();
    },
    onSettled: (_d, _e, v) => settleMedia(qc, v.itemId),
  });
}

export function useMarkSeason() {
  const qc = useQueryClient();
  return useMutation<void, Error, api.SeasonVars, Snap>({
    mutationKey: mk.mediaMarkSeason,
    scope: MEDIA_SCOPE,
    onMutate: async (v) => {
      const s = await snap(qc, v.itemId);
      applyWatches(qc, v.itemId, v.season, v.episodes, true);
      return s;
    },
    onError: (_e, v, ctx) => {
      restoreSnap(qc, ctx, v.itemId);
      failed();
    },
    onSettled: (_d, _e, v) => settleMedia(qc, v.itemId),
  });
}

export function useSetMediaStatus() {
  const qc = useQueryClient();
  const requeue = useAddToUpNext();
  return useMutation<void, Error, api.MediaStatusVars, Snap>({
    mutationKey: mk.mediaStatus,
    scope: MEDIA_SCOPE,
    onMutate: async (v) => {
      const s = await snap(qc);
      const on = v.on ?? colomboToday();
      const patch = (x: Movie | Show) => ({
        status: v.status,
        finishedAt: v.status === 'watched' ? on : x.finishedAt,
        startedAt: v.status === 'watching' ? (x.startedAt ?? on) : x.startedAt,
      });
      patchMovie(qc, v.itemId, (m) => patch(m) as Partial<Movie>);
      patchShow(qc, v.itemId, (x) => patch(x) as Partial<Show>);
      leaveQueue(qc, v.itemId, v.status, (e) => requeue.mutate(e));
      return s;
    },
    onError: (_e, _v, ctx) => {
      restoreSnap(qc, ctx);
      failed();
    },
    onSettled: (_d, _e, v) => settleMedia(qc, v.itemId),
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation<void, Error, api.CollectionVars>({
    mutationKey: mk.collectionCreate,
    scope: MEDIA_SCOPE,
    onError: () => failed(),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.collections }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation<void, Error, { itemId: string }, Snap>({
    mutationKey: mk.itemDelete,
    scope: MEDIA_SCOPE,
    onMutate: async (v) => {
      const s = await snap(qc);
      qc.setQueryData<Movie[]>(MOVIES, (l) => l?.filter((m) => m.id !== v.itemId));
      qc.setQueryData<Show[]>(SHOWS, (l) => l?.filter((m) => m.id !== v.itemId));
      qc.setQueryData<ShowProgress[]>(PROGRESS, (l) => l?.filter((m) => m.itemId !== v.itemId));
      return s;
    },
    onError: (_e, _v, ctx) => {
      restoreSnap(qc, ctx);
      failed();
    },
    onSettled: (_d, _e, v) => settleMedia(qc, v.itemId),
  });
}

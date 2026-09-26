import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';
import { qk } from '@/lib/queryKeys';
import { toast, useToastStore } from '@/lib/stores/toast';

import { SHOWS, useIncludeSpecials, useMarkEpisodes, useMarkSeason, useSetMediaStatus } from './hooks';
import { airedIn, epCode, epKey, finishedShow, progressOf, type Season, watchSet } from './logic';
import type { Episode, EpisodeRef, Show } from './types';

/**
 * Marking episodes (plan §11.5), shared by show detail and Home: tap one, hold a season, paint a
 * run. Each change is optimistic; seasons and paints get an Undo; the last episode of an ended show
 * asks whether to mark the whole show watched (plan §11.1).
 */
export function useShowMarker(show: Pick<Show, 'id' | 'tmdbId' | 'title' | 'tmdbStatus'>) {
  const qc = useQueryClient();
  const mark = useMarkEpisodes();
  const season = useMarkSeason();
  const setStatus = useSetMediaStatus();
  const specials = useIncludeSpecials();

  const watched = () => watchSet(qc.getQueryData<EpisodeRef[]>(qk.watches(show.id)) ?? []);

  /** After an optimistic mark: was that the last episode of a finished show? */
  const maybeFinished = () => {
    const eps = qc.getQueryData<Episode[]>(qk.episodes(show.tmdbId));
    const status = qc.getQueryData<Show[]>(SHOWS)?.find((s) => s.id === show.id)?.status ?? 'watching';
    if (!eps) return;
    const p = progressOf(eps, watched(), colomboToday(), specials);
    if (!finishedShow(show.tmdbStatus, status, p)) return;
    useToastStore.getState().enqueue({
      message: copy.shows.lastEpisode(show.title),
      action: {
        label: copy.shows.markWatched,
        onPress: () => setStatus.mutate({ itemId: show.id, status: 'watched' }),
      },
    });
  };

  const undo = (s: number, episodes: number[], was: boolean) => ({
    label: copy.common.undo,
    onPress: () => {
      useToastStore.getState().clearQueue();
      mark.mutate({ itemId: show.id, season: s, episodes, watched: was });
    },
  });

  /** Toggle one episode. `announce` adds a toast with Undo (Home and the Next up card). */
  const toggle = (e: Pick<Episode, 'season' | 'episode'>, { announce = false } = {}) => {
    const was = watched().has(epKey(e.season, e.episode));
    mark.mutate({ itemId: show.id, season: e.season, episodes: [e.episode], watched: !was });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (announce) {
      const code = epCode(e.season, e.episode);
      toast({
        message: was ? copy.shows.unmarked(code) : copy.shows.marked(code),
        action: undo(e.season, [e.episode], was),
      });
    }
    if (!was) maybeFinished();
  };

  /** Hold still on a season: every aired episode of it (like SQL `mark_season`). */
  const fillSeason = (s: Season): number[] => {
    const have = watched();
    const fresh = airedIn(s, colomboToday()).filter((n) => !have.has(epKey(s.n, n)));
    if (!fresh.length) return [];
    season.mutate({ itemId: show.id, season: s.n, episodes: fresh });
    toast({ message: copy.shows.seasonMarked(copy.shows.season(s.n)), action: undo(s.n, fresh, false) });
    maybeFinished();
    return fresh;
  };

  /** Hold then drag across squares: mark every aired, unwatched one touched, in one write. */
  const paint = (s: number, episodes: number[]) => {
    const have = watched();
    const fresh = [...new Set(episodes)].filter((n) => !have.has(epKey(s, n)));
    if (!fresh.length) return;
    mark.mutate({ itemId: show.id, season: s, episodes: fresh, watched: true });
    toast({ message: copy.shows.painted(fresh.length), action: undo(s, fresh, false) });
    maybeFinished();
  };

  return { toggle, fillSeason, paint };
}

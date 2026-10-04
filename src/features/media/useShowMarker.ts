import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';

import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';
import { qk } from '@/lib/queryKeys';
import { toast, useToastStore } from '@/lib/stores/toast';
import type { WhenVars } from '@/lib/when';

import { SHOWS, useIncludeSpecials, useMarkEpisodes, useMarkSeason, useSetMediaStatus } from './hooks';
import { airedIn, epCode, epKey, finishedShow, progressOf, type Season, watchSet } from './logic';
import type { Episode, EpisodeRef, Show } from './types';

/**
 * Marking episodes (plan §11.5), shared by show detail, the episode sheet and Home: tick one or mark a
 * season. Each change is optimistic; seasons get an Undo; the last episode of
 * an ended show asks whether to mark the whole show watched (plan §11.1). The returned callbacks are
 * stable, so memoised season panels don't re-render on every change.
 */
export function useShowMarker(show: Pick<Show, 'id' | 'tmdbId' | 'title' | 'tmdbStatus'>) {
  const qc = useQueryClient();
  const markEpisodes = useMarkEpisodes().mutate;
  const markSeason = useMarkSeason().mutate;
  const setStatus = useSetMediaStatus().mutate;
  const specials = useIncludeSpecials();
  const { id, tmdbId, title, tmdbStatus } = show;

  const watched = useCallback(() => watchSet(qc.getQueryData<EpisodeRef[]>(qk.watches(id)) ?? []), [qc, id]);

  /** After an optimistic mark: was that the last episode of a finished show? */
  const maybeFinished = useCallback(() => {
    const eps = qc.getQueryData<Episode[]>(qk.episodes(tmdbId));
    const status = qc.getQueryData<Show[]>(SHOWS)?.find((s) => s.id === id)?.status ?? 'watching';
    if (!eps) return;
    const p = progressOf(eps, watched(), colomboToday(), specials);
    if (!finishedShow(tmdbStatus, status, p)) return;
    useToastStore.getState().enqueue({
      message: copy.shows.lastEpisode(title),
      action: { label: copy.shows.markWatched, onPress: () => setStatus({ itemId: id, status: 'watched' }) },
    });
  }, [qc, tmdbId, id, title, tmdbStatus, specials, watched, setStatus]);

  const undo = useCallback(
    (s: number, episodes: number[], was: boolean) => ({
      label: copy.common.undo,
      onPress: () => {
        useToastStore.getState().clearQueue();
        markEpisodes({ itemId: id, season: s, episodes, watched: was });
      },
    }),
    [id, markEpisodes],
  );

  /** Toggle one episode. `announce` adds a toast with Undo (Home, the sheet and the Next up card). */
  const toggle = useCallback(
    (e: Pick<Episode, 'season' | 'episode'>, { announce = false } = {}) => {
      const was = watched().has(epKey(e.season, e.episode));
      markEpisodes({
        itemId: id,
        season: e.season,
        episodes: [e.episode],
        watched: !was,
        at: new Date().toISOString(),
      });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (announce) {
        const code = epCode(e.season, e.episode);
        toast({
          message: was ? copy.shows.unmarked(code) : copy.shows.marked(code),
          action: undo(e.season, [e.episode], was),
        });
      }
      if (!was) maybeFinished();
    },
    [id, watched, markEpisodes, undo, maybeFinished],
  );

  /** Every aired episode of a season (like SQL `mark_season`); `when` = "a while ago", maybe dated. */
  const fillSeason = useCallback(
    (s: Season, when?: WhenVars): number[] => {
      const have = watched();
      const fresh = airedIn(s, colomboToday()).filter((n) => !have.has(epKey(s.n, n)));
      if (!fresh.length) return [];
      markSeason({ itemId: id, season: s.n, episodes: fresh, ...when });
      toast({ message: copy.shows.seasonMarked(copy.shows.season(s.n)), action: undo(s.n, fresh, false) });
      maybeFinished();
      return fresh;
    },
    [id, watched, markSeason, undo, maybeFinished],
  );

  /** Every watched episode of a season back to unwatched, in one write, with Undo. */
  const clearSeason = useCallback(
    (s: Season): number[] => {
      const have = watched();
      const seen = s.episodes.filter((e) => have.has(epKey(s.n, e.episode))).map((e) => e.episode);
      if (!seen.length) return [];
      markEpisodes({ itemId: id, season: s.n, episodes: seen, watched: false });
      toast({ message: copy.shows.seasonUnmarked(copy.shows.season(s.n)), action: undo(s.n, seen, true) });
      return seen;
    },
    [id, watched, markEpisodes, undo],
  );

  return useMemo(() => ({ toggle, fillSeason, clearSeason }), [toggle, fillSeason, clearSeason]);
}

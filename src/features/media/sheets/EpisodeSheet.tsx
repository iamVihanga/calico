import { tmdbImage } from '@shared/tmdb.ts';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ds/Button';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { colomboToday, fmtDay } from '@/lib/dates';
import { radius, useTheme } from '@/theme';

import { useProgress, useShow } from '../hooks';
import { epKey } from '../logic';
import { useShowMarker } from '../useShowMarker';

type Props = { itemId: string; season: number; episode: number; showLink?: boolean; onClose: () => void };

/** One episode from show detail: still, name, date, runtime, rating, overview, and Mark watched. */
export function EpisodeSheetBody({ itemId, season, episode, showLink = false, onClose }: Props) {
  const show = useShow(itemId).data;
  const progress = useProgress(show);
  if (!show || !progress) return null;
  return (
    <EpisodeDetail
      show={show}
      progress={progress}
      season={season}
      episode={episode}
      showLink={showLink}
      onClose={onClose}
    />
  );
}

function EpisodeDetail({
  show,
  progress,
  season,
  episode,
  showLink,
  onClose,
}: {
  show: NonNullable<ReturnType<typeof useShow>['data']>;
  progress: NonNullable<ReturnType<typeof useProgress>>;
  season: number;
  episode: number;
  showLink: boolean;
  onClose: () => void;
}) {
  const { t } = useTheme();
  const marker = useShowMarker(show);
  const e = progress.episodes.find((x) => x.season === season && x.episode === episode);
  if (!e) return null;
  const today = colomboToday();
  const aired = !!e.airDate && e.airDate <= today;
  const watched = progress.watchedSet.has(epKey(season, episode));
  const still = tmdbImage(e.stillPath, 'original');
  const meta = [
    e.airDate
      ? aired
        ? copy.shows.aired(fmtDay(e.airDate))
        : copy.shows.airs(fmtDay(e.airDate))
      : copy.shows.notAired,
    e.runtimeMin ? copy.episodeSheet.minutes(e.runtimeMin) : null,
    e.voteAverage !== null ? `${copy.shows.tmdb} ${e.voteAverage.toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const overview = e.overview === null ? copy.episodeSheet.loadingOverview : e.overview || copy.episodeSheet.noOverview;

  return (
    <View style={{ gap: 14 }} testID="episode-sheet">
      {still && (
        <View
          style={{ aspectRatio: 16 / 9, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.surfaceSunk }}
        >
          <Image source={{ uri: still }} cachePolicy="disk" contentFit="cover" style={{ flex: 1 }} />
        </View>
      )}
      <View style={{ gap: 4 }}>
        <Txt family="ui" weight={700} size="xs" color="textAccent">
          {`${show.title} · ${copy.episodeSheet.code(season, episode)}`}
        </Txt>
        <Txt family="display" weight={700} size={22} leading={1.2} accessibilityRole="header">
          {e.name ?? copy.episodeSheet.code(season, episode)}
        </Txt>
        <Txt family="ui" size="2xs" color="textMuted">
          {meta}
        </Txt>
      </View>
      <Txt
        family={e.overview ? 'ui' : 'hand'}
        size={e.overview ? 15 : 18}
        leading={1.5}
        color={e.overview ? 'textSecondary' : 'textMuted'}
        testID="episode-overview"
      >
        {overview}
      </Txt>
      <Button
        variant={watched ? 'secondary' : 'accent'}
        block
        disabled={!aired}
        testID="episode-mark"
        onPress={() => {
          marker.toggle(e, { announce: true });
          onClose();
        }}
      >
        {!aired
          ? copy.episodeSheet.notAired
          : watched
            ? copy.episodeSheet.markUnwatched
            : copy.episodeSheet.markWatched}
      </Button>
      {showLink && (
        <Button
          variant="secondary"
          block
          testID="episode-go-to-show"
          onPress={() => {
            onClose();
            router.push(`/show/${show.id}`);
          }}
        >
          {copy.episodeSheet.goToShow}
        </Button>
      )}
    </View>
  );
}

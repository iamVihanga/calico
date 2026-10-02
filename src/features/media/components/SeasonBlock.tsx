import { tmdbImage } from '@shared/tmdb.ts';
import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { fmtDay, type LocalDate } from '@/lib/dates';
import { motion, radius, shadow, useTheme } from '@/theme';

import { epKey, type Season } from '../logic';
import type { Episode } from '../types';

type Props = {
  season: Season;
  watched: Set<string>;
  /** Watched episode numbers of this season, joined: re-render only when this season changes. */
  seenSig: string;
  today: LocalDate;
  expanded: boolean;
  onToggleExpand: (season: number) => void;
  onToggleEpisode: (e: Episode) => void;
  onOpenEpisode: (e: Episode) => void;
  onFillSeason: (s: Season) => void;
};

const isAired = (e: Episode, today: LocalDate) => !!e.airDate && e.airDate <= today;

/**
 * One season as an accordion panel (user's design, replacing the square grid): collapsed it's
 * "Season N" and "watched/total"; open it adds "Mark all … watched" and the episode list. The screen
 * keeps only one open. Tapping a row opens the episode sheet; the circle on the right ticks it.
 */
function SeasonBlockView({
  season,
  watched,
  today,
  expanded,
  onToggleExpand,
  onToggleEpisode,
  onOpenEpisode,
  onFillSeason,
}: Props) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const eps = season.episodes;
  const label = copy.shows.season(season.n);
  const airedCount = eps.filter((e) => isAired(e, today)).length;
  const seenCount = eps.filter((e) => watched.has(epKey(e.season, e.episode))).length;

  return (
    <Animated.View
      layout={reduced ? undefined : LinearTransition.duration(motion.duration.base)}
      style={{ backgroundColor: t.surfaceCard, borderRadius: radius.lg, boxShadow: shadow.sm, overflow: 'hidden' }}
      testID={`season-${season.n}`}
    >
      <Press
        accessibilityRole="button"
        accessibilityLabel={copy.shows.seasonA11y(label, seenCount, eps.length)}
        accessibilityState={{ expanded }}
        onPress={() => onToggleExpand(season.n)}
        scaleTo={1}
        pressedStyle={{ backgroundColor: t.surfaceQuiet }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 58,
          paddingHorizontal: 16,
        }}
        testID={`season-toggle-${season.n}`}
      >
        <Txt family="display" weight={700} size={17} style={{ flex: 1 }}>
          {label}
        </Txt>
        <View
          style={{
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: radius.pill,
            backgroundColor: t.surfaceSunk,
          }}
        >
          <Txt family="ui" weight={700} size="3xs" color="textSecondary" testID={`season-count-${season.n}`}>
            {airedCount === 0 ? copy.shows.coming : `${seenCount}/${eps.length}`}
          </Txt>
        </View>
        <Icon name={expanded ? 'expand_less' : 'expand_more'} size={22} color="textMuted" />
      </Press>

      {expanded && (
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(motion.duration.base)}
          style={{ paddingHorizontal: 16, paddingBottom: 6 }}
        >
          {airedCount > seenCount && (
            <Press
              accessibilityRole="button"
              onPress={() => onFillSeason(season)}
              style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
              testID={`fill-${season.n}`}
            >
              <Txt family="ui" weight={700} size="xs" color="textAccent">
                {copy.shows.fillSeason(label)}
              </Txt>
            </Press>
          )}
          {eps.map((e) => (
            <EpisodeListRow
              key={e.episode}
              e={e}
              watched={watched.has(epKey(e.season, e.episode))}
              aired={isAired(e, today)}
              onToggle={onToggleEpisode}
              onOpen={onOpenEpisode}
            />
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** `watched` is a new Set after every mark; compare this season's signature instead. */
export const SeasonBlock = memo(
  SeasonBlockView,
  (a, b) =>
    a.season === b.season &&
    a.seenSig === b.seenSig &&
    a.today === b.today &&
    a.expanded === b.expanded &&
    a.onToggleExpand === b.onToggleExpand &&
    a.onToggleEpisode === b.onToggleEpisode &&
    a.onOpenEpisode === b.onOpenEpisode &&
    a.onFillSeason === b.onFillSeason,
);

const STILL_TINTS = ['surfaceSunk', 'surfaceAccentSoft', 'statusInfoSoft', 'statusSuccessSoft'] as const;

const EpisodeListRow = memo(function EpisodeListRow({
  e,
  watched,
  aired,
  onToggle,
  onOpen,
}: {
  e: Episode;
  watched: boolean;
  aired: boolean;
  onToggle: (e: Episode) => void;
  onOpen: (e: Episode) => void;
}) {
  const { t } = useTheme();
  const still = tmdbImage(e.stillPath, 'w300');
  const when = e.airDate
    ? aired
      ? copy.shows.aired(fmtDay(e.airDate))
      : copy.shows.airs(fmtDay(e.airDate))
    : copy.shows.notAired;
  const state = watched ? copy.episode.watched : aired ? copy.episode.notWatched : copy.episode.notAired;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: t.borderHairline,
      }}
    >
      <Press
        accessibilityRole="button"
        accessibilityLabel={copy.shows.square(e.season, e.episode, e.name, state)}
        accessibilityHint={copy.episodeSheet.openHint}
        onPress={() => onOpen(e)}
        scaleTo={1}
        pressedStyle={{ opacity: 0.7 }}
        style={{ flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10 }}
        testID={`episode-row-${e.season}-${e.episode}`}
      >
        <View
          style={{
            width: 76,
            height: 43,
            borderRadius: radius.xs,
            overflow: 'hidden',
            backgroundColor: t[STILL_TINTS[e.episode % 4]!],
          }}
        >
          {still && (
            <Image source={{ uri: still }} cachePolicy="disk" contentFit="cover" style={StyleSheet.absoluteFill} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt family="ui" weight={600} size={14} numberOfLines={1}>
            {`E${e.episode}  ${e.name ?? ''}`}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
            {e.voteAverage !== null && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 2,
                  paddingHorizontal: 7,
                  borderRadius: radius.xs,
                  backgroundColor: t.statusWarningSoft,
                }}
              >
                <Txt family="ui" weight={700} size={9} tint={t.inkOnWarm} style={{ letterSpacing: 0.5 }}>
                  {copy.shows.tmdb}
                </Txt>
                <Txt family="ui" weight={700} size={11} tint={t.inkOnWarm}>
                  {e.voteAverage.toFixed(1)}
                </Txt>
              </View>
            )}
            <Txt family="ui" size="2xs" color="textMuted">
              {when}
            </Txt>
          </View>
        </View>
      </Press>
      <Press
        accessibilityRole="checkbox"
        accessibilityState={{ checked: watched, disabled: !aired }}
        accessibilityLabel={copy.episodeSheet.tick(e.season, e.episode)}
        disabled={!aired}
        onPress={() => onToggle(e)}
        style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        testID={`episode-tick-${e.season}-${e.episode}`}
      >
        <Icon
          name={watched ? 'check_circle' : 'radio_button_unchecked'}
          size={24}
          tint={watched ? t.accentPrimary : aired ? t.borderStrong : t.borderSoft}
        />
      </Press>
    </View>
  );
});

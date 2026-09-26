import { tmdbImage } from '@shared/tmdb.ts';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { useProgress, useShowProgress, useShows } from '@/features/media/hooks';
import { epCode } from '@/features/media/logic';
import type { Show, ShowProgress } from '@/features/media/types';
import { useShowMarker } from '@/features/media/useShowMarker';
import { copy } from '@/i18n/en';
import { colomboToday, fmtDay } from '@/lib/dates';
import { alpha, layout, palette, radius, shadow, size, tracking, useTheme } from '@/theme';

/** One Watching show with an episode to watch (prototype homeV `watchTitle` / `markWatched`). */
function WatchCard({ show, row }: { show: Show; row: ShowProgress }) {
  const { t } = useTheme();
  const live = useProgress(show); // advances instantly after the tick
  const marker = useShowMarker(show);
  const next = live ? live.next : row.next;
  const backdrop = tmdbImage(show.backdropPath, 'w780');
  if (!next) return null;
  const code = epCode(next.season, next.episode);
  const open = () => router.push(`/show/${show.id}`);

  return (
    <View
      style={{ backgroundColor: t.surfaceCard, borderRadius: radius.lg, boxShadow: shadow.sm, overflow: 'hidden' }}
      testID={`watching-${show.id}`}
    >
      <Press
        accessibilityRole="button"
        accessibilityLabel={show.title}
        onPress={open}
        scaleTo={1}
        style={{
          height: 164,
          justifyContent: 'flex-end',
          padding: 16,
          backgroundColor: palette.ink,
          experimental_backgroundImage: `linear-gradient(140deg, ${palette.fern}, ${palette.ink})`,
        }}
      >
        {backdrop && (
          <>
            <Image source={{ uri: backdrop }} cachePolicy="disk" contentFit="cover" style={StyleSheet.absoluteFill} />
            <View
              style={[
                StyleSheet.absoluteFill,
                { experimental_backgroundImage: `linear-gradient(180deg, transparent 35%, ${alpha.ink56} 100%)` },
              ]}
            />
          </>
        )}
        {!!show.network && (
          <View
            style={{
              position: 'absolute',
              right: 14,
              top: 14,
              paddingVertical: 5,
              paddingHorizontal: 9,
              borderRadius: radius.pill,
              backgroundColor: alpha.cream16,
            }}
          >
            <Txt
              family="ui"
              weight={700}
              size={10}
              tint={palette.cream}
              style={{ letterSpacing: tracking.caps * size['3xs'], textTransform: 'uppercase' }}
            >
              {show.network}
            </Txt>
          </View>
        )}
        <Txt family="display" weight={700} size={20} leading={1.15} tint={palette.cream}>
          {show.title}
        </Txt>
      </Press>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt
            family="ui"
            weight={700}
            size="xs"
            color="textAccent"
            numberOfLines={1}
            style={{ letterSpacing: tracking.wide * size.xs }}
            testID={`watching-ep-${show.id}`}
          >
            {next.name ? `${code}  ${next.name}` : code}
          </Txt>
          <Txt family="hand" weight={400} size={17} color="textMuted">
            {copy.shows.tickHint}
          </Txt>
        </View>
        <Press
          accessibilityRole="button"
          accessibilityLabel={copy.shows.markNext(code)}
          testID={`watching-tick-${show.id}`}
          onPress={() => marker.toggle(next, { announce: true })}
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.accentPrimary,
            boxShadow: shadow.md,
          }}
        >
          <Icon name="check" size={24} tint={t.textOnAccent} />
        </Press>
      </View>
    </View>
  );
}

/**
 * Home "Continue watching": a card per Watching show with a next episode, then a line for each
 * Watching show you're caught up on (prototype homeV). Hidden when there's nothing to watch.
 */
export function ContinueWatching() {
  const shows = useShows().data ?? [];
  const rows = useShowProgress().data ?? [];
  const today = colomboToday();
  const byId = new Map(rows.map((r) => [r.itemId, r]));
  const watching = shows.filter((s) => s.status === 'watching' && byId.has(s.id));
  const withNext = watching.filter((s) => byId.get(s.id)!.next);
  const caughtUp = watching.filter((s) => !byId.get(s.id)!.next);
  if (watching.length === 0) return null;

  return (
    <View style={{ paddingBottom: 26 }} testID="continue-watching">
      <Txt
        family="display"
        weight={700}
        size={22}
        accessibilityRole="header"
        style={{ paddingHorizontal: layout.gutterScreen, paddingBottom: 12, letterSpacing: -0.02 * 22 }}
      >
        {copy.shows.continueWatching}
      </Txt>
      <View style={{ gap: 14, paddingHorizontal: layout.gutterScreen }}>
        {withNext.map((s) => (
          <WatchCard key={s.id} show={s} row={byId.get(s.id)!} />
        ))}
        {caughtUp.map((s) => (
          <Txt key={s.id} family="ui" size="2xs" color="textMuted" style={{ paddingHorizontal: 4 }}>
            {copy.shows.caughtUpLine(s.title, s.nextAirDate && s.nextAirDate >= today ? fmtDay(s.nextAirDate) : null)}
          </Txt>
        ))}
      </View>
    </View>
  );
}

import { tmdbImage } from '@shared/tmdb.ts';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { habitOf, inHabitWindow, orderWatching, sessionsByShow } from '@/features/media/habits';
import { useProgress, useShowProgress, useShows, useWatchSessions } from '@/features/media/hooks';
import { countdown, epCode, upcomingShows } from '@/features/media/logic';
import type { Show, ShowProgress } from '@/features/media/types';
import { useShowMarker } from '@/features/media/useShowMarker';
import { copy } from '@/i18n/en';
import { openSheet } from '@/lib/stores/sheet';
import { colomboToday } from '@/lib/dates';
import { useHourNow } from '@/lib/useHourNow';
import { alpha, layout, motion, palette, radius, shadow, size, tracking, useTheme } from '@/theme';

/** One Watching show with an episode to watch (prototype homeV `watchTitle` / `markWatched`). */
function WatchCard({ show, row }: { show: Show; row: ShowProgress }) {
  const { t } = useTheme();
  const live = useProgress(show); // advances instantly after the tick
  const marker = useShowMarker(show);
  const next = live ? live.next : row.next;
  if (!next) return null;
  const code = epCode(next.season, next.episode);
  // The next episode's still when TMDB has one, else the show's backdrop.
  const still = tmdbImage(next.stillPath, 'original');
  const image = still ?? tmdbImage(show.backdropPath, 'w780');
  // The episode's sheet (overview, Mark watched, Go to show): instant, unlike opening show detail.
  const open = () =>
    openSheet('episode', { itemId: show.id, season: next.season, episode: next.episode, showLink: true });

  return (
    <View
      style={{ backgroundColor: t.surfaceCard, borderRadius: radius.lg, boxShadow: shadow.sm, overflow: 'hidden' }}
      testID={`watching-${show.id}`}
    >
      <Press
        accessibilityRole="button"
        accessibilityLabel={`${show.title}, ${code}`}
        accessibilityHint={copy.episodeSheet.openHint}
        testID={`watching-open-${show.id}`}
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
        {image && (
          <>
            <Image
              source={{ uri: image }}
              cachePolicy="disk"
              contentFit="cover"
              transition={motion.duration.base}
              style={StyleSheet.absoluteFill}
              testID={still ? `watching-still-${show.id}` : undefined}
            />
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
        {still && (
          <Txt
            family="ui"
            weight={700}
            size="3xs"
            tint={palette.cream}
            style={{ letterSpacing: tracking.wide * size['3xs'], marginBottom: 2 }}
          >
            {code}
          </Txt>
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
 * Home "Continue watching": a card per Watching show with a next episode (shows on hold left out),
 * then a link to what's coming up for shows you're caught up on. "On hold · N" on the title row opens
 * the shows put on hold. Hidden when there's nothing to show.
 */
export function ContinueWatching() {
  const { t } = useTheme();
  const shows = useShows().data ?? [];
  const rows = useShowProgress().data ?? [];
  const today = colomboToday();
  const byId = new Map(rows.map((r) => [r.itemId, r]));
  const watching = shows.filter((s) => s.status === 'watching' && byId.has(s.id));
  const held = watching.filter((s) => s.onHold).length;
  const sessions = useWatchSessions().data ?? [];
  const now = useHourNow();
  // What you usually watch around this time comes first (habits from your episode ticks).
  const withNext = orderWatching(
    watching.filter((s) => !s.onHold && byId.get(s.id)!.next),
    sessions,
    now,
  );
  const { dated, undated } = upcomingShows(shows, rows);
  if (withNext.length + dated.length + undated.length + held === 0) return null;
  const first = withNext[0];
  const habit = first ? habitOf(sessionsByShow(sessions).get(first.id) ?? [], now) : null;
  const usual =
    first && habit && inHabitWindow(habit, now) ? copy.habits.usual(first.title, copy.habits.time(habit.hour)) : null;
  const soonest = dated[0];

  return (
    <View style={{ paddingBottom: 26 }} testID="continue-watching">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: layout.gutterScreen,
          paddingBottom: 12,
        }}
      >
        <Txt
          family="display"
          weight={700}
          size={22}
          accessibilityRole="header"
          style={{ flex: 1, letterSpacing: -0.02 * 22 }}
        >
          {copy.shows.continueWatching}
        </Txt>
        {held > 0 && (
          <Press
            accessibilityRole="button"
            accessibilityLabel={copy.onHold.linkA11y(held)}
            onPress={() => openSheet('onHold')}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: radius.pill,
              backgroundColor: t.surfaceSunk,
            }}
            testID="watching-on-hold"
          >
            <Txt family="ui" weight={700} size="3xs" color="textSecondary">
              {copy.onHold.link(held)}
            </Txt>
          </Press>
        )}
      </View>
      {usual && (
        <Txt
          family="hand"
          weight={400}
          size="md"
          color="textAccent"
          testID="watching-usual"
          style={{ paddingHorizontal: layout.gutterScreen, marginTop: -8, paddingBottom: 10 }}
        >
          {usual}
        </Txt>
      )}
      <View style={{ gap: 14, paddingHorizontal: layout.gutterScreen }}>
        {withNext.map((s) => (
          <WatchCard key={s.id} show={s} row={byId.get(s.id)!} />
        ))}
        {dated.length + undated.length > 0 && (
          <Press
            accessibilityRole="button"
            accessibilityHint={copy.upcoming.linkA11y}
            onPress={() => openSheet('upcoming')}
            scaleTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: t.borderStrong,
            }}
            testID="watching-upcoming"
          >
            <Icon name="calendar_today" size={20} color="textAccent" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt family="ui" weight={700} size={14}>
                {copy.upcoming.link(dated.length, undated.length)}
              </Txt>
              {soonest && (
                <Txt family="ui" size="2xs" color="textMuted" numberOfLines={1}>
                  {copy.upcoming.linkNext(soonest.title, countdown(soonest.nextAirDate!, today))}
                </Txt>
              )}
            </View>
            <Icon name="arrow_forward" size={20} color="textMuted" />
          </Press>
        )}
      </View>
    </View>
  );
}

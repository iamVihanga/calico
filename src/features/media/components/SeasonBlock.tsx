import { tmdbImage } from '@shared/tmdb.ts';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { memo, useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';

import { EPISODE_SQUARE, EpisodeSquare, type EpisodeState } from '@/components/calico/EpisodeSquare';
import { Icon } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { fmtDay, type LocalDate } from '@/lib/dates';
import { radius, shadow, useTheme } from '@/theme';

import { epKey, type Season } from '../logic';
import type { Episode } from '../types';

const GAP = 7;
const PITCH = EPISODE_SQUARE + GAP;
const HOLD_ACTIVATE_MS = 250;
const HOLD_FILL_MS = 550; // hold still this long (from touch down) to fill the season
const MOVE_SLOP = 8;
const FILL_STAGGER_MS = 30;
const TIP_MS = 1000;

type Marker = {
  toggle: (e: Episode) => void;
  fillSeason: (s: Season) => number[];
  paint: (season: number, episodes: number[]) => void;
};

type Props = {
  season: Season;
  watched: Set<string>;
  next: Episode | null;
  today: LocalDate;
  expanded: boolean;
  onExpand: () => void;
  marker: Marker;
};

/**
 * One season (plan §11.5 SeasonRow + EpisodeGrid): a label that expands into the episode list, and a
 * wrapped grid of squares. Tap toggles one (with its name for a second); hold still fills the season,
 * left to right; hold then drag paints a run, committed once on release. The expanded list and
 * "Mark all watched" are the visible alternatives to the gestures.
 */
export const SeasonBlock = memo(function SeasonBlock({
  season,
  watched,
  next,
  today,
  expanded,
  onExpand,
  marker,
}: Props) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [painted, setPainted] = useState<Set<number>>(new Set());
  const [fill, setFill] = useState<{ eps: number[]; shown: number } | null>(null);
  const [tip, setTip] = useState<{ index: number; text: string } | null>(null);
  const [g] = useState(holdController);

  const eps = season.episodes;
  const label = copy.shows.season(season.n);
  const isAired = (e: Episode) => !!e.airDate && e.airDate <= today;
  const airedCount = eps.filter(isAired).length;
  const seenCount = eps.filter((e) => watched.has(epKey(e.season, e.episode))).length;
  const perRow = Math.max(1, Math.floor((width + GAP) / PITCH));

  const at = (x: number, y: number): Episode | null => {
    const col = Math.floor(x / PITCH);
    const row = Math.floor(y / PITCH);
    if (x < 0 || y < 0 || col >= perRow) return null;
    return eps[row * perRow + col] ?? null;
  };

  // Fill animation: squares light up left to right with a light tick each (plan §11.5).
  useEffect(() => {
    if (!fill) return;
    const id = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFill((f) => (!f || f.shown + 1 >= f.eps.length ? null : { ...f, shown: f.shown + 1 }));
    }, FILL_STAGGER_MS);
    return () => clearTimeout(id);
  }, [fill]);

  useEffect(() => {
    if (!tip) return;
    const id = setTimeout(() => setTip(null), TIP_MS);
    return () => clearTimeout(id);
  }, [tip]);

  const doFill = () => {
    const fresh = marker.fillSeason(season);
    if (fresh.length && !reduced) setFill({ eps: fresh, shown: 0 });
  };

  const tap = Gesture.Tap()
    .withTestId(`tap-${season.n}`)
    .runOnJS(true)
    .onEnd((e, ok) => {
      if (!ok) return;
      const ep = at(e.x, e.y);
      if (!ep || !isAired(ep)) return;
      marker.toggle(ep);
      setTip({ index: eps.indexOf(ep), text: `E${ep.episode}${ep.name ? ` · ${ep.name}` : ''}` });
    });

  const paintable = (x: number, y: number) => {
    const ep = at(x, y);
    return ep && isAired(ep) ? ep.episode : null;
  };
  const hold = Gesture.Pan()
    .withTestId(`hold-${season.n}`)
    .runOnJS(true)
    .activateAfterLongPress(HOLD_ACTIVATE_MS)
    .onStart((e) => g.start(e.x, e.y, doFill))
    .onUpdate((e) => {
      const set = g.move(e.x, e.y, paintable);
      if (set) {
        setPainted(set);
        void Haptics.selectionAsync();
      }
    })
    .onEnd(() => g.end((eps) => marker.paint(season.n, eps)))
    .onFinalize(() => {
      g.cancel();
      setPainted(new Set());
    });

  const stateOf = (e: Episode): EpisodeState => {
    if (!isAired(e)) return 'unaired';
    const filling = fill && fill.eps.indexOf(e.episode) >= fill.shown;
    if ((watched.has(epKey(e.season, e.episode)) && !filling) || painted.has(e.episode)) return 'watched';
    return next && next.season === e.season && next.episode === e.episode ? 'next' : 'unwatched';
  };

  return (
    <View
      style={{
        backgroundColor: t.surfaceCard,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        padding: 14,
        paddingHorizontal: 16,
      }}
      testID={`season-${season.n}`}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Press
          accessibilityRole="button"
          accessibilityLabel={expanded ? copy.shows.collapse(label) : copy.shows.expand(label)}
          accessibilityState={{ expanded }}
          accessibilityActions={airedCount ? [{ name: 'fill', label: copy.shows.fillSeason(label) }] : []}
          onAccessibilityAction={(e) => e.nativeEvent.actionName === 'fill' && doFill()}
          onPress={onExpand}
          scaleTo={1}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44 }}
        >
          <Txt family="display" weight={700} size={17}>
            {label}
          </Txt>
          <Icon name={expanded ? 'expand_less' : 'expand_more'} size={18} color="textMuted" />
        </Press>
        <View
          style={{
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: radius.pill,
            backgroundColor: t.surfaceSunk,
          }}
        >
          <Txt family="ui" weight={700} size="3xs" color="textSecondary">
            {airedCount === 0 ? copy.shows.coming : `${seenCount}/${eps.length}`}
          </Txt>
        </View>
      </View>

      {!expanded ? (
        <GestureDetector gesture={Gesture.Exclusive(hold, tap)}>
          <View
            pointerEvents="box-only"
            onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}
            testID={`grid-${season.n}`}
          >
            {eps.map((e) => (
              <EpisodeSquare
                key={e.episode}
                season={e.season}
                episode={e.episode}
                name={e.name ?? undefined}
                state={stateOf(e)}
                onPress={() => marker.toggle(e)}
              />
            ))}
            {tip && (
              <View
                pointerEvents="none"
                style={[
                  styles.tip,
                  {
                    backgroundColor: t.textPrimary,
                    left: Math.min((tip.index % perRow) * PITCH, Math.max(0, width - 180)),
                    top: Math.floor(tip.index / perRow) * PITCH - 30,
                  },
                ]}
              >
                <Txt family="ui" weight={600} size="3xs" tint={t.surfacePage} numberOfLines={1}>
                  {tip.text}
                </Txt>
              </View>
            )}
          </View>
        </GestureDetector>
      ) : (
        <View>
          {airedCount > seenCount && (
            <Press
              accessibilityRole="button"
              onPress={doFill}
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
              aired={isAired(e)}
              onToggle={() => marker.toggle(e)}
            />
          ))}
        </View>
      )}
    </View>
  );
});

/**
 * The hold gesture's own state (outside React state so moves don't re-render): where the finger went
 * down, whether it has become a paint, which episodes were painted, and the "hold still" timer.
 */
export function holdController() {
  let x0 = 0;
  let y0 = 0;
  let painting = false;
  let set = new Set<number>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    start(x: number, y: number, onHeld: () => void) {
      x0 = x;
      y0 = y;
      painting = false;
      set = new Set();
      timer = setTimeout(() => !painting && onHeld(), HOLD_FILL_MS - HOLD_ACTIVATE_MS);
    },
    /** Returns the painted set when it grew. */
    move(x: number, y: number, paintable: (x: number, y: number) => number | null): Set<number> | null {
      if (!painting && Math.hypot(x - x0, y - y0) > MOVE_SLOP) {
        painting = true;
        clearTimeout(timer);
        const first = paintable(x0, y0);
        if (first !== null) set.add(first);
      }
      if (!painting) return null;
      const ep = paintable(x, y);
      if (ep === null || set.has(ep)) return null;
      set.add(ep);
      return new Set(set);
    },
    end(commit: (episodes: number[]) => void) {
      clearTimeout(timer);
      if (painting && set.size) commit([...set]);
    },
    cancel() {
      clearTimeout(timer);
    },
  };
}

const STILL_TINTS = ['surfaceSunk', 'surfaceAccentSoft', 'statusInfoSoft', 'statusSuccessSoft'] as const;

function EpisodeListRow({
  e,
  watched,
  aired,
  onToggle,
}: {
  e: Episode;
  watched: boolean;
  aired: boolean;
  onToggle: () => void;
}) {
  const { t } = useTheme();
  const still = tmdbImage(e.stillPath, 'w300');
  const when = e.airDate
    ? aired
      ? copy.shows.aired(fmtDay(e.airDate))
      : copy.shows.airs(fmtDay(e.airDate))
    : copy.shows.notAired;
  return (
    <Press
      accessibilityRole="checkbox"
      accessibilityState={{ checked: watched, disabled: !aired }}
      accessibilityLabel={copy.shows.square(
        e.season,
        e.episode,
        e.name,
        watched ? copy.episode.watched : aired ? copy.episode.notWatched : copy.episode.notAired,
      )}
      disabled={!aired}
      onPress={onToggle}
      scaleTo={1}
      style={{
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: t.borderHairline,
      }}
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
      <View style={{ width: 40, alignItems: 'center' }}>
        <Icon
          name={watched ? 'check_circle' : 'radio_button_unchecked'}
          size={22}
          tint={watched ? t.accentPrimary : t.borderStrong}
        />
      </View>
    </Press>
  );
}

const styles = StyleSheet.create({
  tip: { position: 'absolute', maxWidth: 180, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
});

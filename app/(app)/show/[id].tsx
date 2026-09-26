import { tmdbImage } from '@shared/tmdb.ts';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { coverFor } from '@/components/calico/coverPalette';
import { StatusRail } from '@/components/calico/StatusRail';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { DetailLoadState } from '@/components/ds/LoadState';
import { Press } from '@/components/ds/Press';
import { Switch } from '@/components/ds/Switch';
import { Txt } from '@/components/ds/Txt';
import { SeasonBlock } from '@/features/media/components/SeasonBlock';
import { useIncludeSpecials, useProgress, useSetMediaStatus, useShow } from '@/features/media/hooks';
import { ENDED_STATUS, epCode, seasonsOf, SHOW_STOPS } from '@/features/media/logic';
import type { Show, ShowStatus } from '@/features/media/types';
import { useShowMarker } from '@/features/media/useShowMarker';
import { useUpdateProfile } from '@/features/profile/hooks';
import { copy } from '@/i18n/en';
import { colomboToday, fmtDay } from '@/lib/dates';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { alpha, layout, palette, radius, shadow, size, tracking, useTheme } from '@/theme';

/** Show detail (prototype `showDetail`): hero, status rail, Next up, seasons with the episode grid. */
export default function ShowDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useShow(id);
  const show = q.data;

  if (!show) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 8, backgroundColor: t.surfacePage }}>
        <View style={{ paddingHorizontal: 16 }}>
          <IconButton icon="arrow_back" label={copy.books.back} tone="card" onPress={() => router.back()} />
        </View>
        <DetailLoadState q={q} />
      </View>
    );
  }
  return <ShowBody show={show} />;
}

function ShowBody({ show }: { show: Show }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useProgress(show);
  const specials = useIncludeSpecials();
  const updateProfile = useUpdateProfile();
  const setStatus = useSetMediaStatus();
  const marker = useShowMarker(show);
  const [expanded, setExpanded] = useState<number | null>(null);
  const today = colomboToday();
  const seasons = useMemo(() => (progress ? seasonsOf(progress.episodes, specials) : []), [progress, specials]);
  const p = coverFor(show.id);
  const backdrop = tmdbImage(show.backdropPath, 'w780');
  const meta = [show.year, show.network, show.tmdbStatus].filter(Boolean).join(' · ');

  const onStatus = (s: ShowStatus) => {
    setStatus.mutate({ itemId: show.id, status: s });
    toast({ message: copy.books.statusChanged(show.title, copy.mediaStatus[s]) });
  };
  const next = progress?.next ?? null;
  const caughtUpLine =
    show.tmdbStatus && ENDED_STATUS.includes(show.tmdbStatus)
      ? copy.shows.caughtUpEnded
      : show.nextAirDate && show.nextAirDate >= today
        ? copy.shows.caughtUpOn(fmtDay(show.nextAirDate))
        : copy.shows.caughtUpUnknown;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
      testID="screen-show"
    >
      <View
        style={{
          height: 218 + insets.top,
          justifyContent: 'flex-end',
          padding: 20,
          backgroundColor: palette.ink,
          experimental_backgroundImage: `linear-gradient(150deg, ${p.bg} 0%, ${palette.ink} 100%)`,
        }}
      >
        {backdrop && (
          <>
            <Image source={{ uri: backdrop }} cachePolicy="disk" contentFit="cover" style={StyleSheet.absoluteFill} />
            <View
              style={[
                StyleSheet.absoluteFill,
                { experimental_backgroundImage: `linear-gradient(180deg, transparent 30%, ${alpha.ink56} 100%)` },
              ]}
            />
          </>
        )}
        <Txt family="hand" weight={400} size={22} tint={alpha.cream72}>
          {[show.network, show.year].filter(Boolean).join(' · ')}
        </Txt>
        <View
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            top: insets.top + 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <HeroButton icon="arrow_back" label={copy.books.back} onPress={() => router.back()} />
          <HeroButton
            icon="more_vert"
            label={copy.books.more}
            onPress={() => openSheet('mediaOverflow', { itemId: show.id })}
          />
        </View>
      </View>

      <View style={{ paddingTop: 20, paddingHorizontal: layout.gutterScreen }}>
        <Txt
          family="display"
          weight={700}
          size={28}
          leading={1.14}
          accessibilityRole="header"
          style={{ letterSpacing: -0.02 * 28 }}
        >
          {show.title}
        </Txt>
        {!!meta && (
          <View
            style={{
              alignSelf: 'flex-start',
              marginTop: 10,
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: radius.pill,
              backgroundColor: t.surfaceSunk,
            }}
          >
            <Txt
              family="ui"
              weight={600}
              size="3xs"
              color="textSecondary"
              style={{ letterSpacing: tracking.wide * size['3xs'], textTransform: 'uppercase' }}
            >
              {meta}
            </Txt>
          </View>
        )}
      </View>

      <View style={{ marginTop: 22, marginHorizontal: layout.gutterScreen }}>
        <StatusRail
          title={copy.books.whereItsAt}
          stops={SHOW_STOPS.map((s) => ({ id: s, label: copy.mediaStatus[s] }))}
          branch={{ id: 'dropped', label: copy.mediaStatus.dropped }}
          value={show.status}
          onSelect={onStatus}
        />
      </View>

      {/* Next up */}
      <View style={{ paddingTop: 22, paddingHorizontal: layout.gutterScreen }}>
        <View
          style={{
            padding: 16,
            borderRadius: radius.lg,
            boxShadow: shadow.md,
            backgroundColor: t.panel2,
            experimental_backgroundImage: `linear-gradient(165deg, ${t.panel1} 0%, ${t.panel2} 100%)`,
          }}
          testID="next-up"
        >
          <Txt role="label" size={11} tint={t.accentSecondary} style={{ marginBottom: 12 }}>
            {!progress ? copy.shows.loading : next ? copy.shows.nextUp : caughtUpLine}
          </Txt>
          {!progress && <ActivityIndicator color={palette.cream} />}
          {next && (
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <View
                style={{
                  width: 104,
                  height: 59,
                  borderRadius: radius.sm,
                  backgroundColor: alpha.cream16,
                  overflow: 'hidden',
                }}
              >
                {next.stillPath && (
                  <Image
                    source={{ uri: tmdbImage(next.stillPath, 'w300')! }}
                    cachePolicy="disk"
                    contentFit="cover"
                    style={StyleSheet.absoluteFill}
                  />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt family="display" weight={700} size={17} tint={palette.cream} testID="next-code">
                  {epCode(next.season, next.episode)}
                </Txt>
                <Txt family="ui" size="xs" tint={t.textInverseMuted} numberOfLines={1}>
                  {next.name ?? ''}
                </Txt>
              </View>
              <Press
                accessibilityRole="button"
                accessibilityLabel={copy.shows.markNext(epCode(next.season, next.episode))}
                testID="mark-next"
                onPress={() => marker.toggle(next, { announce: true })}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: t.accentPrimary,
                  boxShadow: shadow.sm,
                }}
              >
                <Icon name="check" size={23} tint={t.textOnAccent} />
              </Press>
            </View>
          )}
        </View>
      </View>

      {/* Episodes */}
      <View style={{ paddingTop: 26, paddingHorizontal: layout.gutterScreen }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Txt family="display" weight={700} size={22} accessibilityRole="header" style={{ letterSpacing: -0.02 * 22 }}>
            {copy.shows.episodes}
          </Txt>
          {progress && (
            <Txt family="ui" weight={700} size="2xs" color="textAccent" testID="episode-count">
              {copy.shows.episodeCount(progress.watched, progress.total)}
            </Txt>
          )}
        </View>
        <View style={{ gap: 18 }}>
          {progress &&
            seasons.map((s) => (
              <SeasonBlock
                key={s.n}
                season={s}
                watched={progress.watchedSet}
                next={next}
                today={today}
                expanded={expanded === s.n}
                onExpand={() => setExpanded((e) => (e === s.n ? null : s.n))}
                marker={marker}
              />
            ))}
        </View>
        <Txt family="hand" weight={400} size={17} color="textMuted" style={{ paddingTop: 12 }}>
          {copy.shows.hint}
        </Txt>
        <View style={{ paddingTop: 20 }}>
          <Switch
            label={copy.shows.includeSpecials}
            checked={specials}
            onChange={(v) => updateProfile.mutate({ include_specials: v })}
            testID="toggle-specials"
          />
        </View>
      </View>
    </ScrollView>
  );
}

function HeroButton({
  icon,
  label,
  onPress,
}: {
  icon: 'arrow_back' | 'more_vert';
  label: string;
  onPress: () => void;
}) {
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: alpha.cream72,
      }}
      hitSlop={2}
    >
      <Icon name={icon} size={21} tint={palette.espresso} />
    </Press>
  );
}

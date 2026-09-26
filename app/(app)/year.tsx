import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ds/IconButton';
import { QueryError } from '@/components/ds/QueryError';
import { Select } from '@/components/ds/Select';
import { Skeleton } from '@/components/ds/Skeleton';
import { Txt } from '@/components/ds/Txt';
import { fetchYearStats, type YearStats } from '@/features/account/api';
import { goalPct, languageSegments } from '@/features/account/logic';
import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';
import { qk } from '@/lib/queryKeys';
import { layout, palette, radius, shadow, size, tracking, useTheme } from '@/theme';

const YEARS_BACK = 5;
const MAX_SPINES = 60;

/** Your year (prototype `year`, plan §10): books finished, the goal shelf, language split, stat tiles. */
export default function YourYear() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const thisYear = Number(colomboToday().slice(0, 4));
  const [year, setYear] = useState(thisYear);
  const q = useQuery({ queryKey: qk.stats(year), queryFn: () => fetchYearStats(year) });
  const years = Array.from({ length: YEARS_BACK }, (_, i) => String(thisYear - i));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 48 }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} />}
      testID="screen-year"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 16,
          paddingRight: 20,
        }}
      >
        <IconButton icon="arrow_back" label={copy.books.back} tone="card" onPress={() => router.back()} />
        <Select
          variant="inline"
          label={copy.year.pickYear}
          value={String(year)}
          onChange={(v) => setYear(Number(v))}
          options={years.map((y) => ({ value: y, label: y }))}
        />
      </View>
      <View style={{ paddingTop: 20, paddingHorizontal: layout.gutterScreen }}>
        <Txt family="hand" weight={400} size={22} leading={1} color="textAccent">
          {copy.year.hand}
        </Txt>
        {q.data ? (
          <YearBody s={q.data} />
        ) : q.isError ? (
          <QueryError message={copy.year.failed} onRetry={() => void q.refetch()} />
        ) : (
          <View style={{ gap: 16, marginTop: 8 }}>
            <Skeleton width="60%" height={96} />
            <Skeleton height={150} radius={radius.xl} />
            <Skeleton height={40} radius={radius.pill} />
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Skeleton width="48%" height={84} radius={radius.lg} />
              <Skeleton width="48%" height={84} radius={radius.lg} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function YearBody({ s }: { s: YearStats }) {
  const { t } = useTheme();
  const pct = goalPct(s.booksFinished, s.goal);
  const spines = Math.min(MAX_SPINES, Math.max(s.goal ?? 0, s.booksFinished));
  const tones = [...t.cover.slice(0, 3), t.cover[4]!, t.cover[5]!, palette.clay];
  const segments = languageSegments(s.languageSplit);
  const tiles: { value: string; label: string }[] = [
    { value: s.pagesRead.toLocaleString('en'), label: copy.year.pagesRead },
    { value: s.episodesWatched.toLocaleString('en'), label: copy.year.episodes },
    s.longestBook
      ? { value: s.longestBook.title, label: copy.year.longest(s.longestBook.pages) }
      : { value: String(s.moviesWatched), label: copy.year.movies },
    s.mostRewatched
      ? { value: s.mostRewatched.title, label: copy.year.rewatched(s.mostRewatched.viewings) }
      : s.fastestRead
        ? { value: s.fastestRead.title, label: copy.year.fastest(s.fastestRead.days) }
        : { value: String(s.hoursWatched), label: copy.year.hours },
  ];

  return (
    <View>
      <Txt
        family="display"
        weight={700}
        size={42}
        leading={1.06}
        accessibilityRole="header"
        style={{ marginTop: 4, letterSpacing: -0.03 * 42 }}
        testID="year-finished"
      >
        {copy.year.finished(s.booksFinished)}
      </Txt>

      <View
        style={{
          marginTop: 22,
          paddingTop: 20,
          paddingHorizontal: 18,
          paddingBottom: 16,
          backgroundColor: t.surfaceCard,
          borderRadius: radius.xl,
          boxShadow: shadow.sm,
        }}
      >
        {s.goal ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Txt
              family="ui"
              weight={700}
              size={11}
              color="textMuted"
              style={{ letterSpacing: tracking.caps * size['3xs'] }}
            >
              {copy.year.goal(s.goal)}
            </Txt>
            <Txt family="ui" weight={700} size={15} color="textAccent">
              {`${pct}%`}
            </Txt>
          </View>
        ) : (
          <Txt family="ui" size="xs" color="textMuted">
            {copy.year.noGoal}
          </Txt>
        )}
        {spines > 0 && (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={s.goal ? copy.year.shelf(s.booksFinished, s.goal) : copy.year.finished(s.booksFinished)}
            accessibilityValue={s.goal ? { min: 0, max: s.goal, now: Math.min(s.booksFinished, s.goal) } : undefined}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: spines > 30 ? 2 : 4,
                height: 78,
                marginTop: 16,
                paddingHorizontal: 2,
              }}
            >
              {Array.from({ length: spines }, (_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 40 + (i % 5) * 8,
                    backgroundColor: i < s.booksFinished ? tones[i % tones.length] : t.surfaceSunk,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                  }}
                />
              ))}
            </View>
            <View style={{ height: 8, borderRadius: radius.xs, backgroundColor: palette.cocoa, marginTop: 2 }} />
          </View>
        )}
        {!!s.goal && (
          <Txt family="hand" weight={400} size={17} color="textMuted" style={{ marginTop: 10 }}>
            {copy.year.shelf(s.booksFinished, s.goal)}
          </Txt>
        )}
      </View>

      {segments.length > 0 && (
        <>
          <Txt
            family="display"
            weight={700}
            size={22}
            accessibilityRole="header"
            style={{ marginTop: 30, letterSpacing: -0.02 * 22 }}
          >
            {copy.year.languageSplit}
          </Txt>
          <View
            style={{
              flexDirection: 'row',
              height: 40,
              marginTop: 12,
              borderRadius: radius.pill,
              overflow: 'hidden',
              boxShadow: shadow.xs,
            }}
          >
            {segments.map((seg, i) => {
              const bg = i === 0 ? t.accentSecondary : i === 1 ? palette.forest : t.cover[(i + 2) % t.cover.length]!;
              return (
                <View
                  key={seg.language}
                  accessible
                  accessibilityLabel={copy.year.segment(seg.language, seg.n)}
                  style={{ flex: seg.share, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
                >
                  {seg.share > 0.18 && (
                    <Txt
                      family="ui"
                      weight={700}
                      size="3xs"
                      tint={i === 0 ? palette.espresso : palette.cream}
                      numberOfLines={1}
                    >
                      {copy.year.segment(seg.language, seg.n)}
                    </Txt>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 26 }}>
        {tiles.map((tile) => (
          <View
            key={tile.label}
            accessible
            accessibilityLabel={`${tile.label}: ${tile.value}`}
            style={{
              width: '47%',
              flexGrow: 1,
              padding: 16,
              backgroundColor: t.surfaceCard,
              borderRadius: radius.lg,
              boxShadow: shadow.sm,
            }}
          >
            <Txt
              family="display"
              weight={700}
              size={26}
              leading={1.1}
              numberOfLines={2}
              style={{ letterSpacing: -0.02 * 26 }}
            >
              {tile.value}
            </Txt>
            <Txt family="ui" size="2xs" color="textMuted" style={{ marginTop: 4 }}>
              {tile.label}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

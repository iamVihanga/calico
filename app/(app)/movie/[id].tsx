import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { coverFor } from '@/components/calico/coverPalette';
import { Poster } from '@/components/calico/Poster';
import { StatusRail } from '@/components/calico/StatusRail';
import { TicketStack, type TicketStackHandle } from '@/components/calico/TicketStack';
import { Button } from '@/components/ds/Button';
import { IconButton } from '@/components/ds/IconButton';
import { DetailLoadState } from '@/components/ds/LoadState';
import { Txt } from '@/components/ds/Txt';
import { useMovie, useSetMediaStatus } from '@/features/media/hooks';
import { fmtRuntime, MOVIE_STOPS } from '@/features/media/logic';
import type { MovieStatus } from '@/features/media/types';
import { copy } from '@/i18n/en';
import { fmtDay, fmtLong } from '@/lib/dates';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { layout, radius, shadow, size, tracking, useTheme } from '@/theme';

/** Movie detail (prototype `movieDetail`): poster, status rail, ticket stubs, Watched it again. */
export default function MovieDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useMovie(id);
  const setStatus = useSetMediaStatus();
  const stack = useRef<TicketStackHandle>(null);
  const movie = q.data;

  if (!movie) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 8, backgroundColor: t.surfacePage }}>
        <View style={{ paddingHorizontal: 16 }}>
          <IconButton icon="arrow_back" label={copy.books.back} tone="card" onPress={() => router.back()} />
        </View>
        <DetailLoadState q={q} />
      </View>
    );
  }

  const p = coverFor(movie.id);
  const meta = [movie.year, fmtRuntime(movie.runtimeMin), movie.genres[0]].filter(Boolean).join(' · ');
  const onStatus = (s: MovieStatus) => {
    // → Watched logs a viewing (plan §11.1).
    if (s === 'watched') return openSheet('watchAgain', { itemId: movie.id });
    setStatus.mutate({ itemId: movie.id, status: s });
    toast({ message: copy.books.statusChanged(movie.title, copy.mediaStatus[s]) });
  };
  const watchAgain = async () => {
    await stack.current?.tear();
    openSheet('watchAgain', { itemId: movie.id });
  };
  const n = movie.viewings.length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 48 }}
      testID="screen-movie"
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        <IconButton icon="arrow_back" label={copy.books.back} tone="card" onPress={() => router.back()} />
        <IconButton
          icon="more_vert"
          label={copy.books.more}
          tone="card"
          onPress={() => openSheet('mediaOverflow', { itemId: movie.id })}
        />
      </View>

      <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 24 }}>
        <View
          style={{
            position: 'absolute',
            top: 32,
            width: 190,
            height: 170,
            borderRadius: radius.pill,
            backgroundColor: p.bg,
            opacity: 0.42,
            filter: [{ blur: 44 }],
          }}
        />
        <Poster
          item={movie}
          kind="movie"
          size="w342"
          titleSize={19}
          filmDots
          style={{ width: 158, boxShadow: shadow.lg, padding: 14 }}
        />
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 28 }}>
        <Txt
          family="display"
          weight={700}
          size={28}
          leading={1.14}
          align="center"
          accessibilityRole="header"
          style={{ letterSpacing: -0.02 * 28 }}
        >
          {movie.title}
        </Txt>
        {!!meta && (
          <View
            style={{
              marginTop: 12,
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

      <View style={{ marginTop: 24, marginHorizontal: layout.gutterScreen }}>
        <StatusRail
          title={copy.books.whereItsAt}
          stops={MOVIE_STOPS.map((s) => ({ id: s, label: copy.mediaStatus[s] }))}
          branch={{ id: 'dropped', label: copy.mediaStatus.dropped }}
          value={movie.status}
          onSelect={onStatus}
        />
      </View>

      <View style={{ paddingTop: 26, paddingHorizontal: layout.gutterScreen }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Txt family="display" weight={700} size={22} accessibilityRole="header" style={{ letterSpacing: -0.02 * 22 }}>
            {copy.movies.viewings}
          </Txt>
          <Txt family="hand" weight={400} size={17} color="textMuted">
            {copy.movies.stubs}
          </Txt>
        </View>
        <TicketStack
          ref={stack}
          viewings={movie.viewings.map((v) => ({
            id: v.id,
            date:
              v.watchedOn.slice(0, 4) === new Date().getFullYear().toString()
                ? fmtDay(v.watchedOn)
                : fmtLong(v.watchedOn),
            rating: v.rating,
            note: v.note,
          }))}
        />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
          <Txt family="ui" weight={700} size={15} testID="watch-count">
            {copy.movies.watchCount(n)}
          </Txt>
          {n > 1 && (
            <Txt family="hand" weight={400} size={16} color="textMuted">
              {copy.movies.fanHint}
            </Txt>
          )}
        </View>
        <Button
          variant="accent"
          size="lg"
          block
          style={{ marginTop: 16 }}
          testID="watch-again"
          onPress={() => void watchAgain()}
        >
          {n ? copy.movies.watchAgain : copy.movies.watchFirst}
        </Button>
      </View>
    </ScrollView>
  );
}

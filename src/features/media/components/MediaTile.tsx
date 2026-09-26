import { router } from 'expo-router';
import { memo } from 'react';
import { View } from 'react-native';

import { Poster } from '@/components/calico/Poster';
import { starString } from '@/components/calico/TicketStub';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { radius, shadow, useTheme } from '@/theme';

import type { Media, ShowProgress } from '../types';

/** Library tag under a movie or show: latest rating, episode progress, or the status. */
export function mediaTag(item: Media, progress?: ShowProgress): { text: string; accent: boolean } {
  if (item.kind === 'movie') {
    const stars = starString(item.viewings[0]?.rating ?? item.rating);
    return { text: stars || copy.mediaStatus[item.status], accent: false };
  }
  if (progress && progress.total > 0 && item.status !== 'watchlist') {
    return { text: copy.shows.progress(progress.watched, progress.total), accent: item.status === 'watching' };
  }
  return { text: copy.mediaStatus[item.status], accent: item.status === 'watching' };
}

export const mediaHref = (item: Pick<Media, 'id' | 'kind'>) =>
  item.kind === 'movie' ? (`/movie/${item.id}` as const) : (`/show/${item.id}` as const);

/** Grid tile for the Movies and Shows segments. */
export const MediaTile = memo(function MediaTile({ item, progress }: { item: Media; progress?: ShowProgress }) {
  const { t } = useTheme();
  const tag = mediaTag(item, progress);
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${copy.media[item.kind]}, ${tag.text}`}
      testID={`media-tile-${item.id}`}
      onPress={() => router.push(mediaHref(item))}
      style={{ flex: 1 }}
    >
      <Poster item={item} kind={item.kind} />
      <Txt family="ui" weight={600} size="2xs" numberOfLines={1} style={{ marginTop: 7 }}>
        {item.title}
      </Txt>
      <Txt
        family="ui"
        weight={600}
        size="3xs"
        tint={tag.accent ? t.textAccent : t.textMuted}
        numberOfLines={1}
        style={{ minHeight: 17, marginTop: 2 }}
      >
        {tag.text}
      </Txt>
    </Press>
  );
});

/** List row for the Movies and Shows segments. */
export const MediaRow = memo(function MediaRow({ item, progress }: { item: Media; progress?: ShowProgress }) {
  const { t } = useTheme();
  const tag = mediaTag(item, progress);
  const meta = [item.year, copy.mediaStatus[item.status]].filter(Boolean).join(' · ');
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${meta}, ${tag.text}`}
      testID={`media-row-${item.id}`}
      onPress={() => router.push(mediaHref(item))}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        backgroundColor: t.surfaceCard,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
      }}
    >
      <Poster
        item={item}
        kind={item.kind}
        titleSize={8}
        style={{ width: 50, paddingVertical: 5, paddingHorizontal: 4 }}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt family="display" weight={700} size={16} numberOfLines={2}>
          {item.title}
        </Txt>
        <Txt family="ui" size="3xs" color="textMuted" style={{ marginTop: 3 }}>
          {meta}
        </Txt>
      </View>
      <Txt family="ui" weight={600} size="3xs" tint={tag.accent ? t.textAccent : t.textMuted}>
        {tag.text}
      </Txt>
    </Press>
  );
});

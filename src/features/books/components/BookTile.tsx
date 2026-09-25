import { router } from 'expo-router';
import { memo } from 'react';
import { View } from 'react-native';

import { coverFor } from '@/components/calico/coverPalette';
import { coverRadius } from '@/components/calico/GeneratedCover';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { type LocalDate } from '@/lib/dates';
import { alpha, radius, shadow, useTheme } from '@/theme';

import { leadTitle, libraryTag, progressPct } from '../logic';
import type { Book, LeadScript } from '../types';

type Props = { book: Book; lead: LeadScript; today: LocalDate };

/** Grid tile (prototype libItems, grid view): typographic cover, title, progress, tag. */
export const BookTile = memo(function BookTile({ book, lead, today }: Props) {
  const { t } = useTheme();
  const p = coverFor(book.id);
  const { main } = leadTitle(book, lead);
  const tag = libraryTag(book, today);
  const tagColor = tag.tone === 'danger' ? t.statusDanger : tag.tone === 'accent' ? t.textAccent : t.textMuted;
  const reading = book.status === 'reading';

  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={`${main}, ${tag.text}`}
      testID={`book-tile-${book.id}`}
      onPress={() => router.push(`/book/${book.id}`)}
      style={{ flex: 1 }}
    >
      <View
        style={[
          {
            aspectRatio: 2 / 3,
            backgroundColor: p.bg,
            boxShadow: shadow.cover,
            paddingVertical: 10,
            paddingHorizontal: 9,
            overflow: 'hidden',
          },
          coverRadius,
        ]}
      >
        <Txt family="display" weight={700} size="2xs" leading={1.2} tint={p.ink} numberOfLines={6}>
          {main}
        </Txt>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: alpha.black18 }} />
      </View>
      <Txt family="ui" weight={600} size="2xs" numberOfLines={1} style={{ marginTop: 7 }}>
        {main}
      </Txt>
      {reading && (
        <View
          style={{
            height: 4,
            borderRadius: radius.pill,
            backgroundColor: t.surfaceSunk,
            marginTop: 5,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${progressPct(book.currentPage, book.totalPages)}%`,
              backgroundColor: t.accentPrimary,
            }}
          />
        </View>
      )}
      <Txt
        family="ui"
        weight={600}
        size="3xs"
        tint={tagColor}
        numberOfLines={1}
        style={{ minHeight: 17, marginTop: 2 }}
      >
        {tag.text}
      </Txt>
    </Press>
  );
});

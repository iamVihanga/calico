import { router } from 'expo-router';
import { View } from 'react-native';

import { coverFor } from '@/components/calico/coverPalette';
import { coverRadius } from '@/components/calico/GeneratedCover';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { computePace, estimateFinish, leadAuthor, leadTitle, progressPct } from '@/features/books/logic';
import type { Book, LeadScript, PageLog } from '@/features/books/types';
import { copy } from '@/i18n/en';
import { colomboToday, fmtShort } from '@/lib/dates';
import { openSheet } from '@/lib/stores/sheet';
import { alpha, palette, radius, shadow, useTheme } from '@/theme';

export const CARD_WIDTH = 336;

/** Forest "Continue reading" card (prototype homeV reading). */
export function ContinueReadingCard({ book, logs, lead }: { book: Book; logs: PageLog[]; lead: LeadScript }) {
  const { t } = useTheme();
  const p = coverFor(book.id);
  const { main } = leadTitle(book, lead);
  const pct = progressPct(book.currentPage, book.totalPages);
  const pace = computePace(
    logs.map((l) => ({ page: l.page, loggedAt: new Date(l.loggedAt) })),
    new Date(),
  );
  const finish = book.totalPages ? estimateFinish(book.currentPage, book.totalPages, pace, colomboToday()) : null;
  const open = () => router.push(`/book/${book.id}`);

  return (
    <View
      testID={`reading-${book.id}`}
      style={{
        width: CARD_WIDTH,
        flexDirection: 'row',
        gap: 18,
        padding: 20,
        borderRadius: radius.xl,
        boxShadow: shadow.lg,
        backgroundColor: t.panel2,
        experimental_backgroundImage: `linear-gradient(165deg, ${t.panel1} 0%, ${t.panel2} 100%)`,
      }}
    >
      <Press
        accessibilityRole="button"
        accessibilityLabel={main}
        onPress={open}
        style={[
          {
            width: 88,
            height: 130,
            backgroundColor: p.bg,
            boxShadow: shadow.cover,
            paddingVertical: 12,
            paddingHorizontal: 10,
            overflow: 'hidden',
            transform: [{ rotate: '-3deg' }],
          },
          coverRadius,
        ]}
      >
        <Txt family="display" weight={700} size={14} leading={1.18} tint={p.ink} numberOfLines={6}>
          {main}
        </Txt>
      </Press>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Press accessibilityRole="button" onPress={open} scaleTo={1}>
          <Txt family="display" weight={700} size={19} leading={1.18} tint={palette.cream} numberOfLines={2}>
            {main}
          </Txt>
        </Press>
        <Txt family="ui" size="2xs" tint={t.textInverseMuted} numberOfLines={1} style={{ marginTop: 3 }}>
          {leadAuthor(book, lead)}
        </Txt>
        <View style={{ flex: 1 }} />
        <View
          style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}
        >
          <Txt role="numeric" size={22} leading={1} tint={t.accentSecondary}>
            {copy.homeShelf.pct(pct)}
          </Txt>
          <Txt family="ui" size="3xs" tint={t.textInverseMuted}>
            {`${book.currentPage}/${book.totalPages ?? '?'}`}
          </Txt>
        </View>
        <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: alpha.cream16, overflow: 'hidden' }}>
          <View
            style={{ height: '100%', width: `${pct}%`, borderRadius: radius.pill, backgroundColor: t.accentPrimary }}
          />
        </View>
        <Txt family="hand" weight={400} size={16} tint={t.accentSecondary} style={{ marginTop: 7, minHeight: 22 }}>
          {finish ? copy.books.doneBy(fmtShort(finish)) : ''}
        </Txt>
        <Press
          accessibilityRole="button"
          accessibilityLabel={`${copy.books.logPage}, ${main}`}
          testID={`home-log-${book.id}`}
          onPress={() => openSheet('ruler', { itemId: book.id })}
          style={{
            minHeight: 44,
            marginTop: 10,
            borderRadius: radius.pill,
            backgroundColor: palette.cream,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt family="ui" weight={700} size={14} tint={palette.espresso}>
            {copy.books.logPage}
          </Txt>
        </Press>
      </View>
    </View>
  );
}

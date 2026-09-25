import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated, { FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { CoverPhoto } from '@/components/calico/CoverPhoto';
import { coverFor } from '@/components/calico/coverPalette';
import { stampLabel } from '@/components/calico/DateStamp';
import { coverRadius } from '@/components/calico/GeneratedCover';
import { OverdueStamp } from '@/components/calico/LoanSlip';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { leadTitle } from '@/features/books/logic';
import type { Book, LeadScript } from '@/features/books/types';
import { type DueBook, dueSoon, dueTone } from '@/features/loans/logic';
import { copy } from '@/i18n/en';
import { colomboToday, daysBetween } from '@/lib/dates';
import { openSheet } from '@/lib/stores/sheet';
import { layout, motion, radius, shadow, size, tracking, useTheme } from '@/theme';

const WIDTH = 252;
const WIDTH_OVERDUE = 272; // brief §7.2: an overdue slip is pinned and slightly larger

/** Compact LoanSlip for Home (prototype homeV `dueSoon`): tap opens the book, long-press quick actions. */
function DueSoonCard({ book, lead, today }: { book: DueBook; lead: LeadScript; today: string }) {
  const { t } = useTheme();
  const days = daysBetween(today, book.loan.dueOn);
  const tone = dueTone(days);
  const accent = { overdue: t.statusDanger, soon: t.accentPrimary, later: t.accentQuiet }[tone];
  const { main } = leadTitle(book, lead);
  const p = coverFor(book.id);
  const dueLine = copy.loan.dueLine(days);

  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={copy.loan.slipA11y(main, book.loan.party, dueLine)}
      accessibilityHint={copy.loan.slipHint}
      testID={`due-${book.id}`}
      onPress={() => router.push(`/book/${book.id}`)}
      onLongPress={() => openSheet('loanQuick', { itemId: book.id })}
      style={{
        width: tone === 'overdue' ? WIDTH_OVERDUE : WIDTH,
        flexDirection: 'row',
        backgroundColor: t.surfaceCard,
        borderRadius: radius.lg,
        boxShadow: shadow.sm,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: 8, backgroundColor: accent }} />
      <View style={{ flex: 1, minWidth: 0, paddingTop: 15, paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View
            style={[
              { width: 44, height: 64, backgroundColor: p.bg, boxShadow: shadow.xs, overflow: 'hidden' },
              coverRadius,
            ]}
          >
            <CoverPhoto item={book} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt family="display" weight={700} size={15} leading={1.2} numberOfLines={1}>
              {main}
            </Txt>
            <Txt
              family="ui"
              size="3xs"
              color="textMuted"
              numberOfLines={1}
              style={{ marginTop: 4, letterSpacing: tracking.wide * size['3xs'], textTransform: 'uppercase' }}
            >
              {book.loan.party}
            </Txt>
            <Txt family="hand" weight={400} size={16} tint={accent} style={{ marginTop: 2 }}>
              {copy.loan.note[tone]}
            </Txt>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 1,
            borderStyle: 'dashed',
            borderTopColor: t.borderStrong,
          }}
        >
          <View
            style={{
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: radius.sm,
              backgroundColor: tone === 'overdue' ? t.statusDangerSoft : t.surfaceSunk,
            }}
          >
            <Txt
              family="ui"
              weight={700}
              size="3xs"
              tint={tone === 'overdue' ? t.statusDanger : t.textSecondary}
              style={{ letterSpacing: tracking.wide * size['3xs'] }}
            >
              {stampLabel(book.loan.dueOn)}
            </Txt>
          </View>
          <Txt family="ui" weight={700} size="3xs" tint={accent}>
            {dueLine}
          </Txt>
        </View>
      </View>
      {tone === 'overdue' && <OverdueStamp compact />}
    </Press>
  );
}

/** Home "Due soon · from the library": hidden when nothing is due within a week (brief §10). */
export function DueSoonRow({ books, lead }: { books: Book[]; lead: LeadScript }) {
  const reduced = useReducedMotion();
  const today = colomboToday();
  const due = dueSoon(books, today);
  if (due.length === 0) return null;
  return (
    <View testID="due-soon">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: layout.gutterScreen,
          paddingBottom: 12,
        }}
      >
        <Txt family="display" weight={700} size={22} accessibilityRole="header" style={{ letterSpacing: -0.02 * 22 }}>
          {copy.loan.dueSoon}
        </Txt>
        <Txt family="hand" weight={400} size={17} color="textMuted">
          {copy.loan.dueSoonHand}
        </Txt>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 14, paddingHorizontal: layout.gutterScreen, paddingBottom: 28 }}
      >
        {due.map((b) => (
          <Animated.View
            key={b.id}
            layout={reduced ? undefined : LinearTransition.duration(motion.duration.base)}
            exiting={FadeOut.duration(motion.duration.base)}
          >
            <DueSoonCard book={b} lead={lead} today={today} />
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

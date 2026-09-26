import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  type ExitAnimationsValues,
  FadeOut,
  type LayoutAnimation,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverPhoto } from '@/components/calico/CoverPhoto';
import { coverFor } from '@/components/calico/coverPalette';
import { coverRadius } from '@/components/calico/GeneratedCover';
import { LoanSlip } from '@/components/calico/LoanSlip';
import { PaceSparkline } from '@/components/calico/PaceSparkline';
import { ScriptToggle } from '@/components/calico/ScriptToggle';
import { StatusRail } from '@/components/calico/StatusRail';
import { EmptyState } from '@/components/ds/EmptyState';
import { IconButton } from '@/components/ds/IconButton';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { useBook, useLeadScript, usePageLogs, useUpdateNote } from '@/features/books/hooks';
import {
  computePace,
  dailyPages,
  estimateFinish,
  leadAuthor,
  leadTitle,
  progressPct,
  RAIL_STOPS,
  statusLabel,
} from '@/features/books/logic';
import type { BookDetail, ReadingSession } from '@/features/books/types';
import { useBookStatusChange } from '@/features/books/useBookStatusChange';
import { useReturn } from '@/features/loans/hooks';
import { copy } from '@/i18n/en';
import { colomboToday, fmtLong, fmtShort } from '@/lib/dates';
import { openSheet } from '@/lib/stores/sheet';
import { alpha, fontFamily, layout, motion, palette, radius, shadow, size, tracking, useTheme } from '@/theme';

function SectionTitle({ children, aside }: { children: string; aside?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Txt family="display" weight={700} size={22} style={{ letterSpacing: -0.02 * 22 }} accessibilityRole="header">
        {children}
      </Txt>
      {aside && (
        <Txt family="hand" weight={400} size="md" color="textMuted">
          {aside}
        </Txt>
      )}
    </View>
  );
}

const ARRIVAL_SHEETS: string[] = ['ruler', 'finish', 'stop', 'renew', 'loanQuick'];
type ArrivalSheet = 'ruler' | 'finish' | 'stop' | 'renew' | 'loanQuick';

function historyLine(s: ReadingSession, n: number): string {
  if (s.outcome === 'read' && s.finishedAt) return copy.books.historyFinished(n, fmtLong(s.finishedAt));
  if (s.outcome === 'abandoned' && s.finishedAt) return copy.books.historyAbandoned(n, fmtLong(s.finishedAt));
  if (s.outcome === 'paused' && s.finishedAt) return copy.books.historyPaused(n, fmtLong(s.finishedAt));
  return copy.books.historyStarted(n, fmtShort(s.startedAt));
}

/** Book detail (prototype `bookDetail`, plan §10). `?sheet=…` opens a sheet on arrival. */
export default function BookDetailScreen() {
  const { id, sheet } = useLocalSearchParams<{ id: string; sheet?: string }>();
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const lead = useLeadScript();
  const query = useBook(id);
  const logs = usePageLogs(id).data ?? [];
  const changeStatus = useBookStatusChange();
  const book = query.data;

  // Deep links (notifications): ?sheet=renew|loanQuick|ruler|finish|stop opens that sheet on arrival.
  useEffect(() => {
    if (sheet && ARRIVAL_SHEETS.includes(sheet)) openSheet(sheet as ArrivalSheet, { itemId: id });
  }, [sheet, id]);

  if (!book) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 8, backgroundColor: t.surfacePage }}>
        <View style={{ paddingHorizontal: 16 }}>
          <IconButton icon="arrow_back" label={copy.books.back} tone="card" onPress={() => router.back()} />
        </View>
        {query.isFetched && <EmptyState body={copy.books.notFound} />}
      </View>
    );
  }

  const p = coverFor(book.id);
  const { main, sub } = leadTitle(book, lead);
  const author = leadAuthor(book, lead);
  const meta = [
    book.language,
    copy.books.format[book.format],
    book.totalPages ? copy.books.pages(book.totalPages) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}
      testID="screen-book"
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}
      >
        <IconButton icon="arrow_back" label={copy.books.back} tone="card" onPress={() => router.back()} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ScriptToggle />
          <IconButton
            icon="more_vert"
            label={copy.books.more}
            tone="card"
            testID="book-overflow"
            onPress={() => openSheet('overflow', { itemId: book.id })}
          />
        </View>
      </View>

      {/* Cover over a blurred glow of itself */}
      <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 26 }}>
        <View
          style={{
            position: 'absolute',
            top: 34,
            width: 190,
            height: 180,
            borderRadius: radius.pill,
            backgroundColor: p.bg,
            opacity: 0.42,
            filter: [{ blur: 44 }],
          }}
        />
        <View
          style={[
            {
              width: 162,
              height: 244,
              backgroundColor: p.bg,
              boxShadow: shadow.lg,
              paddingVertical: 18,
              paddingHorizontal: 15,
              overflow: 'hidden',
              transform: [{ rotate: '-2deg' }],
            },
            coverRadius,
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, backgroundColor: alpha.black18 }}
          />
          <Txt family="display" weight={700} size={19} leading={1.18} tint={p.ink} style={{ paddingLeft: 6 }}>
            {main}
          </Txt>
          <Txt
            family="hand"
            weight={400}
            size="md"
            tint={p.ink}
            style={{ paddingLeft: 6, marginTop: 8, opacity: 0.78 }}
          >
            {author}
          </Txt>
          <CoverPhoto item={book} label={main} />
        </View>
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
          {main}
        </Txt>
        <Txt family="ui" size="sm" color="textSecondary" align="center" style={{ minHeight: 23 }}>
          {sub}
        </Txt>
        <Txt family="ui" weight={600} size={14} color="textSecondary" align="center" style={{ marginTop: 6 }}>
          {author}
        </Txt>
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
      </View>

      <View style={{ marginTop: 26, marginHorizontal: layout.gutterScreen }}>
        <StatusRail
          title={copy.books.whereItsAt}
          stops={RAIL_STOPS.map((s) => ({ id: s, label: statusLabel(s) }))}
          branch={{ id: 'abandoned', label: statusLabel('abandoned') }}
          value={book.status}
          onSelect={(s) => changeStatus(book, s)}
        />
      </View>

      {book.status === 'reading' && <ReadingPanel book={book} logs={logs} />}
      {book.loan && <LoanSection key={book.loan.id} book={book} />}

      <View style={{ paddingTop: 26, paddingHorizontal: layout.gutterScreen }}>
        <SectionTitle>{copy.books.collections}</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {book.collections.map((c) => (
            <View
              key={c.id}
              style={{
                paddingVertical: 9,
                paddingHorizontal: 15,
                borderRadius: radius.pill,
                backgroundColor: t.surfaceAccentSoft,
              }}
            >
              <Txt family="ui" weight={600} size="xs" tint={t.inkOnWarm}>
                {c.name}
              </Txt>
            </View>
          ))}
          <Press
            accessibilityRole="button"
            onPress={() => openSheet('addToCollection', { itemId: book.id, title: main })}
            style={{
              minHeight: 40,
              justifyContent: 'center',
              paddingHorizontal: 15,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: t.borderStrong,
            }}
          >
            <Txt family="ui" weight={600} size="xs" color="textSecondary">
              {copy.books.addCollection}
            </Txt>
          </Press>
        </View>
      </View>

      <View style={{ paddingTop: 26, paddingHorizontal: layout.gutterScreen }}>
        <SectionTitle>{copy.books.history}</SectionTitle>
        <View
          style={{
            backgroundColor: t.surfaceCard,
            borderRadius: radius.lg,
            boxShadow: shadow.sm,
            paddingVertical: 14,
            paddingHorizontal: 16,
          }}
        >
          {(book.sessions.length ? book.sessions.map((s, i) => historyLine(s, i + 1)) : [copy.books.notStarted]).map(
            (line) => (
              <View key={line} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 30 }}>
                <View style={{ width: 7, height: 7, borderRadius: radius.pill, backgroundColor: t.accentQuiet }} />
                <Txt family="ui" size="xs" color="textSecondary">
                  {line}
                </Txt>
              </View>
            ),
          )}
        </View>
      </View>

      {/* Keyed on the saved note so a server change resets the field. */}
      <Notes key={book.note ?? ''} book={book} />
    </ScrollView>
  );
}

/** Forest reading panel: %, pages, finish estimate, pace, sparkline, Log page. */
function ReadingPanel({ book, logs }: { book: BookDetail; logs: { page: number; loggedAt: string }[] }) {
  const { t } = useTheme();
  const now = new Date();
  const parsed = logs.map((l) => ({ page: l.page, loggedAt: new Date(l.loggedAt) }));
  const pace = computePace(parsed, now);
  const finish = book.totalPages ? estimateFinish(book.currentPage, book.totalPages, pace, colomboToday()) : null;
  const pct = progressPct(book.currentPage, book.totalPages);

  return (
    <View
      style={{
        marginTop: 16,
        marginHorizontal: layout.gutterScreen,
        padding: 20,
        borderRadius: radius.xl,
        boxShadow: shadow.md,
        backgroundColor: t.panel2,
        experimental_backgroundImage: `linear-gradient(165deg, ${t.panel1} 0%, ${t.panel2} 100%)`,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Txt role="numeric" size="3xl" leading={1} tint={t.accentSecondary}>
            {`${pct}%`}
          </Txt>
          <Txt family="ui" size="2xs" tint={t.textInverseMuted} style={{ marginTop: 4 }}>
            {copy.books.pagesOf(book.currentPage, book.totalPages)}
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
          {pace ? (
            <>
              {finish && (
                <Txt family="hand" weight={400} size={19} tint={t.accentSecondary}>
                  {copy.books.doneBy(fmtShort(finish))}
                </Txt>
              )}
              <Txt family="ui" size="3xs" tint={t.textInverseMuted}>
                {copy.books.pace(pace)}
              </Txt>
            </>
          ) : (
            <Txt family="ui" size="3xs" tint={t.textInverseMuted} align="right" style={{ maxWidth: 160 }}>
              {copy.books.noPace}
            </Txt>
          )}
        </View>
      </View>
      <View
        style={{
          height: 10,
          borderRadius: radius.pill,
          backgroundColor: alpha.cream16,
          marginTop: 14,
          overflow: 'hidden',
        }}
      >
        <View
          style={{ height: '100%', width: `${pct}%`, borderRadius: radius.pill, backgroundColor: t.accentPrimary }}
        />
      </View>
      <View style={{ marginTop: 20 }}>
        <PaceSparkline values={dailyPages(parsed, now)} />
      </View>
      <Txt family="ui" size="3xs" tint={t.textInverseMuted} style={{ marginTop: 6 }}>
        {copy.books.sparkCaption}
      </Txt>
      <Press
        accessibilityRole="button"
        testID="detail-log-page"
        onPress={() => openSheet('ruler', { itemId: book.id })}
        style={{
          minHeight: 52,
          marginTop: 18,
          borderRadius: radius.pill,
          backgroundColor: palette.cream,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt family="ui" weight={700} size={16} tint={palette.espresso}>
          {copy.books.logPage}
        </Txt>
      </Press>
    </View>
  );
}

/** "On loan · the date card" with the LoanSlip; the slip tucks away when returned (plan §11.4). */
function LoanSection({ book }: { book: BookDetail }) {
  const lead = useLeadScript();
  const reduced = useReducedMotion();
  const doReturn = useReturn();
  const loan = book.loan!;
  return (
    <Animated.View
      exiting={reduced ? FadeOut.duration(motion.duration.fast) : slipTuck}
      style={{ paddingTop: 26, paddingHorizontal: layout.gutterScreen }}
    >
      <SectionTitle aside={copy.books.dateCard}>{copy.books.onLoan}</SectionTitle>
      <LoanSlip
        loan={loan}
        today={colomboToday()}
        onRenew={() => openSheet('renew', { itemId: book.id })}
        onReturned={() => doReturn(book, lead)}
      />
    </Animated.View>
  );
}

/** Returned: the slip slides down and fades out (duration.base, easing.inOut). */
function slipTuck(_: ExitAnimationsValues): LayoutAnimation {
  'worklet';
  const cfg = { duration: motion.duration.base, easing: Easing.bezier(...motion.easing.inOut) };
  return {
    initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
    animations: { opacity: withTiming(0, cfg), transform: [{ translateY: withTiming(40, cfg) }] },
  };
}

function Notes({ book }: { book: BookDetail }) {
  const { t } = useTheme();
  const update = useUpdateNote();
  const [text, setText] = useState(book.note ?? '');
  return (
    <View style={{ paddingTop: 26, paddingHorizontal: layout.gutterScreen }}>
      <SectionTitle>{copy.books.notes}</SectionTitle>
      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        onBlur={() => text !== (book.note ?? '') && update.mutate({ itemId: book.id, note: text.trim() })}
        placeholder={copy.books.notesPlaceholder}
        placeholderTextColor={t.textMuted}
        accessibilityLabel={copy.books.notes}
        testID="book-notes"
        style={{
          minHeight: 88,
          padding: 16,
          borderRadius: radius.lg,
          backgroundColor: t.surfacePageWarm,
          fontFamily: fontFamily('hand', 400),
          fontSize: size.lg,
          color: t.textPrimary,
          textAlignVertical: 'top',
        }}
      />
    </View>
  );
}

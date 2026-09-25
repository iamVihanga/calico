import { useMemo, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { PageRuler, type PageRulerHandle } from '@/components/calico/PageRuler';
import { Button } from '@/components/ds/Button';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { colomboToday, fmtDay } from '@/lib/dates';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { fontFamily, layout, radius, useTheme } from '@/theme';

import { newId } from '../api';
import { useBook, useLeadScript, useLogPage, usePageLogs } from '../hooks';
import { clampPage, computePace, estimateFinish, leadTitle } from '../logic';

/** Page ruler sheet (prototype sheetRuler, plan §11.2). */
export function RulerSheetBody({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { t } = useTheme();
  const lead = useLeadScript();
  const book = useBook(itemId).data;
  const logData = usePageLogs(itemId).data;
  const logs = useMemo(() => logData ?? [], [logData]);
  const logPage = useLogPage();
  const ruler = useRef<PageRulerHandle>(null);

  const last = book?.currentPage ?? 0;
  const max = book?.totalPages ?? Math.max(last + 500, 1000);
  const [page, setPage] = useState(last);
  const [typing, setTyping] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);

  // "At this pace" is recomputed with a hypothetical log at the scrubbed page.
  const finishLine = useMemo(() => {
    if (page >= max) return copy.ruler.finished;
    const now = new Date();
    const pace = computePace(
      [...logs.map((l) => ({ page: l.page, loggedAt: new Date(l.loggedAt) })), { page, loggedAt: now }],
      now,
    );
    const when = estimateFinish(page, max, pace, colomboToday());
    return when ? copy.ruler.atThisPace(fmtDay(when)) : copy.books.noPace;
  }, [page, max, logs]);

  if (!book) return null;
  const title = leadTitle(book, lead).main;
  const atEnd = page >= max && !!book.totalPages;

  const jump = (p: number) => {
    const next = clampPage(p, max);
    setPage(next);
    ruler.current?.scrollTo(next);
  };

  const save = () => {
    if (atEnd) {
      openSheet('finish', { itemId });
      return;
    }
    if (page < last && !confirmBack) {
      setConfirmBack(true);
      return;
    }
    const previous = last;
    logPage.mutate({ itemId, page, logId: newId(), loggedAt: new Date().toISOString() });
    onClose();
    toast({
      message: copy.ruler.logged(page, title),
      action: {
        label: copy.common.undo,
        // Logging the earlier page again replaces today's higher log (log_page semantics).
        onPress: () => logPage.mutate({ itemId, page: previous, logId: newId(), loggedAt: new Date().toISOString() }),
      },
    });
  };

  return (
    <View style={{ marginHorizontal: -layout.gutterScreen }}>
      <Txt family="hand" weight={400} size="lg" color="textAccent" style={{ paddingHorizontal: layout.gutterScreen }}>
        {title}
      </Txt>
      <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 6 }}>
        {typing ? (
          <TextInput
            autoFocus
            keyboardType="number-pad"
            accessibilityLabel={copy.ruler.typePage}
            defaultValue={String(page)}
            selectTextOnFocus
            onSubmitEditing={(e) => {
              jump(Number(e.nativeEvent.text) || 0);
              setTyping(false);
            }}
            onBlur={() => setTyping(false)}
            style={{
              fontFamily: fontFamily('display', 700),
              fontSize: 64,
              color: t.textPrimary,
              textAlign: 'center',
              minWidth: 160,
              padding: 0,
            }}
          />
        ) : (
          <Press
            accessibilityRole="button"
            accessibilityHint={copy.ruler.typePage}
            onPress={() => setTyping(true)}
            scaleTo={1}
          >
            <Txt role="numeric" size="5xl" leading={1} style={{ letterSpacing: -0.03 * 64 }} testID="ruler-page">
              {page}
            </Txt>
          </Press>
        )}
        <Txt family="ui" weight={600} size="xs" color="textMuted" style={{ marginTop: 4 }}>
          {page > last ? copy.ruler.sinceYesterday(page - last) : copy.ruler.lastLogged(last)}
        </Txt>
      </View>

      <View style={{ marginVertical: 14 }}>
        <PageRuler
          ref={ruler}
          max={max}
          initial={last}
          onChange={(p) => {
            setPage(p);
            setConfirmBack(false);
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: layout.gutterScreen }}>
        {[10, 25, 50].map((n) => (
          <Press
            key={n}
            accessibilityRole="button"
            onPress={() => jump(page + n)}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: t.borderStrong,
              backgroundColor: t.surfaceCard,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt family="ui" weight={700} size={14} color="textSecondary">{`+${n}`}</Txt>
          </Press>
        ))}
        <Press
          accessibilityRole="button"
          testID="ruler-end"
          onPress={() => jump(max)}
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: t.borderStrong,
            backgroundColor: t.surfaceCard,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt family="ui" weight={700} size={14} color="textSecondary">
            {copy.ruler.end}
          </Txt>
        </Press>
      </View>

      <Txt
        family="hand"
        weight={400}
        size={19}
        color="textMuted"
        style={{ padding: 16, paddingHorizontal: layout.gutterScreen }}
      >
        {finishLine}
      </Txt>

      <View style={{ paddingHorizontal: layout.gutterScreen, gap: 10 }}>
        {confirmBack && (
          <Txt family="ui" weight={600} size="xs" color="statusDanger" align="center">
            {copy.ruler.goBack(page)}
          </Txt>
        )}
        <Button variant="accent" size="lg" block testID="ruler-save" onPress={save}>
          {atEnd ? copy.ruler.finish : confirmBack ? copy.ruler.goBackYes : copy.ruler.logPage(page)}
        </Button>
      </View>
    </View>
  );
}

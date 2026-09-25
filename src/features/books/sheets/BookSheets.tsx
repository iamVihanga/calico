import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';

import { Kiri } from '@/components/calico/Kiri';
import { RatingStars } from '@/components/calico/RatingStars';
import { Button } from '@/components/ds/Button';
import { Checkbox } from '@/components/ds/Checkbox';
import { Icon, type IconName } from '@/components/ds/Icon';
import { Input } from '@/components/ds/Input';
import { Press } from '@/components/ds/Press';
import { Tag } from '@/components/ds/Tag';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { addLocalDays, colomboToday, daysBetween, fmtShort } from '@/lib/dates';
import { openSheet } from '@/lib/stores/sheet';
import { toast } from '@/lib/stores/toast';
import { layout, useTheme } from '@/theme';

import {
  announceStatus,
  useBook,
  useDeleteItem,
  useFinishBook,
  useLeadScript,
  useQueueBook,
  useSetBookStatus,
  useStopBook,
} from '../hooks';
import { leadAuthor, leadTitle } from '../logic';

type Props = { itemId: string; onClose: () => void };

// The note prompt rotates each time the Finish sheet opens (brief §7.8).
let promptIndex = 0;

export function FinishSheetBody({ itemId, onClose }: Props) {
  const lead = useLeadScript();
  const book = useBook(itemId).data;
  const finish = useFinishBook();
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [returnLoan, setReturnLoan] = useState(true);
  const [prompt] = useState(() => copy.finish.prompts[promptIndex++ % copy.finish.prompts.length]);
  if (!book) return null;

  const today = colomboToday();
  const title = leadTitle(book, lead).main;
  const days = book.startedAt ? Math.max(1, daysBetween(book.startedAt, today)) : null;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ alignItems: 'center', paddingVertical: 6 }}>
        <Kiri pose="stretch" width={132} />
      </View>
      <Txt family="hand" weight={400} size={22} leading={1} color="textAccent">
        {copy.finish.hand}
      </Txt>
      <Txt family="display" weight={700} size={26} leading={1.16} style={{ letterSpacing: -0.02 * 26 }}>
        {copy.finish.headline(title)}
      </Txt>
      <Txt family="ui" weight={600} size="xs" color="textMuted">
        {copy.finish.stats(days, book.totalPages)}
      </Txt>
      <View style={{ marginTop: 8 }}>
        <RatingStars value={rating} onChange={setRating} />
      </View>
      <Input multiline rows={2} value={note} onChange={setNote} placeholder={prompt} accessibilityLabel={prompt} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 }}>
        <Txt family="ui" weight={600} size={14}>
          {copy.finish.finished}
        </Txt>
        <Txt family="ui" weight={600} size={14} color="textAccent">
          {copy.finish.today(fmtShort(today))}
        </Txt>
      </View>
      {book.loan && (
        <Checkbox label={copy.finish.returnToo(book.loan.party)} checked={returnLoan} onChange={setReturnLoan} />
      )}
      <Button
        variant="accent"
        size="lg"
        block
        testID="finish-save"
        onPress={() => {
          finish.mutate({
            itemId,
            on: today,
            rating: rating || null,
            note: note.trim() || null,
            returnLoan: !!book.loan && returnLoan,
          });
          onClose();
          toast({
            message: copy.finish.done(title),
            action: { label: copy.finish.open, onPress: () => router.push(`/book/${itemId}`) },
          });
        }}
      >
        {copy.finish.save}
      </Button>
    </View>
  );
}

export function StopSheetBody({ itemId, onClose }: Props) {
  const lead = useLeadScript();
  const book = useBook(itemId).data;
  const stop = useStopBook();
  const [reason, setReason] = useState<string | null>(null);
  if (!book) return null;
  const later = reason === copy.stop.maybeLater;
  const title = leadTitle(book, lead).main;

  return (
    <View style={{ gap: 6 }}>
      <Txt family="display" weight={700} size={22} style={{ letterSpacing: -0.02 * 22 }}>
        {copy.stop.headline(title, book.currentPage)}
      </Txt>
      <Txt family="ui" size="xs" color="textMuted">
        {copy.stop.body}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {copy.stop.reasons.map((r) => (
          <Tag key={r} selected={reason === r} onPress={() => setReason(reason === r ? null : r)}>
            {r}
          </Tag>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
        <Button variant="secondary" block style={{ flex: 1 }} onPress={onClose}>
          {copy.stop.keep}
        </Button>
        <Button
          variant="accent"
          block
          style={{ flex: 1 }}
          testID="stop-confirm"
          onPress={() => {
            stop.mutate({ itemId, reason: later ? null : reason, toRead: later });
            onClose();
            announceStatus(book, later ? 'to_read' : 'abandoned', lead);
          }}
        >
          {later ? copy.stop.toRead : copy.stop.stop}
        </Button>
      </View>
    </View>
  );
}

/** Moving to Reading: pick the start date; from Read it's a re-read (brief §7.6). */
export function StartReadingSheetBody({ itemId, reread, onClose }: Props & { reread: boolean }) {
  const lead = useLeadScript();
  const book = useBook(itemId).data;
  const setStatus = useSetBookStatus();
  const today = colomboToday();
  const [on, setOn] = useState(today);
  if (!book) return null;
  const choices = [
    { label: copy.startDate.today, date: today },
    { label: copy.startDate.yesterday, date: addLocalDays(today, -1) },
    { label: copy.startDate.daysAgo(2), date: addLocalDays(today, -2) },
    { label: copy.startDate.daysAgo(7), date: addLocalDays(today, -7) },
  ];
  return (
    <View style={{ gap: 12 }}>
      {reread && (
        <Txt family="ui" size="xs" color="textMuted">
          {copy.startDate.rereadBody}
        </Txt>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {choices.map((c) => (
          <Tag key={c.date} selected={on === c.date} onPress={() => setOn(c.date)}>
            {c.label}
          </Tag>
        ))}
      </View>
      <Button
        variant="accent"
        size="lg"
        block
        testID="start-reading"
        onPress={() => {
          setStatus.mutate({ itemId, status: 'reading', on });
          onClose();
          announceStatus(book, 'reading', lead);
        }}
      >
        {copy.startDate.start}
      </Button>
    </View>
  );
}

export function OverflowSheetBody({ itemId, onClose }: Props) {
  const { t } = useTheme();
  const lead = useLeadScript();
  const book = useBook(itemId).data;
  const queue = useQueueBook();
  if (!book) return null;
  const later = () => {
    onClose();
    toast({ message: copy.errors.notYet });
  };
  const items: { icon: IconName; label: string; run: () => void; testID?: string }[] = [
    { icon: 'edit', label: copy.overflow.edit, run: later },
    {
      icon: 'playlist_add',
      label: copy.overflow.upNext,
      testID: 'overflow-upnext',
      run: () => {
        onClose();
        void queue(itemId);
      },
    },
    { icon: 'photo_camera', label: copy.overflow.cover, run: later },
    {
      icon: 'share',
      label: copy.overflow.share,
      run: () => {
        onClose();
        const author = leadAuthor(book, lead);
        void Share.share({
          message: author ? `${leadTitle(book, lead).main} — ${author}` : leadTitle(book, lead).main,
        });
      },
    },
    {
      icon: 'delete',
      label: copy.overflow.delete,
      testID: 'overflow-delete',
      run: () => openSheet('confirmDelete', { itemId }),
    },
  ];
  return (
    <View style={{ marginHorizontal: -layout.gutterScreen }}>
      {items.map((o) => (
        <Press
          key={o.label}
          accessibilityRole="button"
          testID={o.testID}
          onPress={o.run}
          scaleTo={1}
          pressedStyle={{ backgroundColor: t.surfaceQuiet }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingHorizontal: 20 }}
        >
          <Icon name={o.icon} size={20} color="textAccent" />
          <Txt family="ui" size="sm">
            {o.label}
          </Txt>
        </Press>
      ))}
    </View>
  );
}

export function ConfirmDeleteSheetBody({ itemId, onClose }: Props) {
  const lead = useLeadScript();
  const book = useBook(itemId).data;
  const del = useDeleteItem();
  const pathname = usePathname();
  if (!book) return null;
  const title = leadTitle(book, lead).main;
  return (
    <View style={{ gap: 14 }}>
      <Txt family="display" weight={700} size={22}>
        {copy.overflow.confirmDelete(title)}
      </Txt>
      <Txt family="ui" size="xs" color="textSecondary">
        {copy.overflow.confirmDeleteBody}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button variant="secondary" block style={{ flex: 1 }} onPress={onClose}>
          {copy.ruler.cancel}
        </Button>
        <Button
          variant="danger"
          block
          testID="confirm-delete"
          style={{ flex: 1 }}
          onPress={() => {
            del.mutate({ itemId });
            onClose();
            if (pathname === `/book/${itemId}` && router.canGoBack()) router.back();
            toast({ message: copy.overflow.deleted(title) });
          }}
        >
          {copy.overflow.delete}
        </Button>
      </View>
    </View>
  );
}

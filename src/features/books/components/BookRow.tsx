import { router } from 'expo-router';
import { memo, useRef } from 'react';
import { View } from 'react-native';
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { CoverPhoto } from '@/components/calico/CoverPhoto';
import { coverFor } from '@/components/calico/coverPalette';
import { coverRadius } from '@/components/calico/GeneratedCover';
import { Icon, type IconName } from '@/components/ds/Icon';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { openSheet } from '@/lib/stores/sheet';
import { radius, shadow, size, tracking, useTheme } from '@/theme';

import { leadAuthor, leadTitle, nextLogicalStatus, statusLabel } from '../logic';
import type { Book, BookStatus, LeadScript } from '../types';

type Props = {
  book: Book;
  lead: LeadScript;
  onStatus: (book: Book, status: BookStatus) => void;
  onQueue: (id: string) => void;
};

/**
 * List row (prototype list view). Swipe right = next logical status; swipe left reveals
 * Up next / Collection / Delete. The ⋯ button opens the same actions (gesture alternative).
 */
export const BookRow = memo(function BookRow({ book, lead, onStatus, onQueue }: Props) {
  const { t } = useTheme();
  const ref = useRef<SwipeableMethods>(null);
  const p = coverFor(book.id);
  const { main } = leadTitle(book, lead);
  const next = nextLogicalStatus(book.status);
  const reading = book.status === 'reading';
  const meta = statusLabel(book.status) + (reading ? ` · ${book.currentPage}/${book.totalPages ?? '?'}` : '');

  const action = (icon: IconName, label: string, run: () => void) => (
    <Press
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        ref.current?.close();
        run();
      }}
      style={{ minWidth: 74, alignItems: 'center', justifyContent: 'center', gap: 5 }}
    >
      <Icon name={icon} size={19} color="textAccent" />
      <Txt family="ui" weight={700} size={10} color="textSecondary" style={{ letterSpacing: 0.3 }}>
        {label}
      </Txt>
    </Press>
  );

  return (
    <View style={{ borderRadius: radius.lg, boxShadow: shadow.sm, overflow: 'hidden' }}>
      <ReanimatedSwipeable
        ref={ref}
        friction={1.6}
        leftThreshold={70}
        rightThreshold={60}
        overshootLeft={false}
        overshootRight={false}
        containerStyle={{ backgroundColor: t.surfaceSunk }}
        renderLeftActions={() => (
          <View style={{ flexDirection: 'row', backgroundColor: t.surfaceAccentSoft }}>
            {action('check', statusLabel(next), () => onStatus(book, next))}
          </View>
        )}
        renderRightActions={() => (
          <View style={{ flexDirection: 'row', backgroundColor: t.surfaceSunk }}>
            {action('playlist_add', copy.library.swipe.upNext, () => onQueue(book.id))}
            {action('category', copy.library.swipe.collection, () =>
              openSheet('addToCollection', { itemId: book.id, title: main }),
            )}
            {action('delete', copy.library.swipe.delete, () => openSheet('confirmDelete', { itemId: book.id }))}
          </View>
        )}
        onSwipeableOpen={(direction) => {
          // Swiping right (revealing the left action) applies the next status straight away.
          if (direction === SwipeDirection.RIGHT) {
            ref.current?.close();
            onStatus(book, next);
          }
        }}
      >
        <Press
          accessibilityRole="button"
          accessibilityLabel={`${main}, ${meta}`}
          accessibilityActions={[
            { name: 'next', label: statusLabel(next) },
            { name: 'queue', label: copy.library.swipe.upNext },
          ]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'next') onStatus(book, next);
            if (e.nativeEvent.actionName === 'queue') onQueue(book.id);
          }}
          testID={`book-row-${book.id}`}
          scaleTo={0.99}
          onPress={() => router.push(`/book/${book.id}`)}
          style={{
            flexDirection: 'row',
            gap: 14,
            paddingVertical: 14,
            paddingLeft: 14,
            paddingRight: 12,
            backgroundColor: t.surfaceCard,
          }}
        >
          <View
            style={[
              { width: 50, height: 74, backgroundColor: p.bg, boxShadow: shadow.xs, overflow: 'hidden' },
              coverRadius,
            ]}
          >
            <CoverPhoto item={book} />
          </View>
          <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 2 }}>
            <Txt family="display" weight={700} size={16} leading={1.2} numberOfLines={1}>
              {main}
            </Txt>
            <Txt family="ui" size="2xs" color="textMuted" numberOfLines={1}>
              {leadAuthor(book, lead)}
            </Txt>
            <Txt
              family="ui"
              weight={600}
              size="3xs"
              color={reading ? 'textAccent' : 'textMuted'}
              style={{ letterSpacing: tracking.wide * size['3xs'], textTransform: 'uppercase', marginTop: 3 }}
            >
              {meta}
            </Txt>
          </View>
          <Press
            accessibilityRole="button"
            accessibilityLabel={copy.library.swipe.more}
            onPress={() => ref.current?.openRight()}
            hitSlop={8}
            style={{ width: 38, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="more_horiz" size={20} color="textMuted" />
          </Press>
        </Press>
      </ReanimatedSwipeable>
    </View>
  );
});

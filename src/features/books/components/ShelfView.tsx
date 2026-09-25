import { router } from 'expo-router';
import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { coverFor } from '@/components/calico/coverPalette';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { layout, motion, palette, radius, shadow, useTheme } from '@/theme';

import { leadTitle, spineHeight, spineWidth } from '../logic';
import type { Book, LeadScript } from '../types';

const SPINE_GAP = 6;
const SHELF_PAD = 22;

function Spine({ book, lead }: { book: Book; lead: LeadScript }) {
  const reduced = useReducedMotion();
  const tilt = useSharedValue(0);
  const w = spineWidth(book.totalPages);
  const h = spineHeight(book.id);
  const p = coverFor(book.id);
  const { main } = leadTitle(book, lead);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -12 * tilt.value }, { rotateZ: `${-8 * tilt.value}deg` }],
  }));

  const open = () => {
    if (reduced) {
      router.push(`/book/${book.id}`);
      return;
    }
    // Spine tilts out of the shelf, then the detail opens (plan §11.10).
    tilt.value = withSequence(
      withTiming(1, { duration: motion.duration.fast, easing: Easing.bezier(...motion.easing.out) }),
      withTiming(0, { duration: motion.duration.base }),
    );
    setTimeout(() => router.push(`/book/${book.id}`), motion.duration.fast);
  };

  return (
    <Animated.View style={[{ transformOrigin: 'bottom left' }, style]}>
      <Press
        accessibilityRole="button"
        accessibilityLabel={main}
        onPress={open}
        scaleTo={1}
        style={{
          width: w,
          height: h,
          backgroundColor: p.bg,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          boxShadow: shadow.xs,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <View style={{ width: h - 16, transform: [{ rotate: '-90deg' }] }}>
          <Txt
            family="display"
            weight={700}
            size="3xs"
            tint={p.ink}
            numberOfLines={1}
            align="center"
            allowFontScaling={false}
          >
            {main}
          </Txt>
        </View>
      </Press>
    </Animated.View>
  );
}

/** Books as spines on shelves; spines wrap into rows, each on its own shelf plank. */
export function ShelfView({ books, lead }: { books: Book[]; lead: LeadScript }) {
  const { t } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - SHELF_PAD * 2);

  // Greedy wrap into rows that fit the plank.
  const rows: Book[][] = [];
  let row: Book[] = [];
  let used = 0;
  for (const b of books) {
    const w = spineWidth(b.totalPages) + SPINE_GAP;
    if (width > 0 && used + w > width && row.length) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push(b);
    used += w;
  }
  if (row.length) rows.push(row);

  return (
    <View style={{ paddingHorizontal: layout.gutterScreen }}>
      <View
        onLayout={onLayout}
        style={{
          paddingTop: SHELF_PAD,
          paddingHorizontal: 16,
          backgroundColor: t.surfacePageWarm,
          borderRadius: radius.xl,
        }}
      >
        {rows.map((r, i) => (
          <View key={i} style={{ marginBottom: layout.shelfGap }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: SPINE_GAP, paddingHorizontal: 6 }}>
              {r.map((b) => (
                <Spine key={b.id} book={b} lead={lead} />
              ))}
            </View>
            <View
              style={{ height: 12, borderRadius: radius.sm, backgroundColor: palette.cocoa, boxShadow: shadow.sm }}
            />
          </View>
        ))}
        <Txt family="hand" weight={400} size={18} color="textMuted" align="center" style={{ paddingBottom: 16 }}>
          {copy.library.shelfHint}
        </Txt>
      </View>
    </View>
  );
}

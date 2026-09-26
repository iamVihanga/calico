import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { coverFor } from '@/components/calico/coverPalette';
import { ItemCover } from '@/components/calico/ItemCover';
import { Kiri } from '@/components/calico/Kiri';
import { Button } from '@/components/ds/Button';
import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { useSetBookStatus } from '@/features/books/hooks';
import { useSetMediaStatus } from '@/features/media/hooks';
import { type QueueRow, toQueueItem, useQueue } from '@/features/upnext/hooks';
import { drawPick, PICK_POOL, pickReason } from '@/features/upnext/logic';
import { itemHref } from '@/features/upnext/QueueRowView';
import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';
import { toast } from '@/lib/stores/toast';
import { alpha, motion, palette, radius, shadow, useTheme } from '@/theme';

type Phase = 'shuffle' | 'paw' | 'reveal';
const SHUFFLE_MS = 1000;
const PAW_MS = 500;
const TICK_MS = 140;
const CARD_W = 150;
const DECK = 5;

/**
 * Pick for me (plan §11.8): the top ten riffle, Kiri's paw bats one out, it flips over with the
 * reason. Pick again skips what was already picked this session. Reduced motion: straight to the card.
 */
export default function Pick() {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { rows } = useQueue();
  const top = rows.slice(0, PICK_POOL);
  const [picked] = useState(() => new Set<string>());
  const [round, setRound] = useState(0);
  const [pickId, setPickId] = useState<string | null>(() => {
    const first = drawPick(
      top.map((r) => r.item),
      picked,
    );
    if (first) picked.add(first.id);
    return first?.id ?? null;
  });
  const [phase, setPhase] = useState<Phase>(reduced ? 'reveal' : 'shuffle');
  const setBook = useSetBookStatus();
  const setMedia = useSetMediaStatus();

  // Shuffle for a second with light ticks, then the paw, then the reveal.
  useEffect(() => {
    if (reduced || !pickId) return;
    const tick = setInterval(() => void Haptics.selectionAsync(), TICK_MS);
    const toPaw = setTimeout(() => {
      clearInterval(tick);
      setPhase('paw');
    }, SHUFFLE_MS);
    const toReveal = setTimeout(() => {
      setPhase('reveal');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, SHUFFLE_MS + PAW_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(toPaw);
      clearTimeout(toReveal);
    };
  }, [round, reduced, pickId]);

  const row = top.find((r) => r.item.id === pickId) ?? null;

  const again = () => {
    const next = drawPick(
      top.map((r) => r.item),
      picked,
    );
    if (next) picked.add(next.id);
    setPickId(next?.id ?? null);
    setPhase(reduced ? 'reveal' : 'shuffle');
    setRound((n) => n + 1);
  };

  const start = (r: QueueRow) => {
    const { item } = r;
    if (item.kind === 'book' && item.status !== 'reading') setBook.mutate({ itemId: item.id, status: 'reading' });
    if (item.kind === 'show' && item.status !== 'watching') setMedia.mutate({ itemId: item.id, status: 'watching' });
    if (item.kind !== 'movie') {
      toast({
        message: copy.pick.started(
          item.title,
          item.kind === 'book' ? copy.books.status.reading : copy.mediaStatus.watching,
        ),
      });
    }
    router.replace(itemHref(item) as never);
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        paddingBottom: insets.bottom + 24,
        backgroundColor: palette.ink,
        experimental_backgroundImage: `linear-gradient(180deg, ${palette.forest} 0%, ${palette.ink} 100%)`,
      }}
      testID="screen-pick"
    >
      {!row ? (
        <View style={{ alignItems: 'center', gap: 18 }}>
          <Txt family="hand" weight={400} size="xl" tint={t.accentSecondary} align="center">
            {copy.pick.empty}
          </Txt>
          <Button variant="secondary" onPress={() => router.back()}>
            {copy.pick.close}
          </Button>
        </View>
      ) : phase !== 'reveal' ? (
        <View style={{ alignItems: 'center' }} accessibilityLiveRegion="polite">
          <View style={{ width: 200, height: 280 }}>
            {Array.from({ length: DECK }, (_, i) => (
              <DeckCard key={`${round}-${i}`} i={i} phase={phase} tone={t.cover[i % t.cover.length]!} />
            ))}
          </View>
          <Txt family="hand" weight={400} size={22} tint={t.accentSecondary} style={{ marginTop: 30 }}>
            {phase === 'paw' ? copy.pick.kiriPicks : copy.pick.shuffling}
          </Txt>
          {phase === 'paw' && <Paw />}
        </View>
      ) : (
        <Reveal
          key={`${round}-${row.item.id}`}
          row={row}
          top={top}
          reduced={reduced}
          onAgain={again}
          onStart={() => start(row)}
        />
      )}
    </View>
  );
}

/** One face-down card: riffles left/right while shuffling, fans into an arc when the paw comes. */
function DeckCard({ i, phase, tone }: { i: number; phase: Phase; tone: string }) {
  const x = useSharedValue(i * 6);
  const rot = useSharedValue(i * 2 - 4);
  useEffect(() => {
    const cfg = { duration: motion.duration.slow, easing: Easing.bezier(...motion.easing.cozy) };
    if (phase === 'shuffle') {
      const side = i % 2 ? 1 : -1;
      x.value = withRepeat(
        withSequence(
          withTiming(i * 6 + side * 34, { duration: motion.duration.fast }),
          withTiming(i * 6, { duration: motion.duration.fast }),
        ),
        -1,
      );
      rot.value = withRepeat(
        withSequence(
          withTiming(side * 6, { duration: motion.duration.fast }),
          withTiming(i * 2 - 4, { duration: motion.duration.fast }),
        ),
        -1,
      );
    } else {
      x.value = withTiming(i * 26 - 52, cfg);
      rot.value = withTiming(i * 9 - 18, cfg);
    }
  }, [phase, i, x, rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: CARD_W,
          height: CARD_W * 1.5,
          borderRadius: radius.md,
          backgroundColor: tone,
          boxShadow: shadow.cover,
        },
        style,
      ]}
    />
  );
}

/** Kiri's paw slides up from the bottom edge. */
function Paw() {
  const y = useSharedValue(220);
  useEffect(() => {
    y.value = withTiming(0, { duration: motion.duration.base, easing: Easing.bezier(...motion.easing.out) });
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', bottom: -160 }, style]} pointerEvents="none">
      <Kiri pose="paw" width={120} />
    </Animated.View>
  );
}

/** The picked card flips over (two faces, backface hidden) to cover, title and reason. */
function Reveal({
  row,
  top,
  reduced,
  onAgain,
  onStart,
}: {
  row: QueueRow;
  top: QueueRow[];
  reduced: boolean;
  onAgain: () => void;
  onStart: () => void;
}) {
  const { t } = useTheme();
  const flip = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced)
      flip.value = withTiming(1, { duration: motion.duration.slow, easing: Easing.bezier(...motion.easing.inOut) });
  }, [flip, reduced]);
  const back = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { rotateY: `${flip.value * 180}deg` }] }));
  const front = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateY: `${(flip.value - 1) * 180}deg` }],
  }));
  const { item } = row;
  const loan = item.loan
    ? { direction: item.loan.direction, party: item.loan.party, dueOn: item.loan.dueOn }
    : undefined;
  const reason = pickReason(toQueueItem(row), top.map(toQueueItem), loan, colomboToday());

  return (
    <Animated.View
      entering={reduced ? FadeIn.duration(motion.duration.base) : undefined}
      style={{ alignItems: 'center', gap: 18, width: '100%' }}
    >
      <View style={{ width: 174, height: 261 }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              inset: 0,
              borderRadius: radius.md,
              backgroundColor: coverFor(item.id).bg,
              backfaceVisibility: 'hidden',
            },
            back,
          ]}
        />
        <Animated.View
          style={[{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', boxShadow: shadow.lg }, front]}
        >
          <ItemCover item={item} width={174} titleSize={19} />
        </Animated.View>
      </View>
      <View style={{ alignItems: 'center' }} accessible accessibilityLiveRegion="polite">
        <Txt family="display" weight={700} size={24} align="center" tint={t.textInverse} testID="pick-title">
          {item.title}
        </Txt>
        <Txt
          family="hand"
          weight={400}
          size={19}
          align="center"
          tint={t.accentSecondary}
          style={{ marginTop: 2 }}
          testID="pick-reason"
        >
          {reason}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, width: '100%', maxWidth: 320 }}>
        <Button
          variant="ghost"
          block
          style={{ flex: 1, minHeight: 52, backgroundColor: alpha.cream16, borderColor: t.borderInverse }}
          onPress={onAgain}
          testID="pick-again"
        >
          {copy.pick.again}
        </Button>
        <Button variant="accent" block style={{ flex: 1, minHeight: 52 }} onPress={onStart} testID="pick-start">
          {copy.pick.start}
        </Button>
      </View>
      <Press
        accessibilityRole="button"
        onPress={() => router.back()}
        style={{ minHeight: 44, justifyContent: 'center' }}
        testID="pick-close"
      >
        <Txt family="ui" weight={600} size="xs" tint={t.textInverseMuted} style={{ textDecorationLine: 'underline' }}>
          {copy.pick.close}
        </Txt>
      </Press>
    </Animated.View>
  );
}

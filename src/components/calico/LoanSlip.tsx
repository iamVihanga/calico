import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  LayoutAnimationConfig,
  useReducedMotion,
  withTiming,
  type EntryAnimationsValues,
  type LayoutAnimation,
} from 'react-native-reanimated';

import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { Txt } from '@/components/ds/Txt';
import type { Loan } from '@/features/books/types';
import { copy } from '@/i18n/en';
import { daysBetween, type LocalDate } from '@/lib/dates';
import { alpha, motion, palette, radius, shadow, size, tracking, useTheme } from '@/theme';

import { DateStamp } from './DateStamp';

/** A renewal's new stamp lands: scale 1.4 → 1 with the purr easing (plan §11.4). */
function stampLand(_: EntryAnimationsValues): LayoutAnimation {
  'worklet';
  const cfg = { duration: motion.duration.slow, easing: Easing.bezier(...motion.easing.purr) };
  return {
    initialValues: { opacity: 0, transform: [{ scale: 1.4 }] },
    animations: { opacity: withTiming(1, cfg), transform: [{ scale: withTiming(1, cfg) }] },
  };
}

/** The previous due stamp gets a strike line drawn across it. */
function strikeIn(_: EntryAnimationsValues): LayoutAnimation {
  'worklet';
  const cfg = { duration: motion.duration.slow, easing: Easing.bezier(...motion.easing.out) };
  return {
    initialValues: { transform: [{ scaleX: 0 }] },
    animations: { transform: [{ scaleX: withTiming(1, cfg) }] },
  };
}

/** Diagonal hatch: overdue is shown by pattern and label, not colour alone (brief §5). */
export const hatch = `repeating-linear-gradient(135deg, transparent 0px, transparent 6px, ${alpha.black18} 6px, ${alpha.black18} 12px)`;

/** The big rotated OVERDUE stamp across a slip. */
export function OverdueStamp({ compact = false }: { compact?: boolean }) {
  const { t } = useTheme();
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        right: compact ? -18 : -24,
        top: compact ? 12 : 60,
        paddingVertical: compact ? 4 : 8,
        paddingHorizontal: compact ? 22 : 30,
        backgroundColor: t.statusDanger,
        experimental_backgroundImage: hatch,
        transform: [{ rotate: '-14deg' }],
      }}
    >
      <Txt role="label" size={compact ? 11 : 15} tint={palette.cream}>
        {copy.loan.overdue}
      </Txt>
    </View>
  );
}

type Props = {
  loan: Loan;
  today: LocalDate;
  onRenew: () => void;
  onReturned: () => void;
};

/**
 * The library date card glued inside the book (brief §7.9, plan §11.4): library name, BORROWED and
 * DUE columns of ink stamps (latest last), due line, renewal count, Renew and Returned.
 * Lent-out loans reuse it as "Lent to {name}" without Renew.
 */
export function LoanSlip({ loan, today, onRenew, onReturned }: Props) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const lent = loan.direction === 'lent';
  const days = loan.dueOn ? daysBetween(today, loan.dueOn) : null;
  const overdue = days !== null && days < 0;
  const last = loan.dueStamps.length - 1;

  return (
    <View
      testID="loan-slip"
      style={{ backgroundColor: t.surfaceCard, borderRadius: radius.lg, boxShadow: shadow.sm, overflow: 'hidden' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: t.surfacePageWarm,
        }}
      >
        <Icon name={lent ? 'volunteer_activism' : 'local_library'} size={19} color="textAccent" />
        <Txt
          family="ui"
          weight={700}
          size="2xs"
          tint={t.inkOnWarm}
          numberOfLines={1}
          style={{ flex: 1, letterSpacing: tracking.wide * size['2xs'], textTransform: 'uppercase' }}
        >
          {lent ? copy.loan.lentTo(loan.party) : loan.party}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', padding: 16 }}>
        <View style={{ flex: 1 }}>
          <Txt role="label" size={10} color="textMuted" style={{ marginBottom: 10 }}>
            {lent ? copy.loan.lent : copy.loan.borrowed}
          </Txt>
          <DateStamp date={loan.borrowedOn} variant="borrowed" rotate={-2} />
        </View>
        <View style={{ width: 1, backgroundColor: t.borderSoft, marginHorizontal: 16 }} />
        <View style={{ flex: 1 }}>
          <Txt role="label" size={10} color="textMuted" style={{ marginBottom: 10 }}>
            {copy.loan.due}
          </Txt>
          {loan.dueStamps.length === 0 ? (
            <Txt family="ui" size="xs" color="textMuted">
              {copy.loanForm.noDue}
            </Txt>
          ) : (
            // Stamps already on the slip don't animate; a renewal's new stamp and strike line do.
            <LayoutAnimationConfig skipEntering>
              <View style={{ gap: 8, alignItems: 'flex-start' }}>
                {loan.dueStamps.map((d, i) => (
                  <Animated.View
                    key={d}
                    entering={reduced ? FadeIn.duration(motion.duration.fast) : stampLand}
                    testID={i === last ? 'due-stamp-current' : 'due-stamp-old'}
                  >
                    <DateStamp date={d} variant={i < last ? 'old' : 'current'} strikeText={false} />
                    {i < last && (
                      <Animated.View
                        entering={reduced ? FadeIn.duration(motion.duration.fast) : strikeIn}
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          left: 4,
                          right: 4,
                          top: '50%',
                          height: 2,
                          backgroundColor: t.textMuted,
                          transformOrigin: 'left',
                        }}
                      />
                    )}
                  </Animated.View>
                ))}
              </View>
            </LayoutAnimationConfig>
          )}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 14,
          gap: 12,
        }}
      >
        <Txt family="ui" weight={600} size="2xs" color={overdue ? 'statusDanger' : 'textSecondary'} testID="due-line">
          {days !== null ? copy.loan.dueLine(days) : ''}
        </Txt>
        {!lent && (
          <Txt family="ui" weight={600} size="2xs" color="textMuted">
            {loan.renewalCount ? copy.loan.renewed(loan.renewalCount) : copy.loan.notRenewed}
          </Txt>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
        {!lent && (
          <Button variant="secondary" block style={{ flex: 1 }} onPress={onRenew} testID="loan-renew">
            {copy.loan.renew}
          </Button>
        )}
        <Button variant="accent" block style={{ flex: 1 }} onPress={onReturned} testID="loan-returned">
          {copy.loan.returned}
        </Button>
      </View>

      {overdue && <OverdueStamp />}
    </View>
  );
}

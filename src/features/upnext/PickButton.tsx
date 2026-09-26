import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { radius, shadow, useTheme } from '@/theme';

/** The dark "Pick for me" pill with its handwritten lead-in (prototype cta tokens). */
export function PickButton({ hand, onPress }: { hand: string; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={copy.pick.cta}
      testID="pick-for-me"
      onPress={onPress}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: t.ctaBg,
        borderRadius: radius.pill,
        boxShadow: shadow.lg,
      }}
    >
      <Txt family="hand" weight={400} size={22} tint={t.ctaAccent}>
        {hand}
      </Txt>
      <Txt family="ui" weight={700} size={17} tint={t.ctaFg}>
        {copy.pick.cta}
      </Txt>
    </Press>
  );
}

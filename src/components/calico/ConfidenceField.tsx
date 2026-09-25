import { Input, type InputProps } from '@/components/ds/Input';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { useTheme } from '@/theme';

export type Confidence = 'manual' | 'ai' | 'low';

/**
 * Review field with the AI states from the brief: ✦ = filled by AI; low confidence adds a dotted
 * underline and a "check" hint (pattern + label, not just colour).
 */
export function ConfidenceField({ confidence = 'manual', hint, ...props }: InputProps & { confidence?: Confidence }) {
  const { t } = useTheme();
  const low = confidence === 'low';
  return (
    <Input
      {...props}
      hint={low ? copy.capture.check : hint}
      trailing={
        confidence !== 'manual' ? (
          <Txt family="ui" size="xs" color="textAccent" accessibilityLabel={copy.capture.aiBadge}>
            ✦
          </Txt>
        ) : undefined
      }
      fieldStyle={low ? { borderStyle: 'dotted', borderBottomWidth: 2, borderBottomColor: t.accentPrimary } : undefined}
    />
  );
}

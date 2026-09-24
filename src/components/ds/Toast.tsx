import { View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, shadow, space, type Theme, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

/** `cta` is the prototype app's toast (ink by day, cream by night). The others are DS kit tones. */
export type ToastTone = 'cta' | 'ink' | 'forest' | 'accent';

export type ToastAction = { label: string; onPress: () => void };

type Props = {
  message: string;
  hand?: boolean;
  icon?: IconName;
  tone?: ToastTone;
  action?: ToastAction;
  style?: StyleProp<ViewStyle>;
};

function toneColors(t: Theme, tone: ToastTone) {
  switch (tone) {
    case 'ink':
      return { bg: t.surfaceInk, fg: t.textInverse, action: t.accentSecondary };
    case 'forest':
      return { bg: t.surfaceInverse, fg: t.textInverse, action: t.accentSecondary };
    case 'accent':
      return { bg: t.accentPrimary, fg: t.textOnAccent, action: t.textOnAccent };
    default:
      return { bg: t.ctaBg, fg: t.ctaFg, action: t.ctaAccent };
  }
}

export function Toast({ message, hand = false, icon, tone = 'cta', action, style }: Props) {
  const { t } = useTheme();
  const c = toneColors(t, tone);
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[4],
          paddingVertical: 14,
          paddingHorizontal: space[5],
          backgroundColor: c.bg,
          borderRadius: radius.lg,
          boxShadow: shadow.lg,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={20} tint={c.fg} />}
      <View style={{ flex: 1 }}>
        <Txt family={hand ? 'hand' : 'ui'} weight={hand ? 700 : 400} size={hand ? 'lg' : 14} leading={1.35} tint={c.fg}>
          {message}
        </Txt>
      </View>
      {action && (
        <Press
          accessibilityRole="button"
          onPress={action.onPress}
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Txt family="ui" weight={700} size={14} tint={c.action}>
            {action.label}
          </Txt>
        </Press>
      )}
    </View>
  );
}

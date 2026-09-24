import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { layout, motion, palette, radius, shadow, space, useTheme } from '@/theme';

import { Press } from './Press';
import { Txt } from './Txt';

type Props = {
  label?: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const TRACK_W = 52;
const KNOB = 26;
const PAD = 3;

export function Switch({ label, description, checked = false, disabled, onChange, testID, style }: Props) {
  const { t } = useTheme();
  const reduced = useReducedMotion();
  const x = useSharedValue(checked ? TRACK_W - KNOB - PAD * 2 : 0);

  useEffect(() => {
    x.value = withTiming(checked ? TRACK_W - KNOB - PAD * 2 : 0, {
      duration: reduced ? 0 : motion.duration.base,
      easing: Easing.bezier(...motion.easing.purr),
    });
  }, [checked, reduced, x]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Press
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={label}
      accessibilityHint={description}
      testID={testID}
      disabled={disabled}
      scaleTo={1}
      onPress={() => onChange?.(!checked)}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: space[5],
          minHeight: layout.hitMin,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {(label || description) && (
        <View style={{ flex: 1, gap: 2 }}>
          {label && (
            <Txt family="ui" weight={600} size="sm" leading={1.45}>
              {label}
            </Txt>
          )}
          {description && (
            <Txt family="ui" size="2xs" leading={1.45} color="textMuted">
              {description}
            </Txt>
          )}
        </View>
      )}
      <View
        style={{
          width: TRACK_W,
          height: 32,
          borderRadius: radius.pill,
          padding: PAD,
          backgroundColor: checked ? t.accentPrimary : palette.biscuit,
        }}
      >
        <Animated.View
          style={[
            {
              width: KNOB,
              height: KNOB,
              borderRadius: radius.pill,
              backgroundColor: palette.white,
              boxShadow: shadow.xs,
            },
            knob,
          ]}
        />
      </View>
    </Press>
  );
}

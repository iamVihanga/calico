import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

import { layout, space, useTheme } from '@/theme';

import { Press } from './Press';
import { Txt } from './Txt';

type Props = {
  label: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function Checkbox({ label, description, checked = false, disabled, onChange, testID, style }: Props) {
  const { t } = useTheme();
  return (
    <Press
      accessibilityRole="checkbox"
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
          gap: space[4],
          alignItems: 'flex-start',
          minHeight: layout.hitMin,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 24,
          height: 24,
          marginTop: 2,
          borderRadius: 8,
          backgroundColor: checked ? t.surfaceInk : t.surfaceCard,
          borderWidth: 1,
          borderColor: checked ? 'transparent' : t.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && (
          <Svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke={t.textInverse}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Polyline points="20 6 9 17 4 12" />
          </Svg>
        )}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt family="ui" weight={600} size="sm" leading={1.45}>
          {label}
        </Txt>
        {description && (
          <Txt family="ui" size="2xs" leading={1.45} color="textMuted">
            {description}
          </Txt>
        )}
      </View>
    </Press>
  );
}

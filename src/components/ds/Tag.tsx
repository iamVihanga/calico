import type { ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { layout, radius, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';
import { copy } from '@/i18n/en';

type Props = {
  children: ReactNode;
  selected?: boolean;
  icon?: IconName;
  /** Filter chips show a count after the label ("Reading 2"). */
  count?: number;
  onPress?: () => void;
  onRemove?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Filter and collection chip. Follows the prototype app's chips: selected chips are marmalade
 * with on-accent ink (the DS kit's ink fill is not used in the app screens).
 */
export function Tag({ children, selected = false, icon, count, onPress, onRemove, testID, style }: Props) {
  const { t } = useTheme();
  const fg = selected ? t.textOnAccent : t.textSecondary;
  return (
    <Press
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      hitSlop={(layout.hitMin - 38) / 2}
      pressedStyle={selected ? null : { backgroundColor: t.surfacePageWarm }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 8,
          minHeight: 38,
          paddingHorizontal: 15,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: selected ? 'transparent' : t.borderSoft,
          backgroundColor: selected ? t.accentPrimary : t.surfaceCard,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={16} tint={fg} />}
      <Txt family="ui" weight={600} size="xs" leading={1.3} tint={fg}>
        {children}
        {count !== undefined ? ` ${count}` : ''}
      </Txt>
      {onRemove && (
        <Press
          accessibilityRole="button"
          accessibilityLabel={copy.common.remove}
          hitSlop={12}
          onPress={onRemove}
          style={{ opacity: 0.5 }}
        >
          <Icon name="close" size={16} tint={fg} />
        </Press>
      )}
    </Press>
  );
}

import { useState } from 'react';
import { TextInput, type TextInputProps, View, type StyleProp, type ViewStyle } from 'react-native';

import { copy } from '@/i18n/en';
import { hasSinhala } from '@/lib/sinhala';
import { fontFamily, layout, radius, shadow, size, space, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';

type Props = Omit<TextInputProps, 'style' | 'onChange'> & {
  value: string;
  placeholder?: string;
  icon?: IconName;
  onChange?: (text: string) => void;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SearchField({
  value,
  placeholder = copy.search.placeholder,
  icon = 'search',
  onChange,
  onClear,
  style,
  ...rest
}: Props) {
  const { t } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: space[4],
          backgroundColor: t.surfaceCard,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: focus ? t.accentPrimary : t.borderSoft,
          paddingHorizontal: space[6],
          minHeight: layout.hitMin,
          boxShadow: focus ? shadow.focus : shadow.xs,
        },
        style,
      ]}
    >
      <Icon name={icon} size={20} color="textMuted" />
      <TextInput
        value={value}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        onChangeText={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholderTextColor={t.textMuted}
        selectionColor={t.accentPrimary}
        cursorColor={t.accentPrimary}
        returnKeyType="search"
        style={{
          flex: 1,
          fontFamily: fontFamily(hasSinhala(value) ? 'sinhala' : 'ui', 400),
          fontSize: size.sm,
          color: t.textPrimary,
          paddingVertical: 12,
        }}
        {...rest}
      />
      {!!value && onClear && (
        <Press
          accessibilityRole="button"
          accessibilityLabel={copy.common.clearSearch}
          onPress={onClear}
          hitSlop={11}
          style={{
            width: 26,
            height: 26,
            borderRadius: radius.pill,
            backgroundColor: t.surfaceQuiet,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size={16} color="textSecondary" />
        </Press>
      )}
    </View>
  );
}

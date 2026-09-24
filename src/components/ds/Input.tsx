import { forwardRef, type ReactNode, useState } from 'react';
import { TextInput, type TextInputProps, View, type StyleProp, type ViewStyle } from 'react-native';

import { hasSinhala } from '@/lib/sinhala';
import { fontFamily, layout, leading, radius, shadow, size, space, useTheme } from '@/theme';

import { FieldLabel } from './FieldLabel';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

export type InputProps = Omit<TextInputProps, 'style' | 'onChange' | 'multiline'> & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  onChange?: (text: string) => void;
  /** Right-side accessory inside the field (ConfidenceField's ✦). */
  trailing?: ReactNode;
  fieldStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    hint,
    error,
    icon,
    disabled,
    multiline = false,
    rows = 3,
    onChange,
    value,
    trailing,
    fieldStyle,
    style,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const { t } = useTheme();
  const [focus, setFocus] = useState(false);
  const sinhala = !!value && hasSinhala(value);
  const lineHeight = Math.round(size.sm * (sinhala ? Math.max(leading.relaxed, 1.5) : leading.relaxed));

  return (
    <View style={[{ gap: space[3] }, style]}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            gap: space[4],
            backgroundColor: disabled ? t.surfaceQuiet : t.surfaceCard,
            borderWidth: 1,
            borderColor: error ? t.statusDanger : focus ? t.accentPrimary : t.borderSoft,
            borderRadius: radius.md,
            paddingHorizontal: space[5],
            minHeight: layout.hitMin,
            boxShadow: focus ? shadow.focus : undefined,
          },
          fieldStyle,
        ]}
      >
        {icon && <Icon name={icon} size={20} color="textMuted" style={{ paddingTop: multiline ? 13 : 0 }} />}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? rows : undefined}
          value={value}
          onChangeText={onChange}
          onFocus={(e) => {
            setFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            onBlur?.(e);
          }}
          placeholderTextColor={t.textMuted}
          selectionColor={t.accentPrimary}
          cursorColor={t.accentPrimary}
          style={{
            flex: 1,
            fontFamily: fontFamily(sinhala ? 'sinhala' : 'ui', 400),
            fontSize: size.sm,
            lineHeight,
            color: t.textPrimary,
            paddingVertical: multiline ? 13 : 12,
            minHeight: multiline ? lineHeight * rows + 26 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
          {...rest}
        />
        {trailing}
      </View>
      {(hint || error) && (
        <Txt family="ui" size="2xs" leading={1.45} color={error ? 'statusDanger' : 'textMuted'}>
          {error || hint}
        </Txt>
      )}
    </View>
  );
});

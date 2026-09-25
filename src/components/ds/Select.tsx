import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { layout, radius, space, useTheme } from '@/theme';

import { FieldLabel } from './FieldLabel';
import { Icon } from './Icon';
import { Press } from './Press';
import { Sheet } from './Sheet';
import { Txt } from './Txt';

export type SelectOption<V extends string> = V | { value: V; label: string };

type Props<V extends string> = {
  label?: string;
  value: V;
  options: readonly SelectOption<V>[];
  onChange?: (value: V) => void;
  /** `inline` = a quiet text trigger ("Recently updated ▾") instead of a field. */
  variant?: 'field' | 'inline';
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const valueOf = <V extends string>(o: SelectOption<V>): V => (typeof o === 'string' ? o : o.value);
const labelOf = <V extends string>(o: SelectOption<V>): string => (typeof o === 'string' ? o : o.label);

/** Select field that opens a Sheet list. */
export function Select<V extends string>({
  label,
  value,
  options,
  onChange,
  variant = 'field',
  testID,
  style,
}: Props<V>) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => valueOf(o) === value);

  const trigger =
    variant === 'inline' ? (
      <Press
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: current ? labelOf(current) : value }}
        testID={testID}
        onPress={() => setOpen(true)}
        scaleTo={1}
        hitSlop={4}
        style={[{ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 2 }, style]}
      >
        <Txt family="ui" weight={600} size="xs" color="textMuted">
          {current ? labelOf(current) : value}
        </Txt>
        <Icon name="expand_more" size={18} color="textMuted" />
      </Press>
    ) : null;

  return (
    <View style={variant === 'inline' ? undefined : [{ gap: space[3] }, style]}>
      {trigger}
      {variant === 'field' && label && <FieldLabel>{label}</FieldLabel>}
      {variant === 'field' && (
        <Press
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{ text: current ? labelOf(current) : value }}
          testID={testID}
          onPress={() => setOpen(true)}
          scaleTo={1}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.surfaceCard,
            borderWidth: 1,
            borderColor: t.borderSoft,
            borderRadius: radius.md,
            paddingVertical: 13,
            paddingLeft: space[5],
            paddingRight: space[5],
            minHeight: layout.hitMin,
          }}
        >
          <View style={{ flex: 1 }}>
            <Txt family="ui" weight={600} size="sm" leading={1.3}>
              {current ? labelOf(current) : value}
            </Txt>
          </View>
          <Icon name="expand_more" size={20} color="textMuted" />
        </Press>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <View>
          {options.map((o) => {
            const v = valueOf(o);
            const selected = v === value;
            return (
              <Press
                key={v}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                scaleTo={1}
                pressedStyle={{ backgroundColor: t.surfaceQuiet }}
                onPress={() => {
                  onChange?.(v);
                  setOpen(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: layout.hitMin + 4,
                  paddingHorizontal: space[3],
                  borderRadius: radius.md,
                  borderBottomWidth: 1,
                  borderBottomColor: t.borderHairline,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Txt
                    family="ui"
                    weight={selected ? 700 : 400}
                    size="sm"
                    color={selected ? 'textAccent' : 'textPrimary'}
                  >
                    {labelOf(o)}
                  </Txt>
                </View>
                {selected && <Icon name="check" size={20} color="textAccent" />}
              </Press>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

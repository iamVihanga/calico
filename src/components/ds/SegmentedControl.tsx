import { View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, shadow, useTheme } from '@/theme';

import { Press } from './Press';
import { Txt } from './Txt';

export type SegmentItem<V extends string> = V | { id: V; label: string };

type Props<V extends string> = {
  items: readonly SegmentItem<V>[];
  value: V;
  onChange?: (value: V) => void;
  style?: StyleProp<ViewStyle>;
};

/** Books / Movies / Shows switch: sunk pill track, raised card for the active segment. */
export function SegmentedControl<V extends string>({ items, value, onChange, style }: Props<V>) {
  const { t } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: t.surfaceSunk, borderRadius: radius.pill },
        style,
      ]}
    >
      {items.map((it) => {
        const id = typeof it === 'string' ? it : it.id;
        const label = typeof it === 'string' ? it : it.label;
        const active = id === value;
        return (
          <Press
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange?.(id)}
            style={{
              flex: 1,
              minHeight: 42,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? t.surfaceCard : 'transparent',
              boxShadow: active ? shadow.xs : undefined,
            }}
          >
            <Txt family="ui" weight={700} size={14} leading={1.2} color={active ? 'textPrimary' : 'textMuted'}>
              {label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

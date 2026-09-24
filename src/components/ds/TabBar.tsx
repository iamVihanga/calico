import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { copy } from '@/i18n/en';
import { radius, shadow, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Press } from './Press';
import { Txt } from './Txt';

export type TabItem<V extends string> = { id: V; label: string; icon: IconName };

type Props<V extends string> = {
  items: readonly TabItem<V>[];
  value: V;
  onChange?: (id: V) => void;
  /** Centre capture button: tap opens the Add sheet, long-press opens the camera. */
  onAdd?: () => void;
  onAddLongPress?: () => void;
  /** Render in place instead of floating over the screen (dev gallery). */
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Floating pill nav from the prototype: two tabs, raised marmalade capture button, two tabs.
 * Active tab: accent icon + label on an accent-soft pill.
 */
export function TabBar<V extends string>({ items, value, onChange, onAdd, onAddLongPress, inline, style }: Props<V>) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const half = Math.ceil(items.length / 2);

  const tab = (it: TabItem<V>) => {
    const active = it.id === value;
    const fg = active ? t.textAccent : t.textMuted;
    return (
      <Press
        key={it.id}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={it.label}
        testID={`tab-${it.id}`}
        onPress={() => onChange?.(it.id)}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 52 }}
      >
        <View
          style={{
            width: 42,
            height: 28,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active ? t.surfaceAccentSoft : 'transparent',
          }}
        >
          <Icon name={it.icon} size={23} tint={fg} />
        </View>
        <Txt family="ui" weight={700} size={10} leading={1.2} tint={fg} style={{ letterSpacing: 0.2 }}>
          {it.label}
        </Txt>
      </Press>
    );
  };

  return (
    <View
      accessibilityRole="tabbar"
      style={[
        {
          backgroundColor: t.surfaceCard,
          borderRadius: radius.xl,
          boxShadow: shadow.lg,
          borderWidth: 1,
          borderColor: t.borderHairline,
        },
        inline ? null : { position: 'absolute', left: 14, right: 14, bottom: 12 + insets.bottom },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 70 }}>
        {items.slice(0, half).map(tab)}
        <View style={{ width: 74, alignItems: 'center' }}>
          <Press
            accessibilityRole="button"
            accessibilityLabel={copy.tabs.add}
            accessibilityHint={copy.tabs.addHint}
            testID="tab-add"
            onPress={onAdd}
            onLongPress={onAddLongPress}
            delayLongPress={350}
            style={{
              width: 62,
              height: 62,
              marginTop: -26,
              borderRadius: radius.pill,
              backgroundColor: t.accentPrimary,
              borderWidth: 4,
              borderColor: t.surfaceCard,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: shadow.md,
            }}
          >
            <Icon name="add" size={28} tint={t.textOnAccent} />
          </Press>
        </View>
        {items.slice(half).map(tab)}
      </View>
    </View>
  );
}

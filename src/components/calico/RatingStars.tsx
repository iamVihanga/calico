import { View } from 'react-native';

import { Press } from '@/components/ds/Press';
import { Txt } from '@/components/ds/Txt';
import { copy } from '@/i18n/en';
import { useTheme } from '@/theme';

const STAR = 48;

/** 0.5-step star input. Tap the left half of a star for a half star. */
export function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useTheme();
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max: 5, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(5, value + 0.5));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(0, value - 0.5));
      }}
      style={{ flexDirection: 'row', gap: 4 }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = value >= n ? 1 : value >= n - 0.5 ? 0.5 : 0;
        const star = (g: string) => (
          <Txt family="ui" size={32} leading={1} tint={t.accentSecondary} allowFontScaling={false}>
            {g}
          </Txt>
        );
        return (
          <Press
            key={n}
            accessibilityRole="button"
            accessibilityLabel={copy.finish.star(n)}
            scaleTo={0.9}
            onPress={(e) => onChange(e.nativeEvent.locationX < STAR / 2 ? n - 0.5 : n)}
            style={{ width: STAR, height: STAR, alignItems: 'center', justifyContent: 'center' }}
          >
            <View>
              {star('☆')}
              {fill > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${fill * 100}%`,
                    overflow: 'hidden',
                  }}
                >
                  {star('★')}
                </View>
              )}
            </View>
          </Press>
        );
      })}
    </View>
  );
}

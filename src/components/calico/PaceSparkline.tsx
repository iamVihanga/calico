import { View } from 'react-native';

import { useTheme } from '@/theme';

const MAX_BAR = 40;

/** Pages gained per day for the last 14 days (prototype dSpark: sage bars, 3dp rounded tops). */
export function PaceSparkline({ values, color }: { values: number[]; color?: string }) {
  const { t } = useTheme();
  const max = Math.max(1, ...values);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={values.join(', ')}
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 44 }}
    >
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max(3, Math.round((v / max) * MAX_BAR)),
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            backgroundColor: color ?? t.accentQuiet,
          }}
        />
      ))}
    </View>
  );
}

import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Txt } from '@/components/ds/Txt';
import { radius, shadow, useTheme } from '@/theme';

/** "★★★★½" for a 0.5-step rating. */
export function starString(rating: number | null | undefined): string {
  if (!rating) return '';
  const full = Math.floor(rating);
  return '★'.repeat(full) + (rating - full >= 0.5 ? '½' : '');
}

type Props = {
  /** Display date ("Sat 12 Sep"). */
  date: string;
  rating?: number | null;
  note?: string | null;
  style?: StyleProp<ViewStyle>;
};

/** One viewing: perforated stub edge on the left, date + stars, handwritten note. */
export function TicketStub({ date, rating, note, style }: Props) {
  const { t } = useTheme();
  const stars = starString(rating);
  return (
    <View
      accessible
      accessibilityLabel={[date, rating ? `${rating} stars` : '', note ?? ''].filter(Boolean).join(', ')}
      style={[
        {
          flexDirection: 'row',
          backgroundColor: t.surfaceCard,
          borderRadius: radius.md,
          boxShadow: shadow.sm,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          width: 16,
          backgroundColor: t.surfacePageWarm,
          borderRightWidth: 2,
          borderRightColor: t.borderStrong,
          borderStyle: 'dashed',
        }}
      />
      <View style={{ flex: 1, minWidth: 0, paddingVertical: 14, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <Txt family="ui" weight={700} size="xs" leading={1.3} color="textSecondary">
            {date}
          </Txt>
          {!!stars && (
            <Txt family="ui" size="xs" leading={1.3} color="accentSecondary" style={{ letterSpacing: 1 }}>
              {stars}
            </Txt>
          )}
        </View>
        <View style={{ minHeight: 24 }}>
          {!!note && (
            <Txt family="hand" weight={400} size={18} leading={1.3} color="textMuted">
              {note}
            </Txt>
          )}
        </View>
      </View>
    </View>
  );
}

import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { copy } from '@/i18n/en';
import { type ThemeColor, useTheme } from '@/theme';

export type MediaKind = 'book' | 'movie' | 'show';

type Props = {
  kind: MediaKind;
  color?: ThemeColor;
  tint?: string;
  /** Multiplier on the prototype's base sizes (book 12×16, movie 18×13, show 18×12). */
  scale?: number;
};

const base = { book: [12, 16], movie: [18, 13], show: [18, 12] } as const;

/**
 * Media identity by shape (brief §4.1): book = portrait block with a thick spine,
 * movie = ticket with side notches, show = rounded screen with three episode dots.
 */
export function MediaShapeIcon({ kind, color = 'textSecondary', tint, scale = 1 }: Props) {
  const { t } = useTheme();
  const fill = tint ?? t[color];
  const [w, h] = base[kind];
  const label = copy.media[kind];
  return (
    <Svg
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      {kind === 'book' && (
        <>
          <Rect x={0} y={0} width={w} height={h} rx={1} fill={fill} opacity={0.55} />
          <Rect x={0} y={0} width={4} height={h} rx={1} fill={fill} />
        </>
      )}
      {kind === 'movie' && (
        // ticket: rectangle with semicircle notches on both sides
        <Path d={`M0 0 H${w} V4.5 A2 2 0 0 0 ${w} 8.5 V${h} H0 V8.5 A2 2 0 0 0 0 4.5 Z`} fill={fill} />
      )}
      {kind === 'show' && (
        <>
          <Rect x={0} y={0} width={w} height={8} rx={3} fill={fill} />
          <Circle cx={w / 2 - 5} cy={10.5} r={1.5} fill={fill} />
          <Circle cx={w / 2} cy={10.5} r={1.5} fill={fill} />
          <Circle cx={w / 2 + 5} cy={10.5} r={1.5} fill={fill} />
        </>
      )}
    </Svg>
  );
}

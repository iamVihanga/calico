import Svg, { ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';

import { copy } from '@/i18n/en';
import { palette, useTheme } from '@/theme';

export type KiriPose = 'curled' | 'paw' | 'stretch' | 'asleep';

type Props = {
  pose: KiriPose;
  /** Rendered width; height follows the pose's aspect ratio. */
  width?: number;
};

/**
 * Kiri, the house cat (brief §4.3): a simple line-drawn calico with three coat patches.
 * Placeholder art — the prototype has no drawings; replace with illustrated SVGs when ready.
 */
export function Kiri({ pose, width = 140 }: Props) {
  const { t } = useTheme();
  const line = t.textPrimary;
  const coat = t.surfaceCard;
  const stroke = {
    stroke: line,
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  if (pose === 'paw') {
    const h = (width * 100) / 80;
    return (
      <Svg width={width} height={h} viewBox="0 0 80 100" accessibilityRole="image" accessibilityLabel={copy.kiri.paw}>
        <Defs>
          <ClipPath id="kiri-arm">
            <Path d="M22 100 V52 C22 34 58 34 58 52 V100 Z" />
          </ClipPath>
        </Defs>
        <Path d="M22 100 V52 C22 34 58 34 58 52 V100 Z" fill={coat} />
        <G clipPath="url(#kiri-arm)">
          <Path d="M10 70 C30 62 50 78 70 68 V86 C50 94 30 80 10 88 Z" fill={palette.marmalade} />
          <Path d="M10 92 C30 86 50 98 70 92 V100 H10 Z" fill={palette.ink} />
        </G>
        <Path d="M22 100 V52 C22 34 58 34 58 52 V100" {...stroke} />
        <Ellipse cx={40} cy={56} rx={7} ry={5.5} fill={palette.petal} />
        <Ellipse cx={29} cy={45} rx={3.2} ry={2.8} fill={palette.petal} />
        <Ellipse cx={37} cy={40.5} rx={3.2} ry={2.8} fill={palette.petal} />
        <Ellipse cx={45} cy={40.5} rx={3.2} ry={2.8} fill={palette.petal} />
        <Ellipse cx={52} cy={45} rx={3.2} ry={2.8} fill={palette.petal} />
      </Svg>
    );
  }

  if (pose === 'stretch') {
    const h = (width * 90) / 140;
    const body = 'M34 56 C54 40 84 30 106 32 C120 34 120 52 110 58 L100 58 C84 56 60 64 42 72 Z';
    return (
      <Svg
        width={width}
        height={h}
        viewBox="0 0 140 90"
        accessibilityRole="image"
        accessibilityLabel={copy.kiri.stretch}
      >
        <Defs>
          <ClipPath id="kiri-stretch">
            <Path d={body} />
          </ClipPath>
        </Defs>
        <Path d="M8 83 H132" {...stroke} strokeWidth={1.6} opacity={0.35} />
        <Path d={body} fill={coat} />
        <G clipPath="url(#kiri-stretch)">
          <Ellipse cx={80} cy={40} rx={16} ry={10} fill={palette.marmalade} />
          <Ellipse cx={108} cy={44} rx={9} ry={8} fill={palette.ink} />
        </G>
        <Path d={body} {...stroke} />
        {/* legs */}
        <Path d="M46 70 L16 80 H8 M54 67 L26 82 H18 M100 58 L100 82 M110 58 L113 82" {...stroke} />
        {/* tail */}
        <Path d="M114 38 C128 28 124 12 134 6" {...stroke} />
        {/* head */}
        <Path d="M38 62 m-12 0 a12 11 0 1 0 24 0 a12 11 0 1 0 -24 0" fill={coat} />
        <Path
          d="M28 55 L27 44 L35 51 M41 51 L49 44 L48 55"
          fill={palette.marmalade}
          {...{ stroke: line, strokeWidth: 2.2, strokeLinejoin: 'round' }}
        />
        <Path d="M38 62 m-12 0 a12 11 0 1 0 24 0 a12 11 0 1 0 -24 0" {...stroke} />
        {/* yawning mouth + closed eyes */}
        <Path d="M31 60 q2.5 2 5 0 M40 60 q2.5 2 5 0" {...stroke} strokeWidth={1.6} />
        <Ellipse cx={38} cy={67} rx={2.4} ry={3} fill={line} />
      </Svg>
    );
  }

  // curled / asleep share the loaf-on-a-shelf drawing
  const h = (width * 90) / 120;
  const bodyD = 'M22 58 C22 42 44 36 62 36 C86 36 98 46 98 60 C98 74 80 80 60 80 C40 80 22 74 22 58 Z';
  return (
    <Svg
      width={width}
      height={h}
      viewBox="0 0 120 90"
      accessibilityRole="image"
      accessibilityLabel={pose === 'asleep' ? copy.kiri.asleep : copy.kiri.curled}
    >
      <Defs>
        <ClipPath id="kiri-body">
          <Path d={bodyD} />
        </ClipPath>
      </Defs>
      {/* shelf */}
      <Path d="M6 81 H114" {...stroke} strokeWidth={1.6} opacity={0.35} />
      <Path d={bodyD} fill={coat} />
      <G clipPath="url(#kiri-body)">
        <Ellipse cx={70} cy={42} rx={16} ry={10} fill={palette.marmalade} />
        <Ellipse cx={90} cy={60} rx={9} ry={8} fill={palette.ink} />
      </G>
      <Path d={bodyD} {...stroke} />
      {/* tail wrapped round the front */}
      <Path d="M96 64 C104 76 82 84 56 80 C44 78 36 76 34 72" {...stroke} />
      {/* head */}
      <Path d="M36 56 m-14 0 a14 12.5 0 1 0 28 0 a14 12.5 0 1 0 -28 0" fill={coat} />
      <Path
        d="M25 49 L23 36 L33 45 M39 45 L48 36 L47 49"
        fill={palette.marmalade}
        {...{ stroke: line, strokeWidth: 2.2, strokeLinejoin: 'round' }}
      />
      <Path d="M36 56 m-14 0 a14 12.5 0 1 0 28 0 a14 12.5 0 1 0 -28 0" {...stroke} />
      {/* closed eyes + nose */}
      <Path d="M27 56 q3 3 6 0 M39 56 q3 3 6 0" {...stroke} strokeWidth={1.6} />
      <Path d="M34.5 61 h3 l-1.5 1.8 z" fill={line} />
      {pose === 'asleep' && <Path d="M84 14 h8 l-8 8 h8 M98 4 h6 l-6 6 h6" {...stroke} strokeWidth={1.8} />}
    </Svg>
  );
}

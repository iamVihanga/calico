import Svg, { ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';

import { copy } from '@/i18n/en';
import { palette, useTheme } from '@/theme';

import { Illustration, type IllustrationName } from './Illustration';

export type KiriPose = 'curled' | 'paw' | 'stretch' | 'asleep';

type Props = {
  pose: KiriPose;
  /** Rendered width; height follows the art. */
  width?: number;
};

const ART: Record<Exclude<KiriPose, 'paw'>, IllustrationName> = {
  curled: 'cat-loaf',
  asleep: 'cat-shelf-sleep',
  stretch: 'cat-stretch',
};

/**
 * Kiri, the house cat: the design/v2 illustrations. The paw stays a vector drawing, because Pick for
 * me animates it batting a card out and there is no illustrated paw.
 */
export function Kiri({ pose, width = 140 }: Props) {
  const { t } = useTheme();
  if (pose !== 'paw') return <Illustration name={ART[pose]} width={width} accessibilityLabel={copy.kiri[pose]} />;
  const line = t.textPrimary;
  const coat = t.surfaceCard;
  const stroke = {
    stroke: line,
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

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

import { Children, type ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { hasSinhala, nfc, splitScriptRuns } from '@/lib/sinhala';
import {
  fontFamily,
  roles,
  roleStyle,
  SINHALA_MIN_LEADING,
  sinhalaFamilyFor,
  type FamilyKey,
  type SizeKey,
  size as sizes,
  type ThemeColor,
  type TypeRole,
  useTheme,
  type Weight,
} from '@/theme';

export type TxtProps = Omit<TextProps, 'style' | 'children' | 'role'> & {
  /** Type role (not the accessibility role — use accessibilityRole for that). */
  role?: TypeRole;
  /** Semantic colour key from the theme. Ignored when `tint` is set. */
  color?: ThemeColor;
  /** Raw colour, for components that already resolved one from the theme (e.g. cover ink). */
  tint?: string;
  align?: TextStyle['textAlign'];
  /** Overrides of the role, for the prototype's one-off sizes. Prefer tokens. */
  family?: FamilyKey;
  weight?: Weight;
  size?: SizeKey | number;
  leading?: number;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
};

function textOf(children: ReactNode): string | null {
  const parts = Children.toArray(children);
  if (!parts.every((c) => typeof c === 'string' || typeof c === 'number')) return null;
  return parts.join('');
}

/**
 * The only text primitive. Handles Sinhala: switches to Noto Sans Sinhala for Sinhala runs,
 * keeps the Latin family for Latin runs, and raises line height to at least 1.5× the font size.
 */
/** Android's largest font size is 200%; layouts are checked up to there (plan §11.15). */
const MAX_FONT_SCALE = 2;

export function Txt({
  role = 'body',
  color = 'textPrimary',
  tint,
  align,
  family,
  weight,
  size,
  leading,
  style,
  children,
  allowFontScaling = true,
  ...rest
}: TxtProps) {
  const { t } = useTheme();
  const base = roles[role];
  const spec = {
    ...base,
    family: family ?? base.family,
    weight: weight ?? base.weight,
    size: typeof size === 'number' ? size : size ? sizes[size] : base.size,
    leading: leading ?? base.leading,
  };
  const s = roleStyle(spec);

  const plain = textOf(children);
  const text = plain === null ? null : nfc(plain);
  const sinhala = text !== null && hasSinhala(text);
  const lineHeight = sinhala ? Math.max(s.lineHeight ?? 0, Math.round(spec.size * SINHALA_MIN_LEADING)) : s.lineHeight;
  const sinhalaFamily = sinhalaFamilyFor(spec.family, spec.weight);

  const runs = sinhala && text !== null ? splitScriptRuns(text) : null;
  const allSinhala = runs !== null && runs.every((r) => r.sinhala || r.text.trim() === '');

  const merged: StyleProp<TextStyle> = [
    s,
    {
      color: tint ?? t[color],
      lineHeight,
      textAlign: align,
      // letter spacing and caps don't apply to Sinhala
      ...(allSinhala ? { fontFamily: sinhalaFamily, letterSpacing: 0 } : null),
    },
    style,
  ];

  let content: ReactNode = text ?? children;
  if (runs && !allSinhala) {
    content = runs.map((r, i) =>
      r.sinhala ? (
        <Text key={i} style={{ fontFamily: sinhalaFamily, letterSpacing: 0 }}>
          {r.text}
        </Text>
      ) : (
        r.text
      ),
    );
  }

  return (
    <Text allowFontScaling={allowFontScaling} maxFontSizeMultiplier={MAX_FONT_SCALE} style={merged} {...rest}>
      {content}
    </Text>
  );
}

export { fontFamily };

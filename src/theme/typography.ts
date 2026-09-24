import type { TextStyle } from 'react-native';

import { leading, size, tracking } from './tokens';

/** Family keys from the plan (section 5.3). Each weight is its own registered font on Android. */
export type FamilyKey = 'display' | 'hand' | 'ui' | 'sinhala';
export type Weight = 300 | 400 | 600 | 700 | 900;

/** Registered font names, one per family + weight. Keys match the `@expo-google-fonts` export names. */
export const fontFiles = {
  display: { 400: 'PlayfairDisplay_400Regular', 700: 'PlayfairDisplay_700Bold', 900: 'PlayfairDisplay_900Black' },
  // The prototype sets most handwritten accents at weight 400 ("font:400 22px var(--font-hand)").
  hand: { 400: 'Caveat_400Regular', 700: 'Caveat_700Bold' },
  ui: {
    300: 'Nunito_300Light',
    400: 'Nunito_400Regular',
    600: 'Nunito_600SemiBold',
    700: 'Nunito_700Bold',
    900: 'Nunito_900Black',
  },
  sinhala: { 400: 'NotoSansSinhala_400Regular', 600: 'NotoSansSinhala_600SemiBold', 700: 'NotoSansSinhala_700Bold' },
} as const satisfies Record<FamilyKey, Partial<Record<Weight, string>>>;

const available: Record<FamilyKey, Weight[]> = {
  display: [400, 700, 900],
  hand: [400, 700],
  ui: [300, 400, 600, 700, 900],
  sinhala: [400, 600, 700],
};

/** Resolve a family + weight to a registered font name, snapping to the nearest loaded weight. */
export function fontFamily(family: FamilyKey, weight: Weight = 400): string {
  const weights = available[family];
  const nearest = weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best));
  return (fontFiles[family] as Record<number, string>)[nearest] as string;
}

/** Sinhala fallback for a Latin run's family + weight. Display and hand roles fall back to Noto Sans Sinhala Bold. */
export function sinhalaFamilyFor(family: FamilyKey, weight: Weight): string {
  if (family === 'display' || family === 'hand') return fontFiles.sinhala[700];
  return fontFamily('sinhala', weight);
}

export type TypeRole =
  'hero' | 'title' | 'section' | 'accent' | 'body' | 'bodyStrong' | 'label' | 'caption' | 'reader' | 'numeric';

export type RoleSpec = {
  family: FamilyKey;
  size: number;
  weight: Weight;
  leading: number;
  /** letter spacing in em */
  tracking?: number;
  uppercase?: boolean;
  tabular?: boolean;
};

export const roles: Record<TypeRole, RoleSpec> = {
  hero: { family: 'display', size: size['4xl'], weight: 700, leading: leading.tight, tracking: tracking.tight },
  title: { family: 'display', size: size['2xl'], weight: 700, leading: leading.snug },
  section: { family: 'display', size: size.lg, weight: 700, leading: leading.snug },
  accent: { family: 'hand', size: size['2xl'], weight: 700, leading: leading.snug },
  body: { family: 'ui', size: size.sm, weight: 400, leading: leading.relaxed },
  bodyStrong: { family: 'ui', size: size.sm, weight: 700, leading: leading.relaxed },
  label: {
    family: 'ui',
    size: size['2xs'],
    weight: 700,
    leading: leading.normal,
    tracking: tracking.caps,
    uppercase: true,
  },
  caption: { family: 'ui', size: size.xs, weight: 600, leading: leading.normal },
  reader: { family: 'display', size: size.md, weight: 400, leading: leading.reader },
  numeric: { family: 'display', size: size['2xl'], weight: 700, leading: leading.tight, tabular: true },
};

/** Minimum line height multiplier for any run containing Sinhala (vowel signs sit above and below the line). */
export const SINHALA_MIN_LEADING = 1.5;

export function roleStyle(spec: RoleSpec): TextStyle {
  return {
    fontFamily: fontFamily(spec.family, spec.weight),
    fontSize: spec.size,
    lineHeight: Math.round(spec.size * spec.leading),
    letterSpacing: spec.tracking ? spec.tracking * spec.size : undefined,
    textTransform: spec.uppercase ? 'uppercase' : undefined,
    fontVariant: spec.tabular ? ['tabular-nums'] : undefined,
  };
}

export const type = Object.fromEntries(
  (Object.keys(roles) as TypeRole[]).map((r) => [r, roleStyle(roles[r])]),
) as Record<TypeRole, TextStyle>;

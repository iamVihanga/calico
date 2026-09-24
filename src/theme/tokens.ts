// Ported 1:1 from the prototype's design-system tokens (design/unpacked/tokens.json). Do not change values.

export const palette = {
  cream: '#FBF6EE',
  crumpet: '#F5E2CE',
  biscuit: '#DFBC94',
  honeycomb: '#E5A657',
  marmalade: '#EC6426',
  paprika: '#B53324',
  clay: '#A35A45',
  cocoa: '#6E4738',
  espresso: '#54332E',
  ink: '#1C1714',
  forest: '#1F3A32',
  fern: '#2F5145',
  sage: '#949A6B',
  slate: '#666B6E',
  petal: '#F2C4C7',
  blush: '#FAE3E1',
  white: '#FFFDF9',
} as const;

export const alpha = {
  ink04: 'rgba(28,23,20,0.04)',
  ink08: 'rgba(28,23,20,0.08)',
  ink12: 'rgba(28,23,20,0.12)',
  ink24: 'rgba(28,23,20,0.24)',
  ink56: 'rgba(28,23,20,0.56)',
  cream16: 'rgba(251,246,238,0.16)',
  cream72: 'rgba(251,246,238,0.72)',
  black28: 'rgba(0,0,0,0.28)',
} as const;

export const space = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
  11: 64,
  12: 80,
} as const;

export const layout = {
  gutterScreen: 20,
  gapStackTight: 8,
  gapStack: 12,
  gapSection: 32,
  padCard: 16,
  padCardLg: 20,
  padControlY: 14,
  padControlX: 20,
  hitMin: 48 /* prototype says 44; Android needs 48 */,
  shelfGap: 14,
  bottomNavHeight: 72,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 36,
  pill: 999,
  // --radius-cover: 4px 12px 12px 4px (spine side tighter)
  cover: { topLeft: 4, topRight: 12, bottomRight: 12, bottomLeft: 4 },
} as const;

export const size = {
  '3xs': 11,
  '2xs': 12,
  xs: 13,
  sm: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
  '5xl': 64,
  '6xl': 84,
} as const;
export const leading = { tight: 1.04, snug: 1.16, normal: 1.45, relaxed: 1.6, reader: 1.72 } as const;
export const tracking = { tight: -0.02, normal: 0, wide: 0.04, caps: 0.12 } as const; // em; convert: em * fontSize

// RN (New Architecture) supports the CSS boxShadow string syntax on Android.
export const shadow = {
  none: 'none',
  xs: '0 1px 2px rgba(84,51,46,0.06)',
  sm: '0 2px 8px rgba(84,51,46,0.08)',
  md: '0 6px 18px rgba(84,51,46,0.10)',
  lg: '0 14px 34px rgba(84,51,46,0.14)',
  sheet: '0 -10px 40px rgba(84,51,46,0.16)',
  cover: '0 6px 14px rgba(84,51,46,0.22)',
  press: 'inset 0 1px 2px rgba(84,51,46,0.14)',
  focus: '0 0 0 3px rgba(236,100,38,0.32)',
} as const;

export const motion = {
  duration: { instant: 90, fast: 160, base: 240, slow: 420, page: 520 },
  easing: {
    // use with Easing.bezier(...) in Reanimated
    cozy: [0.32, 0.72, 0.28, 1],
    out: [0.16, 0.84, 0.34, 1],
    inOut: [0.62, 0.04, 0.34, 1],
    purr: [0.34, 1.42, 0.48, 1],
  },
  pressScale: 0.97,
  liftHover: -2,
} as const;

export type ShadowKey = keyof typeof shadow;
export type RadiusKey = Exclude<keyof typeof radius, 'cover'>;
export type SizeKey = keyof typeof size;

export const tokens = { palette, alpha, space, layout, radius, size, leading, tracking, shadow, motion } as const;
export type Tokens = typeof tokens;

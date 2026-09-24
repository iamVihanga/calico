import { palette } from '@/theme/tokens';

export type CoverPalette = { bg: string; ink: string; sub: string };

/** Named cover palettes from the design system's BookCover. */
export const coverPalettes = {
  marmalade: { bg: palette.marmalade, ink: '#2A1206', sub: 'rgba(42,18,6,0.66)' },
  forest: { bg: palette.forest, ink: palette.cream, sub: 'rgba(251,246,238,0.62)' },
  petal: { bg: palette.petal, ink: '#7E3C48', sub: 'rgba(126,60,72,0.68)' },
  ink: { bg: palette.ink, ink: palette.cream, sub: 'rgba(251,246,238,0.56)' },
  biscuit: { bg: palette.biscuit, ink: palette.espresso, sub: 'rgba(84,51,46,0.66)' },
  sage: { bg: palette.sage, ink: '#2C3018', sub: 'rgba(44,48,24,0.62)' },
  honeycomb: { bg: palette.honeycomb, ink: '#5A3708', sub: 'rgba(90,55,8,0.66)' },
  cream: { bg: palette.crumpet, ink: palette.espresso, sub: 'rgba(84,51,46,0.6)' },
} as const satisfies Record<string, CoverPalette>;

export type CoverName = keyof typeof coverPalettes;

/**
 * The prototype's `coverFor` rotation (app.js): six bg/ink pairs. The ink cover is swapped for
 * clay so dark covers don't vanish on night cards.
 */
const rotation: CoverPalette[] = [
  { bg: palette.marmalade, ink: '#2A1206', sub: 'rgba(42,18,6,0.66)' },
  { bg: palette.forest, ink: palette.cream, sub: 'rgba(251,246,238,0.62)' },
  { bg: palette.petal, ink: palette.espresso, sub: 'rgba(84,51,46,0.66)' },
  { bg: palette.clay, ink: palette.cream, sub: 'rgba(251,246,238,0.62)' },
  { bg: palette.biscuit, ink: palette.espresso, sub: 'rgba(84,51,46,0.66)' },
  { bg: palette.sage, ink: palette.ink, sub: 'rgba(28,23,20,0.62)' },
];

/** Same hash as the prototype: h = 7; h = (h * 31 + code) % 9973; pick h % 6. */
export function coverHash(seed: string): number {
  let h = 7;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
  return h;
}

export function coverFor(seed: string): CoverPalette {
  return rotation[coverHash(seed) % rotation.length] as CoverPalette;
}

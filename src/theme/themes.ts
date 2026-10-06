import { alpha, palette } from './tokens';

const dayValues = {
  surfacePage: palette.cream,
  surfacePageWarm: palette.crumpet,
  surfaceCard: palette.white,
  surfaceSunk: '#F3EADD',
  surfaceInverse: palette.forest,
  surfaceInverseRaised: palette.fern,
  surfaceInk: palette.ink,
  surfaceAccent: palette.marmalade,
  surfaceAccentSoft: '#FBE0CE',
  surfaceQuiet: '#EFE7DA',
  surfaceScrim: alpha.ink56,
  textPrimary: palette.ink,
  textSecondary: palette.cocoa,
  textMuted: '#8A7565',
  textInverse: palette.cream,
  textInverseMuted: '#C3CFC6',
  textAccent: palette.marmalade,
  textOnAccent: '#2A1206',
  borderHairline: alpha.ink08,
  borderSoft: '#E7DACA',
  borderStrong: palette.biscuit,
  borderInk: palette.ink,
  borderInverse: 'rgba(251,246,238,0.18)',
  accentPrimary: palette.marmalade,
  accentPrimaryPress: '#D2541B',
  accentSecondary: palette.honeycomb,
  accentTertiary: palette.forest,
  accentQuiet: palette.sage,
  accentPink: palette.petal,
  statusSuccess: '#4F7A5C',
  statusSuccessSoft: '#DCE8DC',
  statusWarning: palette.honeycomb,
  statusWarningSoft: '#FBEBD3',
  statusDanger: palette.paprika,
  statusDangerSoft: '#F7DDD7',
  statusInfo: palette.slate,
  statusInfoSoft: '#E6E7E5',
  cover: [palette.marmalade, palette.forest, palette.petal, palette.ink, palette.biscuit, palette.sage],
  desk1: '#EFE2D0',
  desk2: '#E0CFB8',
  inkOnWarm: palette.espresso,
  fleck: alpha.ink04,
  panel1: palette.fern,
  panel2: palette.forest,
  ctaBg: palette.ink,
  ctaFg: palette.cream,
  ctaAccent: palette.honeycomb,
  statusBarStyle: 'dark' as 'dark' | 'light',
};

/** Widen literal colour types so night can override them. */
type Widen<T> = {
  [K in keyof T]: K extends 'statusBarStyle'
    ? T[K]
    : T[K] extends string
      ? string
      : T[K] extends readonly string[]
        ? string[]
        : T[K];
};

export const day: Widen<typeof dayValues> = dayValues;

export const night: typeof day = {
  ...day,
  surfacePage: '#0F1A16',
  surfacePageWarm: '#17271F',
  surfaceCard: '#16251F',
  surfaceSunk: '#0A120F',
  surfaceQuiet: '#1C2F27',
  surfaceAccentSoft: '#24382E',
  textPrimary: '#EDF2EC',
  textSecondary: '#BFCFC5',
  textMuted: '#8DA298',
  textOnAccent: palette.ink,
  borderSoft: '#22352D',
  borderHairline: 'rgba(230,240,233,0.10)',
  borderStrong: '#34544A',
  accentQuiet: palette.sage,
  statusInfoSoft: '#1D2E29',
  statusWarningSoft: '#2C2A1C',
  statusSuccessSoft: '#17291D',
  statusDangerSoft: '#2E1D1A',
  desk1: '#1B2F28',
  desk2: '#0A120F',
  inkOnWarm: '#EDF2EC',
  fleck: 'rgba(230,240,233,0.05)',
  panel1: '#3A6153',
  panel2: '#244137',
  ctaBg: palette.cream,
  ctaFg: palette.espresso,
  ctaAccent: '#D2541B',
  statusBarStyle: 'light',
};

export type Theme = typeof day;
export type ThemeColor = { [K in keyof Theme]: Theme[K] extends string ? K : never }[keyof Theme];
export type ThemeName = 'day' | 'night';
export type ThemePreference = ThemeName | 'system';

/**
 * Tortoiseshell: warm cream paper and a softer clay orange by day, warm charcoal-brown by night (a calico's
 * orange, black and white). Same tokens as Forest; only the colours change.
 */
const tortoiseshellDay: Theme = {
  ...day,
  surfacePage: '#FAF9F5',
  surfacePageWarm: '#F4EFE6',
  surfaceCard: '#FFFFFF',
  surfaceSunk: '#F0EEE6',
  surfaceInverse: '#30302E',
  surfaceInverseRaised: '#3D3A36',
  surfaceInk: '#1F1E1D',
  surfaceAccent: '#D97757',
  surfaceAccentSoft: '#F6E3D9',
  surfaceQuiet: '#E8E6DC',
  surfaceScrim: 'rgba(20,20,19,0.56)',
  textPrimary: '#141413',
  textSecondary: '#3D3D3A',
  textMuted: '#73726C',
  textInverse: '#FAF9F5',
  textInverseMuted: '#C2C0B6',
  textAccent: '#C15F3C',
  textOnAccent: '#1F1E1D',
  borderHairline: 'rgba(20,20,19,0.08)',
  borderSoft: '#E8E6DC',
  borderStrong: '#D1CFC5',
  borderInk: '#141413',
  borderInverse: 'rgba(250,249,245,0.18)',
  accentPrimary: '#D97757',
  accentPrimaryPress: '#C6613F',
  accentSecondary: '#E0A458',
  accentTertiary: '#3D3A36',
  accentQuiet: '#A0937D',
  accentPink: palette.petal,
  statusSuccess: '#5B7F5E',
  statusSuccessSoft: '#E1E9DC',
  statusWarning: '#C98A3A',
  statusWarningSoft: '#F8EBD5',
  statusDanger: '#B5432E',
  statusDangerSoft: '#F6DDD5',
  statusInfo: '#6B6A65',
  statusInfoSoft: '#EAE8E1',
  cover: ['#D97757', '#3D3A36', palette.petal, '#1F1E1D', palette.biscuit, '#A0937D'],
  desk1: '#EFE9DE',
  desk2: '#E2D8C8',
  inkOnWarm: '#3D2A22',
  fleck: 'rgba(20,20,19,0.04)',
  panel1: '#3D3A36',
  panel2: '#30302E',
  ctaBg: '#141413',
  ctaFg: '#FAF9F5',
  ctaAccent: '#E0A458',
  statusBarStyle: 'dark',
};

const tortoiseshellNight: Theme = {
  ...tortoiseshellDay,
  surfacePage: '#262624',
  surfacePageWarm: '#2B2A27',
  surfaceCard: '#30302E',
  surfaceSunk: '#1F1E1D',
  surfaceInverse: '#3D3A36',
  surfaceInverseRaised: '#4A4742',
  surfaceInk: '#141413',
  surfaceQuiet: '#3A3936',
  surfaceAccentSoft: '#4A3328',
  textPrimary: '#FAF9F5',
  textSecondary: '#C2C0B6',
  textMuted: '#9C9A92',
  textAccent: '#E08A6A',
  borderHairline: 'rgba(222,220,209,0.12)',
  borderSoft: '#3A3936',
  borderStrong: '#4A4844',
  statusInfoSoft: '#33322F',
  statusWarningSoft: '#3A3122',
  statusSuccessSoft: '#2A3328',
  statusDangerSoft: '#3D2722',
  desk1: '#34322E',
  desk2: '#1F1E1D',
  inkOnWarm: '#FAF9F5',
  fleck: 'rgba(222,220,209,0.05)',
  panel1: '#4A4742',
  panel2: '#3A3936',
  ctaBg: '#FAF9F5',
  ctaFg: '#1F1E1D',
  ctaAccent: '#C6613F',
  statusBarStyle: 'light',
};

/** Colour families (Settings → Theme); each has a day and a night version (night reading). */
export type ThemePalette = 'forest' | 'tortoiseshell';
export const THEME_PALETTES: ThemePalette[] = ['forest', 'tortoiseshell'];
export const isThemePalette = (v: unknown): v is ThemePalette => v === 'forest' || v === 'tortoiseshell';

export const themes: Record<ThemePalette, Record<ThemeName, Theme>> = {
  forest: { day, night },
  tortoiseshell: { day: tortoiseshellDay, night: tortoiseshellNight },
};

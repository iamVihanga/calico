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
  /** Bottom of the welcome panel gradient (prototype #12211C). */
  welcomeEnd: '#12211C',
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

export const themes: Record<ThemeName, Theme> = { day, night };

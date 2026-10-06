import { day, night, THEME_PALETTES, themes } from '../themes';
import { fontFamily, roles, roleStyle, sinhalaFamilyFor } from '../typography';

describe('themes', () => {
  it('night overrides every key it needs and keeps the same shape', () => {
    expect(Object.keys(night).sort()).toEqual(Object.keys(day).sort());
    expect(night.surfacePage).toBe('#0F1A16');
    expect(night.statusBarStyle).toBe('light');
    expect(night.ctaBg).toBe(day.ctaFg);
  });
});

/** WCAG contrast ratio of two opaque #RRGGBB colours. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, b2] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b2!);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('colour families (Settings → Theme)', () => {
  it('Forest is the original day/night, unchanged', () => {
    expect(themes.forest).toEqual({ day, night });
  });

  it.each(THEME_PALETTES.flatMap((p) => (['day', 'night'] as const).map((m) => [p, m] as const)))(
    '%s %s has every token and readable text',
    (p, m) => {
      const t = themes[p][m];
      expect(Object.keys(t).sort()).toEqual(Object.keys(day).sort());
      expect(t.statusBarStyle).toBe(m === 'day' ? 'dark' : 'light');
      for (const surface of [t.surfacePage, t.surfaceCard]) {
        expect(contrast(t.textPrimary, surface)).toBeGreaterThanOrEqual(7);
        expect(contrast(t.textSecondary, surface)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t.textMuted, surface)).toBeGreaterThanOrEqual(3);
      }
      expect(contrast(t.textOnAccent, t.accentPrimary)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.textInverse, t.surfaceInverse)).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe('typography', () => {
  it('snaps weights to loaded fonts', () => {
    expect(fontFamily('ui', 700)).toBe('Nunito_700Bold');
    expect(fontFamily('display', 600)).toBe('PlayfairDisplay_700Bold');
    expect(fontFamily('hand', 400)).toBe('Caveat_400Regular');
  });

  it('display and hand fall back to Noto Sans Sinhala Bold', () => {
    expect(sinhalaFamilyFor('display', 400)).toBe('NotoSansSinhala_700Bold');
    expect(sinhalaFamilyFor('hand', 700)).toBe('NotoSansSinhala_700Bold');
    expect(sinhalaFamilyFor('ui', 600)).toBe('NotoSansSinhala_600SemiBold');
  });

  it('label role is uppercase with caps tracking (0.12em)', () => {
    const s = roleStyle(roles.label);
    expect(s.textTransform).toBe('uppercase');
    expect(s.letterSpacing).toBeCloseTo(1.44);
    expect(s.fontSize).toBe(12);
  });
});

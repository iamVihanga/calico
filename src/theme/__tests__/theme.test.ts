import { day, night } from '../themes';
import { fontFamily, roles, roleStyle, sinhalaFamilyFor } from '../typography';

describe('themes', () => {
  it('night overrides every key it needs and keeps the same shape', () => {
    expect(Object.keys(night).sort()).toEqual(Object.keys(day).sort());
    expect(night.surfacePage).toBe('#0F1A16');
    expect(night.statusBarStyle).toBe('light');
    expect(night.ctaBg).toBe(day.ctaFg);
  });
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

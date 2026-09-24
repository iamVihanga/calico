import { leadTitle } from '../BilingualTitle';
import { coverFor, coverHash } from '../coverPalette';
import { stampLabel, stampRotation } from '../DateStamp';
import { starString } from '../TicketStub';
import { palette } from '@/theme/tokens';
import { en } from '@/i18n/en';

// Reference implementation copied from the prototype (design/unpacked/app.js `coverFor`).
function prototypeIndex(id: string) {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return h % 6;
}

describe('coverFor', () => {
  it('matches the prototype hash for the sample ids', () => {
    for (const id of ['madol', 'gamperaliya', 'it', 'fireblood', 'maali', 'shining', 'hathpana', 'it2017', 'got']) {
      expect(coverHash(id) % 6).toBe(prototypeIndex(id));
    }
  });

  it('uses clay instead of ink in the rotation', () => {
    const bgs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'].map((s) => coverFor(s).bg);
    expect(bgs).not.toContain(palette.ink);
  });
});

describe('DateStamp helpers', () => {
  it('formats the stamp label like the prototype', () => {
    expect(stampLabel('2026-09-26')).toBe('26 SEP');
    expect(stampLabel('2026-10-03')).toBe('03 OCT');
  });

  it('gives a stable rotation between -4 and 4', () => {
    for (const d of ['2026-09-07', '2026-09-21', '2026-09-26', '2027-01-01']) {
      const r = stampRotation(d);
      expect(r).toBeGreaterThanOrEqual(-4);
      expect(r).toBeLessThanOrEqual(4);
      expect(stampRotation(d)).toBe(r);
    }
  });
});

describe('leadTitle', () => {
  it('leads with Sinhala when chosen and available', () => {
    expect(leadTitle('Madol Doova', 'මඩොල් දූව', 'si')).toEqual({ main: 'මඩොල් දූව', sub: 'Madol Doova' });
    expect(leadTitle('Madol Doova', 'මඩොල් දූව', 'en')).toEqual({ main: 'Madol Doova', sub: 'මඩොල් දූව' });
  });

  it('falls back when a script is missing', () => {
    expect(leadTitle('IT', null, 'si')).toEqual({ main: 'IT', sub: '' });
    expect(leadTitle('', 'හත් පණ', 'en')).toEqual({ main: 'හත් පණ', sub: '' });
  });
});

describe('copy', () => {
  it('dueLine matches the prototype wording', () => {
    expect(en.loan.dueLine(3)).toBe('Due in 3 days');
    expect(en.loan.dueLine(1)).toBe('Due tomorrow');
    expect(en.loan.dueLine(0)).toBe('Due today');
    expect(en.loan.dueLine(-1)).toBe('Overdue by 1 day');
    expect(en.loan.dueLine(-2)).toBe('Overdue by 2 days');
  });

  it('starString renders half stars', () => {
    expect(starString(4)).toBe('★★★★');
    expect(starString(3.5)).toBe('★★★½');
    expect(starString(null)).toBe('');
  });
});

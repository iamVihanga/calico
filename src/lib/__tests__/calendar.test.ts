import { addMonths, dateOf, inRange, monthBefore, monthGrid, monthOf } from '../calendar';

describe('calendar', () => {
  it('lays a month out Monday first, in whole weeks', () => {
    const oct = monthGrid({ year: 2026, month: 10 }); // 1 Oct 2026 is a Thursday
    expect(oct[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(oct.at(-1)).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      null,
    ]);
    expect(oct.every((w) => w.length === 7)).toBe(true);
  });

  it('knows leap Februaries and a month that starts on Monday', () => {
    const feb = monthGrid({ year: 2028, month: 2 }).flat().filter(Boolean);
    expect(feb.at(-1)).toBe('2028-02-29');
    expect(monthGrid({ year: 2026, month: 6 })[0]![0]).toBe('2026-06-01');
  });

  it('steps months across years and checks ranges', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(monthOf('2026-10-04')).toEqual({ year: 2026, month: 10 });
    expect(dateOf(2026, 3, 9)).toBe('2026-03-09');
    expect(monthBefore({ year: 2025, month: 12 }, { year: 2026, month: 1 })).toBe(true);
    expect(inRange('2026-10-04', '2026-10-01', '2026-10-31')).toBe(true);
    expect(inRange('2026-11-01', undefined, '2026-10-31')).toBe(false);
  });
});

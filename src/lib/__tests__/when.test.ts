import { clampWhen, finishedText, partialLabel, whenVars } from '../when';

const today = '2026-10-03';

describe('whenVars', () => {
  it('just now is today, counted normally', () => {
    expect(whenVars({ now: true }, today)).toEqual({ on: today, backfill: false, precision: 'day' });
  });
  it('a while ago with no date counts nowhere', () => {
    expect(whenVars({ now: false }, today)).toEqual({ on: today, backfill: true, precision: null });
  });
  it('a year, a month or a day, on the 1st when that is all that is known', () => {
    expect(whenVars({ now: false, year: 2024 }, today)).toEqual({
      on: '2024-01-01',
      backfill: true,
      precision: 'year',
    });
    expect(whenVars({ now: false, year: 2024, month: 3 }, today)).toEqual({
      on: '2024-03-01',
      backfill: true,
      precision: 'month',
    });
    expect(whenVars({ now: false, year: 2024, month: 3, day: 9 }, today)).toEqual({
      on: '2024-03-09',
      backfill: true,
      precision: 'day',
    });
  });
});

describe('clampWhen', () => {
  it('drops future months and days, and days past the end of the month', () => {
    expect(clampWhen({ now: false, year: 2026, month: 11 }, today)).toEqual({ now: false, year: 2026 });
    expect(clampWhen({ now: false, year: 2026, month: 10, day: 9 }, today)).toEqual({
      now: false,
      year: 2026,
      month: 10,
    });
    expect(clampWhen({ now: false, year: 2023, month: 2, day: 30 }, today)).toEqual({
      now: false,
      year: 2023,
      month: 2,
    });
    expect(clampWhen({ now: false, year: 2024, month: 2, day: 29 }, today)).toEqual({
      now: false,
      year: 2024,
      month: 2,
      day: 29,
    });
  });
});

describe('partialLabel', () => {
  it('says what is known', () => {
    expect(partialLabel('2026-10-03', null, 'A while ago')).toBe('A while ago');
    expect(partialLabel('2024-01-01', 'year', 'x')).toBe('2024');
    expect(partialLabel('2024-03-01', 'month', 'x')).toBe('Mar 2024');
    expect(partialLabel('2024-03-09', 'day', 'x')).toBeNull();
  });
});

describe('finishedText', () => {
  it('as precisely as it is known', () => {
    expect(finishedText('2024-03-09', 'day')).toBe('9 Mar 2024');
    expect(finishedText('2024-03-01', 'month')).toBe('March 2024');
    expect(finishedText('2024-01-01', 'year')).toBe('2024');
    expect(finishedText('2026-10-04', null)).toBeNull();
    expect(finishedText('2024-03-09', undefined)).toBe('9 Mar 2024'); // cached before it was stored
  });
});

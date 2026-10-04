import { addLocalDays, type LocalDate } from './dates';

const pad = (n: number) => String(n).padStart(2, '0');

export type Month = { year: number; month: number }; // month 1–12

export const monthOf = (d: LocalDate): Month => ({ year: Number(d.slice(0, 4)), month: Number(d.slice(5, 7)) });

export const dateOf = (year: number, month: number, day: number): LocalDate => `${year}-${pad(month)}-${pad(day)}`;

export function addMonths(m: Month, n: number): Month {
  const i = m.year * 12 + (m.month - 1) + n;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

export const sameMonth = (a: Month, b: Month) => a.year === b.year && a.month === b.month;

/** Earlier month first (for disabling ‹ › at the range ends). */
export const monthBefore = (a: Month, b: Month) => a.year * 12 + a.month < b.year * 12 + b.month;

export const inRange = (d: LocalDate, min?: LocalDate, max?: LocalDate) => (!min || d >= min) && (!max || d <= max);

/**
 * A month as weeks of 7 cells (Monday first); days outside the month are null. Always whole weeks
 * (4–6 rows), so the grid only changes height when the month needs another row.
 */
export function monthGrid({ year, month }: Month): (LocalDate | null)[][] {
  const first = dateOf(year, month, 1);
  const days = new Date(year, month, 0).getDate();
  const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday = 0
  const cells: (LocalDate | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => addLocalDays(first, i)),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

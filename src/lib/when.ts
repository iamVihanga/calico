import { format } from 'date-fns';

import { type LocalDate, parseLocal } from './dates';

/** How well a "when" is known: a day, a month, a year, or not at all (null). */
export type Precision = 'day' | 'month' | 'year';

/**
 * "Just now", or "A while ago" with an optional year, year + month, or full date. Each part needs the
 * one before it (a month without a year is not a date).
 */
export type When = { now: true } | { now: false; year?: number; month?: number; day?: number };

export const JUST_NOW: When = { now: true };

/** What the RPCs take: the date (1st of the year/month when only those are known) and its precision. */
export type WhenVars = { on: LocalDate; backfill: boolean; precision: Precision | null };

const pad = (n: number) => String(n).padStart(2, '0');

export function whenVars(w: When, today: LocalDate): WhenVars {
  if (w.now) return { on: today, backfill: false, precision: 'day' };
  if (!w.year) return { on: today, backfill: true, precision: null };
  if (!w.month) return { on: `${w.year}-01-01`, backfill: true, precision: 'year' };
  if (!w.day) return { on: `${w.year}-${pad(w.month)}-01`, backfill: true, precision: 'month' };
  return { on: `${w.year}-${pad(w.month)}-${pad(w.day)}`, backfill: true, precision: 'day' };
}

export const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

/**
 * Keep a partial date valid against today: no future year, month or day, and no 31 February.
 * Later parts are dropped when an earlier one changes them out of range.
 */
export function clampWhen(w: When, today: LocalDate): When {
  if (w.now || !w.year) return w;
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number];
  if (w.year > ty) return { now: false };
  if (!w.month) return { now: false, year: w.year };
  if (w.year === ty && w.month > tm) return { now: false, year: w.year };
  if (!w.day) return { now: false, year: w.year, month: w.month };
  const max = w.year === ty && w.month === tm ? td : daysInMonth(w.year, w.month);
  return w.day > max ? { now: false, year: w.year, month: w.month } : w;
}

/** "A while ago" / "2024" / "Mar 2024" / null (a real day: the caller formats it as usual). */
export function partialLabel(on: LocalDate, precision: Precision | null | undefined, unknown: string): string | null {
  if (precision === null) return unknown;
  if (precision === 'year') return on.slice(0, 4);
  if (precision === 'month') return format(parseLocal(on), 'MMM yyyy');
  return null;
}

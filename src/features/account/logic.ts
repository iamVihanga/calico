import type { LocalDate } from '@/lib/dates';

/** `calico-export-2026-09-26.json` */
export const exportFileName = (today: LocalDate, ext: 'json' | 'csv', what = 'export') =>
  `calico-${what}-${today}.${ext}`;

const BOOK_COLUMNS = [
  'title',
  'title_native',
  'author',
  'author_native',
  'status',
  'language',
  'format',
  'ownership',
  'total_pages',
  'current_page',
  'rating',
  'started_at',
  'finished_at',
  'isbn',
  'publisher',
  'published_year',
  'note',
] as const;

/** RFC 4180 field: quoted when it has a comma, quote or line break; quotes doubled. */
export function csvField(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = Array.isArray(v) ? v.join('; ') : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

type Row = Record<string, unknown>;

/** Books flattened to one CSV row each (items + books joined), in the order they were added. */
export function booksCsv(data: Record<string, unknown[]>): string {
  const books = new Map(((data.books as Row[] | undefined) ?? []).map((b) => [b.item_id, b]));
  const rows = ((data.items as Row[] | undefined) ?? [])
    .filter((i) => i.kind === 'book')
    .map((i) => ({ ...(books.get(i.id) ?? {}), ...i }));
  const lines = [BOOK_COLUMNS.join(','), ...rows.map((r) => BOOK_COLUMNS.map((c) => csvField(r[c])).join(','))];
  // A byte-order mark so spreadsheet apps read Sinhala as UTF-8.
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** "This removes your 7 books, 2 movies, 3 shows, all loans, collections and notes." */
export function deletionCounts(items: { kind: string }[]) {
  const c = { book: 0, movie: 0, show: 0 };
  for (const i of items) if (i.kind in c) c[i.kind as keyof typeof c] += 1;
  return c;
}

/** Share of the year's reading goal, 0–100 (whole percent). */
export const goalPct = (finished: number, goal: number | null) =>
  goal && goal > 0 ? Math.min(100, Math.round((finished / goal) * 100)) : null;

/** Language split bar segments, largest first, with their share of the total. */
export function languageSegments(split: Record<string, number>) {
  const total = Object.values(split).reduce((a, b) => a + b, 0);
  return Object.entries(split)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([language, n]) => ({ language, n, share: total ? n / total : 0 }));
}

/** `09:00:00` → "9:00 AM" (profiles.reminder_time is a Postgres `time`). */
export function fmtTime(time: string): string {
  const [h = 9, m = 0] = time.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** 24-hour hour + minute → `HH:MM:00`. */
export const toTime = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

export function parseTime(time: string): { h: number; m: number } {
  const [h = 9, m = 0] = time.split(':').map(Number);
  return { h, m };
}

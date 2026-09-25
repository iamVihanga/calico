import { differenceInCalendarDays, subDays } from 'date-fns';

import { copy } from '@/i18n/en';
import { addLocalDays, daysBetween, localDateOf, toColombo, type LocalDate } from '@/lib/dates';
import { stampLabel } from '@/components/calico/DateStamp';

import type { Book, BookStatus, LeadScript } from './types';

type Log = { page: number; loggedAt: Date };

/**
 * Pages per day over the last `windowDays` (plan §11.3). Needs 3 logs; the baseline is the latest
 * log before the window (or the first one inside it). Returns null when there's no forward progress.
 */
export function computePace(logs: Log[], now: Date, windowDays = 14): number | null {
  if (logs.length < 3) return null; // UI: "Log a few sessions to see your pace."
  const sorted = [...logs].sort((a, b) => +a.loggedAt - +b.loggedAt);
  const windowStart = subDays(now, windowDays);
  const baseline =
    sorted.filter((l) => l.loggedAt < windowStart).at(-1) ?? sorted.find((l) => l.loggedAt >= windowStart)!;
  const latest = sorted.at(-1)!;
  const pages = latest.page - baseline.page;
  const days = Math.max(1, differenceInCalendarDays(toColombo(now), toColombo(baseline.loggedAt)));
  return pages > 0 ? pages / days : null;
}

export function estimateFinish(
  current: number,
  total: number,
  pace: number | null,
  today: LocalDate,
): LocalDate | null {
  if (!pace || current >= total) return null;
  return addLocalDays(today, Math.ceil((total - current) / pace));
}

/** Pages gained on each of the last `days` Colombo days, oldest first (PaceSparkline). */
export function dailyPages(logs: Log[], now: Date, days = 14): number[] {
  const sorted = [...logs].sort((a, b) => +a.loggedAt - +b.loggedAt);
  const today = localDateOf(now);
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addLocalDays(today, -i);
    const before = sorted.filter((l) => localDateOf(l.loggedAt) < day).at(-1)?.page;
    const endOfDay = sorted.filter((l) => localDateOf(l.loggedAt) <= day).at(-1)?.page;
    out.push(before === undefined || endOfDay === undefined ? 0 : Math.max(0, endOfDay - before));
  }
  return out;
}

export function progressPct(current: number, total: number | null): number {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((current / total) * 100)));
}

export const BOOK_STATUSES: BookStatus[] = ['reading', 'to_read', 'wishlist', 'read', 'abandoned'];
/** Status rail stops (Abandoned is the branch). */
export const RAIL_STOPS: BookStatus[] = ['wishlist', 'to_read', 'reading', 'read'];

export const statusLabel = (s: BookStatus) => copy.books.status[s];

/** Swipe-right action on a list row (prototype: To read → Reading, everything else → Read). */
export function nextLogicalStatus(s: BookStatus): BookStatus {
  if (s === 'wishlist' || s === 'to_read' || s === 'abandoned') return 'reading';
  return 'read';
}

/** Which title leads and which sits underneath (prototype `lead()`). */
export function leadTitle(b: Pick<Book, 'title' | 'titleNative'>, lead: LeadScript) {
  const si = b.titleNative ?? '';
  const en = b.title || si;
  if (lead === 'si' && si) return { main: si, sub: en !== si ? en : '' };
  return { main: en, sub: si && si !== en ? si : '' };
}

export function leadAuthor(b: Pick<Book, 'author' | 'authorNative'>, lead: LeadScript) {
  if (lead === 'si' && b.authorNative) return b.authorNative;
  return b.author || b.authorNative || '';
}

/** Small line under a grid tile (prototype libV `tag`). */
export function libraryTag(b: Book, today: LocalDate): { text: string; tone: 'danger' | 'accent' | 'muted' } {
  if (b.loan?.dueOn) {
    return daysBetween(today, b.loan.dueOn) < 0
      ? { text: copy.loan.overdue, tone: 'danger' }
      : { text: `${copy.loan.due} ${stampLabel(b.loan.dueOn)}`, tone: 'muted' };
  }
  if (b.status === 'read') return { text: '★'.repeat(Math.round(b.rating ?? 0)), tone: 'muted' };
  if (b.status === 'reading') return { text: `${b.currentPage}/${b.totalPages ?? '?'}`, tone: 'accent' };
  return { text: statusLabel(b.status), tone: 'muted' };
}

export type SortKey = 'updated' | 'title' | 'rating' | 'added';

export function sortBooks(books: Book[], sort: SortKey, lead: LeadScript): Book[] {
  const list = [...books];
  switch (sort) {
    case 'title': {
      // Plain code-point comparison of the leading title keeps both scripts stable.
      const key = (b: Book) => leadTitle(b, lead).main.toLowerCase();
      return list.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
    }
    case 'rating':
      return list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    case 'added':
      return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    default:
      return list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }
}

export function statusCounts(books: Book[]): Record<BookStatus, number> {
  const counts = { wishlist: 0, to_read: 0, reading: 0, read: 0, abandoned: 0 } as Record<BookStatus, number>;
  for (const b of books) counts[b.status] += 1;
  return counts;
}

/** Shelf view: wider spine for longer books (100 → 1200 pages maps to 18 → 44dp). */
export function spineWidth(pages: number | null): number {
  const p = Math.max(100, Math.min(1200, pages ?? 300));
  return Math.round(18 + ((p - 100) / 1100) * 26);
}

/** Stable spine height 150–190dp seeded by the id. */
export function spineHeight(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) % 1009;
  return 150 + (h % 41);
}

/** Validate a page for the ruler / numeric entry. */
export function clampPage(page: number, total: number | null): number {
  const max = total ?? Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.min(max, Math.round(page)));
}

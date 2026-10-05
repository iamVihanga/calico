import { storage, storageKeys } from '@/lib/storage';

import { GROUP_BYS, type GroupBy } from './logic';
import { DEFAULT_DIR, LIBRARY_SORTS, type LibrarySort, type SortDir } from './sort';

export type Segment = 'books' | 'movies' | 'shows';
export type LibraryView = 'grid' | 'list' | 'shelf';
export type SegmentPrefs = { filter: string; sort: LibrarySort; dir: SortDir; group: GroupBy; view: LibraryView };
export type LibraryPrefs = { segment: Segment } & Record<Segment, SegmentPrefs>;

const SEGMENTS: readonly Segment[] = ['books', 'movies', 'shows'];
const VIEWS: readonly LibraryView[] = ['grid', 'list', 'shelf'];
const BASE: SegmentPrefs = { filter: 'all', sort: 'updated', dir: DEFAULT_DIR.updated, group: 'none', view: 'grid' };
export const DEFAULT_PREFS: LibraryPrefs = { segment: 'books', books: BASE, movies: BASE, shows: BASE };

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

/**
 * The Library's last segment, and each segment's filter, sort (and its direction), grouping and view. Anything unknown
 * (an old value, a renamed option) falls back to the default, so stored prefs can't break the screen.
 * `filters` are the valid filters per segment.
 */
export function readLibraryPrefs(filters: Record<Segment, readonly string[]>): LibraryPrefs {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(storage.getString(storageKeys.libraryPrefs) ?? '{}') as Record<string, unknown>;
  } catch {
    // corrupt: defaults
  }
  const seg = (s: Segment): SegmentPrefs => {
    const r = (raw[s] ?? {}) as Record<string, unknown>;
    const sort = pick(r.sort, LIBRARY_SORTS, BASE.sort);
    return {
      filter: pick(r.filter, ['all', ...filters[s]], 'all'),
      sort,
      dir: pick(r.dir, ['asc', 'desc'] as const, DEFAULT_DIR[sort]),
      group: pick(r.group, GROUP_BYS, BASE.group),
      view: pick(r.view, VIEWS, BASE.view),
    };
  };
  return {
    segment: pick(raw.segment, SEGMENTS, 'books'),
    books: seg('books'),
    movies: seg('movies'),
    shows: seg('shows'),
  };
}

export function saveLibraryPrefs(p: LibraryPrefs) {
  storage.set(storageKeys.libraryPrefs, JSON.stringify(p));
}

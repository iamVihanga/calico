import type { Precision } from '@/lib/when';

export type LibrarySort = 'updated' | 'title' | 'rating' | 'added' | 'finished';
export type SortDir = 'asc' | 'desc';
export const LIBRARY_SORTS: readonly LibrarySort[] = ['updated', 'title', 'rating', 'added', 'finished'];

/** What a fresh pick of each sort uses: newest / highest first, titles A→Z. */
export const DEFAULT_DIR: Record<LibrarySort, SortDir> = {
  updated: 'desc',
  title: 'asc',
  rating: 'desc',
  added: 'desc',
  finished: 'desc',
};

export type Sortable = {
  title: string;
  rating: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  finishedPrecision?: Precision | null;
};

type Options<T> = {
  /** The title to sort by (books: the lead-script title). */
  titleOf?: (item: T) => string;
  /** How titles compare (books: plain code points, stable for both scripts). */
  compareTitle?: (a: string, b: string) => number;
};

const FINISHED = new Set(['read', 'watched']);
/** On the same day, the more precise date counts as later (a year-only date sits at the start). */
const PRECISION_RANK = { year: 0, month: 1, day: 2 } as const;
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * The Library's sort, in either direction. Items without a value for the sort (unrated for Rating; for
 * Date finished, finished "a while ago" with no date, then not finished) always come last, keeping their
 * order. Ties keep the list's previous order.
 */
export function sortItems<T extends Sortable>(items: T[], key: LibrarySort, dir: SortDir, opts: Options<T> = {}): T[] {
  const titleOf = opts.titleOf ?? ((i: T) => i.title.toLowerCase());
  const compareTitle = opts.compareTitle ?? ((a: string, b: string) => a.localeCompare(b));
  const sign = dir === 'asc' ? 1 : -1;
  const indexed = items.map((item, i) => ({ item, i }));

  // Tier 0 sorts; higher tiers (missing values) follow in their original order.
  const tier = (it: T): number => {
    if (key === 'rating') return it.rating === null ? 1 : 0;
    if (key !== 'finished') return 0;
    if (!FINISHED.has(it.status) || !it.finishedAt) return 2;
    return it.finishedPrecision === null ? 1 : 0;
  };
  const compare = (a: T, b: T): number => {
    switch (key) {
      case 'title':
        return compareTitle(titleOf(a), titleOf(b));
      case 'rating':
        return (a.rating ?? 0) - (b.rating ?? 0);
      case 'added':
        return cmp(a.createdAt, b.createdAt);
      case 'finished':
        return (
          cmp(a.finishedAt!, b.finishedAt!) ||
          PRECISION_RANK[a.finishedPrecision ?? 'day'] - PRECISION_RANK[b.finishedPrecision ?? 'day']
        );
      default:
        return cmp(a.updatedAt, b.updatedAt);
    }
  };

  return indexed
    .sort((x, y) => {
      const tx = tier(x.item);
      const ty = tier(y.item);
      if (tx !== ty) return tx - ty;
      return (tx === 0 ? sign * compare(x.item, y.item) : 0) || x.i - y.i;
    })
    .map((x) => x.item);
}

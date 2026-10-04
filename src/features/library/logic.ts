import { copy } from '@/i18n/en';
import { localDateOf } from '@/lib/dates';
import type { Precision } from '@/lib/when';

export type GroupBy = 'none' | 'finished' | 'added';
export const GROUP_BYS: readonly GroupBy[] = ['none', 'finished', 'added'];

type Groupable = {
  status: string;
  finishedAt: string | null;
  finishedPrecision?: Precision | null;
  createdAt: string;
};
export type Group<T> = { key: string; title: string; items: T[] };

const FINISHED = new Set(['read', 'watched']);

/**
 * Library sections, keeping the list's order inside each.
 * - `finished`: by the year it was read or watched (newest first). "A while ago" for finished items
 *   with no date known. "Not finished yet" last.
 * - `added`: by the year it was added (Colombo), newest first.
 */
export function groupItems<T extends Groupable>(items: T[], by: GroupBy): Group<T>[] {
  if (by === 'none') return [{ key: 'all', title: '', items }];
  const groups = new Map<string, T[]>();
  const add = (key: string, item: T) => (groups.get(key) ?? groups.set(key, []).get(key)!).push(item);
  for (const item of items) {
    if (by === 'added') add(localDateOf(new Date(item.createdAt)).slice(0, 4), item);
    else if (!FINISHED.has(item.status) || !item.finishedAt) add('unfinished', item);
    else if (item.finishedPrecision === null) add('while', item);
    else add(item.finishedAt.slice(0, 4), item);
  }
  const rank = (k: string) => (k === 'unfinished' ? 2 : k === 'while' ? 1 : 0);
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || b.localeCompare(a))
    .map(([key, list]) => ({
      key,
      title: key === 'while' ? copy.library.groups.while : key === 'unfinished' ? copy.library.groups.unfinished : key,
      items: list,
    }));
}

/** Rows for a grouped list: a header per group, then its items `perRow` at a time (3 for the grid). */
export type GroupRow<T> =
  { type: 'header'; key: string; title: string; count: number } | { type: 'items'; key: string; items: T[] };

export function groupRows<T extends { id: string }>(groups: Group<T>[], perRow: number): GroupRow<T>[] {
  return groups.flatMap((g) => [
    { type: 'header' as const, key: `h-${g.key}`, title: g.title, count: g.items.length },
    ...Array.from({ length: Math.ceil(g.items.length / perRow) }, (_, i) => ({
      type: 'items' as const,
      key: `${g.key}-${i}-${g.items[i * perRow]!.id}`,
      items: g.items.slice(i * perRow, i * perRow + perRow),
    })),
  ]);
}

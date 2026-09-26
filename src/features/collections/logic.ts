import type { LibItem } from '@/features/library/items';

export type KindCounts = { book: number; movie: number; show: number };

export function kindCounts(items: Pick<LibItem, 'kind'>[]): KindCounts {
  const c = { book: 0, movie: 0, show: 0 };
  for (const i of items) c[i.kind] += 1;
  return c;
}

export type SeriesPart = { tmdbId: number; title: string; year: number | null };

/**
 * "More in this series" (plan §11.9): for movies in the collection that belong to a TMDB collection,
 * the other parts that aren't in the library yet, once each, in release order.
 */
export function seriesSuggestions(
  members: Pick<LibItem, 'kind' | 'tmdbCollection'>[],
  partsByCollection: Map<number, SeriesPart[]>,
  libraryTmdbIds: Set<number>,
): SeriesPart[] {
  const seen = new Set<number>();
  const out: SeriesPart[] = [];
  for (const m of members) {
    if (m.kind !== 'movie' || !m.tmdbCollection) continue;
    for (const p of partsByCollection.get(m.tmdbCollection.id) ?? []) {
      if (libraryTmdbIds.has(p.tmdbId) || seen.has(p.tmdbId)) continue;
      seen.add(p.tmdbId);
      out.push(p);
    }
  }
  return out.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
}

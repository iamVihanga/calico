export type MediaKind = 'book' | 'movie' | 'show';

/** Query keys (plan §9.4). */
export const qk = {
  profile: ['profile'] as const,
  items: (kind: MediaKind, filter: string) => ['items', kind, filter] as const,
  item: (id: string) => ['item', id] as const, // item + detail row + loan + sessions
  pageLogs: (id: string) => ['pageLogs', id] as const,
  openLoans: ['loans', 'open'] as const,
  showProgress: (id?: string) => ['showProgress', id ?? 'all'] as const,
  episodes: (tmdbId: number) => ['episodes', tmdbId] as const,
  watchLogs: (id: string) => ['watchLogs', id] as const,
  upNext: ['upNext'] as const,
  collections: ['collections'] as const,
  collection: (id: string) => ['collection', id] as const,
  search: (q: string) => ['search', q] as const,
  tmdbSearch: (type: string, q: string) => ['tmdbSearch', type, q] as const,
  stats: (year: number) => ['stats', year] as const,
  homeStats: ['homeStats'] as const,
  signedUrl: (path: string) => ['signedUrl', path] as const,
  shelfSummary: ['shelfSummary'] as const,
};

import { useMemo } from 'react';

import { useBooks, useLeadScript } from '@/features/books/hooks';
import { leadAuthor, leadTitle, progressPct, statusLabel } from '@/features/books/logic';
import type { Loan } from '@/features/books/types';
import { useMovies, useShowProgress, useShows } from '@/features/media/hooks';
import { epCode, fmtRuntime } from '@/features/media/logic';
import { copy } from '@/i18n/en';

export type LibKind = 'book' | 'movie' | 'show';

/**
 * One thing in the library, whatever it is: what Up next, collections, search and Pick for me need
 * (title in the lead script, cover source, a short meta line and the numbers behind pick reasons).
 */
export type LibItem = {
  id: string;
  kind: LibKind;
  title: string;
  sub: string;
  status: string;
  statusLabel: string;
  cover: { coverPath: string | null; coverUrl: string | null; posterPath: string | null };
  /** "214 pages", "2h 15m", "S2 E5" (prototype queueMeta). */
  meta: string;
  year: number | null;
  pagesLeft: number | null;
  runtimeMin: number | null;
  episodesLeft: number | null;
  progressPct: number | null;
  loan: Loan | null;
  tmdbId: number | null;
  tmdbCollection: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export function useLibraryItems() {
  const lead = useLeadScript();
  const books = useBooks();
  const movies = useMovies();
  const shows = useShows();
  const progress = useShowProgress().data;

  const items = useMemo(() => {
    const byShow = new Map((progress ?? []).map((p) => [p.itemId, p]));
    const out: LibItem[] = [];
    for (const b of books.data ?? []) {
      const t = leadTitle(b, lead);
      out.push({
        id: b.id,
        kind: 'book',
        title: t.main,
        sub: [t.sub, leadAuthor(b, lead)].filter(Boolean).join(' · '),
        status: b.status,
        statusLabel: statusLabel(b.status),
        cover: { coverPath: b.coverPath, coverUrl: b.coverUrl, posterPath: null },
        meta: b.totalPages ? copy.books.pages(b.totalPages) : '',
        year: null,
        pagesLeft: b.totalPages ? Math.max(0, b.totalPages - b.currentPage) : null,
        runtimeMin: null,
        episodesLeft: null,
        progressPct: b.status === 'reading' ? progressPct(b.currentPage, b.totalPages) : null,
        loan: b.loan,
        tmdbId: null,
        tmdbCollection: null,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      });
    }
    for (const m of movies.data ?? []) {
      out.push({
        id: m.id,
        kind: 'movie',
        title: m.title,
        sub: [m.year, m.genres[0]].filter(Boolean).join(' · '),
        status: m.status,
        statusLabel: copy.mediaStatus[m.status],
        cover: { coverPath: null, coverUrl: null, posterPath: m.posterPath },
        meta: fmtRuntime(m.runtimeMin) ?? (m.year ? String(m.year) : ''),
        year: m.year,
        pagesLeft: null,
        runtimeMin: m.runtimeMin,
        episodesLeft: null,
        progressPct: null,
        loan: null,
        tmdbId: m.tmdbId,
        tmdbCollection: m.collection,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      });
    }
    for (const s of shows.data ?? []) {
      const p = byShow.get(s.id);
      out.push({
        id: s.id,
        kind: 'show',
        title: s.title,
        sub: [s.year, s.network].filter(Boolean).join(' · '),
        status: s.status,
        statusLabel: copy.mediaStatus[s.status],
        cover: { coverPath: null, coverUrl: null, posterPath: s.posterPath },
        meta: p?.next
          ? epCode(p.next.season, p.next.episode)
          : s.numberOfSeasons
            ? copy.tmdb.seasons(s.numberOfSeasons)
            : s.year
              ? String(s.year)
              : '',
        year: s.year,
        pagesLeft: null,
        runtimeMin: null,
        episodesLeft: p ? Math.max(0, p.aired - p.watched) : null,
        progressPct: p && p.total && p.watched ? Math.round((p.watched / p.total) * 100) : null,
        loan: null,
        tmdbId: s.tmdbId,
        tmdbCollection: null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      });
    }
    return out;
  }, [books.data, movies.data, shows.data, progress, lead]);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  return { items, byId, isPending: books.isPending || movies.isPending || shows.isPending };
}

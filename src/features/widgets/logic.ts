import { tmdbImage } from '@shared/tmdb.ts';

import { leadAuthor, leadTitle } from '@/features/books/logic';
import type { Book, LeadScript } from '@/features/books/types';
import { dueSoon } from '@/features/loans/logic';
import { orderWatching, type Session } from '@/features/media/habits';
import type { Show, ShowProgress } from '@/features/media/types';
import { daysBetween, type LocalDate } from '@/lib/dates';

/** The three home-screen widgets (names match the config plugin in app.config.ts). */
export const WIDGETS = ['ContinueReading', 'NextEpisode', 'DueSoon'] as const;
export type WidgetName = (typeof WIDGETS)[number];

export type Episode = { season: number; episode: number; name: string | null; still: string | null };

/** What the widgets show, saved in MMKV so they can draw while the app is closed. */
export type WidgetSnapshot = {
  signedIn: boolean;
  reading: {
    id: string;
    title: string;
    author: string;
    page: number;
    total: number | null;
    /** A cover photo or online cover, else the generated cover (palette from the id). */
    cover: string | null;
  } | null;
  next: ({ showId: string; title: string; failed?: boolean } & Episode) | null;
  due: { id: string; title: string; party: string; dueOn: LocalDate } | null;
};

export const SIGNED_OUT: WidgetSnapshot = { signedIn: false, reading: null, next: null, due: null };

type Inputs = {
  books: Book[];
  shows: Show[];
  progress: ShowProgress[];
  lead: LeadScript;
  /** Signed URL of a cover photo, when the app has one cached. */
  coverUri: (b: Book) => string | null;
  /** Episode ticks (habits): the show usually watched at this time comes first, as on Home. */
  sessions?: Session[];
  now?: Date;
};

/**
 * Home's choices, for the widgets: the most recently touched book being read, the next episode of the
 * show you usually watch at this time (else the most recently touched one; never a special:
 * `show_progress`), and the first book due.
 * Lists arrive newest-updated first (as the app fetches them).
 */
export function buildSnapshot(
  { books, shows, progress, lead, coverUri, sessions = [], now = new Date() }: Inputs,
  today: LocalDate,
): WidgetSnapshot {
  const book = books.find((b) => b.status === 'reading');
  const byId = new Map(progress.map((p) => [p.itemId, p]));
  const [show] = orderWatching(
    shows.filter((s) => s.status === 'watching' && byId.get(s.id)?.next),
    sessions,
    now,
  );
  const next = show ? byId.get(show.id)!.next! : null;
  const due = dueSoon(books, today)[0];
  return {
    signedIn: true,
    reading: book
      ? {
          id: book.id,
          title: leadTitle(book, lead).main,
          author: leadAuthor(book, lead),
          page: book.currentPage,
          total: book.totalPages,
          cover: coverUri(book) ?? book.coverUrl,
        }
      : null,
    next:
      show && next
        ? {
            showId: show.id,
            title: show.title,
            season: next.season,
            episode: next.episode,
            name: next.name,
            still: tmdbImage(next.stillPath, 'w780') ?? tmdbImage(show.backdropPath, 'w780'),
          }
        : null,
    due: due ? { id: due.id, title: leadTitle(due, lead).main, party: due.loan.party, dueOn: due.loan.dueOn } : null,
  };
}

/** Reading progress 0–1 for the bar (0 without a page count). */
export const readFraction = (r: Pick<NonNullable<WidgetSnapshot['reading']>, 'page' | 'total'>) =>
  r.total ? Math.min(1, Math.max(0, r.page / r.total)) : 0;

export const dueIn = (dueOn: LocalDate, today: LocalDate) => daysBetween(today, dueOn);

/** Deep links the widgets open (expo-router paths under the `calico` scheme). */
export const links = {
  book: (id: string) => `calico://book/${id}`,
  ruler: (id: string) => `calico://book/${id}?sheet=ruler`,
  renew: (id: string) => `calico://book/${id}?sheet=renew`,
  episode: (showId: string, season: number, episode: number) => `calico://show/${showId}?episode=${season}-${episode}`,
  home: 'calico://',
};

/** `?episode=2-6` (the Next episode widget's link) → season 2, episode 6. */
export function parseEpisodeParam(v: string | undefined): { season: number; episode: number } | null {
  const m = v?.match(/^(\d+)-(\d+)$/);
  return m ? { season: Number(m[1]), episode: Number(m[2]) } : null;
}

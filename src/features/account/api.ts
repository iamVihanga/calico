import { supabase } from '@/lib/supabase';

export type HomeStats = { pagesThisMonth: number; booksFinishedThisYear: number; episodesThisWeek: number };

export async function fetchHomeStats(): Promise<HomeStats> {
  const { data, error } = await supabase.rpc('home_stats');
  if (error) throw error;
  const d = (data ?? {}) as Record<string, number>;
  return {
    pagesThisMonth: d.pages_this_month ?? 0,
    booksFinishedThisYear: d.books_finished_this_year ?? 0,
    episodesThisWeek: d.episodes_this_week ?? 0,
  };
}

export type YearStats = {
  year: number;
  booksFinished: number;
  goal: number | null;
  pagesRead: number;
  languageSplit: Record<string, number>;
  moviesWatched: number;
  viewings: number;
  episodesWatched: number;
  hoursWatched: number;
  longestBook: { itemId: string; title: string; pages: number } | null;
  fastestRead: { itemId: string; title: string; days: number } | null;
  mostRewatched: { itemId: string; title: string; viewings: number } | null;
};

type Raw = Record<string, unknown> & {
  longest_book?: { item_id: string; title: string; pages: number } | null;
  fastest_read?: { item_id: string; title: string; days: number } | null;
  most_rewatched?: { item_id: string; title: string; viewings: number } | null;
};

export function toYearStats(d: Raw, year: number): YearStats {
  const n = (k: string) => Number(d[k] ?? 0);
  return {
    year,
    booksFinished: n('books_finished'),
    goal: d.goal == null ? null : Number(d.goal),
    pagesRead: n('pages_read'),
    languageSplit: (d.language_split as Record<string, number> | undefined) ?? {},
    moviesWatched: n('movies_watched'),
    viewings: n('viewings'),
    episodesWatched: n('episodes_watched'),
    hoursWatched: n('hours_watched'),
    longestBook: d.longest_book
      ? { itemId: d.longest_book.item_id, title: d.longest_book.title, pages: d.longest_book.pages }
      : null,
    fastestRead: d.fastest_read
      ? { itemId: d.fastest_read.item_id, title: d.fastest_read.title, days: d.fastest_read.days }
      : null,
    mostRewatched: d.most_rewatched
      ? { itemId: d.most_rewatched.item_id, title: d.most_rewatched.title, viewings: d.most_rewatched.viewings }
      : null,
  };
}

export async function fetchYearStats(year: number): Promise<YearStats> {
  const { data, error } = await supabase.rpc('year_stats', { p_year: year });
  if (error) throw error;
  return toYearStats((data ?? {}) as Raw, year);
}

/** Everything the user owns (`export_my_data`), as one JSON object of arrays. */
export async function exportMyData(): Promise<Record<string, unknown[]>> {
  const { data, error } = await supabase.rpc('export_my_data');
  if (error) throw error;
  return (data ?? {}) as Record<string, unknown[]>;
}

/** Removes covers, then the auth user; every row cascades (plan §8.5). */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw error;
}

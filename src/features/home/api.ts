import { supabase } from '@/lib/supabase';

export type ShelfSummary = { books: number; movies: number; shows: number; openLoans: number };

/** Phase 1 check that the signed-in user's data loads (and survives offline restarts). Replaced by useHome in Phase 2. */
export async function fetchShelfSummary(): Promise<ShelfSummary> {
  const [items, loans] = await Promise.all([
    supabase.from('items').select('kind'),
    supabase.from('loans').select('id', { count: 'exact', head: true }).is('returned_on', null),
  ]);
  if (items.error) throw items.error;
  if (loans.error) throw loans.error;
  const count = (k: string) => items.data.filter((i) => i.kind === k).length;
  return { books: count('book'), movies: count('movie'), shows: count('show'), openLoans: loans.count ?? 0 };
}

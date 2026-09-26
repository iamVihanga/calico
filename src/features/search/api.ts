import { supabase } from '@/lib/supabase';

export type SearchHit = {
  itemId: string;
  kind: 'book' | 'movie' | 'show';
  title: string;
  titleNative: string | null;
  author: string | null;
  score: number;
};

/** Bilingual library search (`search_library`: both scripts, titles and authors, trigram-ranked). */
export async function searchLibrary(q: string): Promise<SearchHit[]> {
  const { data, error } = await supabase.rpc('search_library', { q });
  if (error) throw error;
  return data.map((r) => ({
    itemId: r.item_id,
    kind: r.kind,
    title: r.title,
    titleNative: r.title_native,
    author: r.author,
    score: r.score,
  }));
}

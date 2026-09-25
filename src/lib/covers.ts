import { useQuery } from '@tanstack/react-query';

import { qk } from './queryKeys';
import { supabase } from './supabase';

const DAY_S = 24 * 60 * 60;

// Batch signed-URL requests made in the same tick into one createSignedUrls call (plan §9.4).
let queue: { path: string; resolve: (u: string | null) => void }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  const batch = queue;
  queue = [];
  timer = null;
  const paths = [...new Set(batch.map((b) => b.path))];
  const { data, error } = await supabase.storage.from('covers').createSignedUrls(paths, DAY_S);
  const byPath = new Map((error ? [] : (data ?? [])).map((d) => [d.path, d.signedUrl ?? null]));
  for (const b of batch) b.resolve(byPath.get(b.path) ?? null);
}

export function signedCoverUrl(path: string): Promise<string | null> {
  return new Promise((resolve) => {
    queue.push({ path, resolve });
    timer ??= setTimeout(flush, 10);
  });
}

type Coverable = { coverPath: string | null; coverUrl: string | null };

/**
 * The image to show for an item: the user's photo (signed URL, re-signed well before the 24h
 * expiry), else an external cover, else null (render GeneratedCover). `cacheKey` is the storage
 * path so expo-image keeps its disk cache when the signed URL rotates.
 */
export function useCoverSource(item: Coverable | null | undefined): { uri: string; cacheKey: string } | null {
  const path = item?.coverPath ?? null;
  const signed = useQuery({
    queryKey: qk.signedUrl(path ?? ''),
    queryFn: () => signedCoverUrl(path!),
    enabled: !!path,
    staleTime: 20 * 60 * 60 * 1000,
    gcTime: DAY_S * 1000,
  });
  if (path && signed.data) return { uri: signed.data, cacheKey: path };
  if (item?.coverUrl) return { uri: item.coverUrl, cacheKey: item.coverUrl };
  return null;
}

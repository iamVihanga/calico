import { EmptyState } from './EmptyState';
import { QueryError } from './QueryError';
import { DetailSkeleton } from './Skeleton';

import { copy } from '@/i18n/en';

type Q = { isError: boolean; isFetched: boolean; refetch: () => unknown };

/**
 * What a detail screen shows while its item isn't there: a skeleton while loading, a retry when the
 * fetch failed (e.g. offline with nothing cached), and "not on your shelf" only when it really isn't.
 */
export function DetailLoadState({ q, notFound = copy.books.notFound }: { q: Q; notFound?: string }) {
  if (q.isError) return <QueryError onRetry={() => void q.refetch()} />;
  if (q.isFetched) return <EmptyState body={notFound} />;
  return <DetailSkeleton />;
}

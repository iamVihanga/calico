import { queryClient } from '@/lib/queryClient';
import { useToastStore } from '@/lib/stores/toast';

/** Stop timers the app's singletons keep (mutation/query gc, toast) so Jest can exit. */
export function cleanupAppState() {
  queryClient
    .getMutationCache()
    .getAll()
    .forEach((m) => m.destroy());
  queryClient
    .getQueryCache()
    .getAll()
    .forEach((q) => q.destroy());
  queryClient.clear();
  useToastStore.getState().hide();
}

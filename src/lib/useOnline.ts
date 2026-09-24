import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

/** Online state as TanStack Query sees it (fed by NetInfo). */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
  );
}

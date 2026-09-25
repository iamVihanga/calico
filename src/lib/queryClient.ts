import NetInfo from '@react-native-community/netinfo';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';
import { AppState } from 'react-native';

import { registerMutations } from './mutations';
import { storage, storageKeys } from './storage';

/** Bump with every migration so a cache from an older schema is discarded. */
export const LATEST_MIGRATION = '20260925000001';
export const cacheBuster = `${Constants.expoConfig?.version ?? '0'}-${LATEST_MIGRATION}`;

const DAY = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 7 * DAY, networkMode: 'offlineFirst', retry: 2 },
    // Mutations keep the default `online` mode: offline they pause, get persisted, and resume.
  },
});
registerMutations(queryClient);

export const persister = createSyncStoragePersister({
  storage: {
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => void storage.remove(key),
  },
  key: storageKeys.queryCache,
  throttleTime: 1000,
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: 7 * DAY,
  buster: cacheBuster,
};

// Connectivity → TanStack online manager.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

// Refetch stale queries when the app comes back to the foreground.
AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));

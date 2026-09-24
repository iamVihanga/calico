import { createMMKV } from 'react-native-mmkv';

/** App-wide key/value store (theme mirror, recent searches, pending captures, query cache). */
export const storage = createMMKV({ id: 'calico' });

export const storageKeys = {
  theme: 'theme',
  queryCache: 'query-cache',
} as const;

/** Wipe everything except the theme (sign-out keeps the paper colour for the welcome screen). */
export function clearStorageKeepingTheme() {
  const theme = storage.getString(storageKeys.theme);
  storage.clearAll();
  if (theme) storage.set(storageKeys.theme, theme);
}

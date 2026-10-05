import { createMMKV } from 'react-native-mmkv';

/** App-wide key/value store (theme mirror, recent searches, pending captures, query cache). */
export const storage = createMMKV({ id: 'calico' });

export const storageKeys = {
  theme: 'theme',
  queryCache: 'query-cache',
  pendingCaptures: 'pending-captures',
  remindersAsked: 'reminders-asked',
  recentTmdb: 'recent-tmdb-searches',
  recentSearches: 'recent-searches',
  /** { [itemId]: { language, spoilers } } for the AI chat about each title. */
  chatPrefs: 'chat-prefs',
  /** What the home-screen widgets show (`WidgetSnapshot`), so they can draw while the app is closed. */
  widgets: 'widgets',
  /** The one-time "Want a nudge?" card was answered. */
  nudgeOffer: 'nudge-offer',
  /** Library segment, and per segment its filter, sort, grouping and view (survive a restart). */
  libraryPrefs: 'library-prefs',
  /** The Wishlist tab's filter pill. */
  wishlistFilter: 'wishlist-filter',
} as const;

/** Wipe everything except the theme (sign-out keeps the paper colour for the welcome screen). */
export function clearStorageKeepingTheme() {
  const theme = storage.getString(storageKeys.theme);
  storage.clearAll();
  if (theme) storage.set(storageKeys.theme, theme);
}

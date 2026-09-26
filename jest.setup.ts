/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// Patch the shared mock module itself: expo-router/testing-library installs its own
// `jest.mock('react-native-reanimated')` that re-requires this same module.
const reanimatedMock = require('react-native-reanimated/mock');
reanimatedMock.useReducedMotion = () => false;
// Not in the mock; layout animations are no-ops in tests anyway.
reanimatedMock.LayoutAnimationConfig ??= ({ children }: { children: unknown }) => children;
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// MMKV needs the Nitro native module; tests get an in-memory store.
jest.mock('react-native-mmkv', () => {
  const createMMKV = () => {
    const data = new Map<string, string | number | boolean>();
    return {
      set: (k: string, v: string | number | boolean) => void data.set(k, v),
      getString: (k: string) => {
        const v = data.get(k);
        return typeof v === 'string' ? v : undefined;
      },
      getNumber: (k: string) => {
        const v = data.get(k);
        return typeof v === 'number' ? v : undefined;
      },
      getBoolean: (k: string) => {
        const v = data.get(k);
        return typeof v === 'boolean' ? v : undefined;
      },
      contains: (k: string) => data.has(k),
      remove: (k: string) => data.delete(k),
      getAllKeys: () => [...data.keys()],
      clearAll: () => data.clear(),
    };
  };
  return { createMMKV };
});

// Client env for modules that validate it at import.
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.EXPO_PUBLIC_SUPABASE_KEY = 'test-key';
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'test-client.apps.googleusercontent.com';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

// Local notifications: a quiet fake (no permission yet, nothing scheduled). Tests override per file.
jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 6 },
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(async () => ({ granted: false, status: 'undetermined', canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted', canAskAgain: true })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  dismissNotificationAsync: jest.fn(async () => undefined),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Client-generated ids (CLAUDE.md): real UUIDs in tests too.
jest.mock('expo-crypto', () => ({
  ...jest.requireActual('expo-crypto'),
  randomUUID: () => require('node:crypto').randomUUID(),
}));

/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// Patch the shared mock module itself: expo-router/testing-library installs its own
// `jest.mock('react-native-reanimated')` that re-requires this same module.
const reanimatedMock = require('react-native-reanimated/mock');
reanimatedMock.useReducedMotion = () => false;
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

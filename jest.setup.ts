/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => {
  const mock = require('react-native-reanimated/mock');
  return { ...mock, default: mock.default ?? mock, useReducedMotion: () => false };
});

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

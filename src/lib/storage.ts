import { createMMKV } from 'react-native-mmkv';

/** App-wide key/value store (theme mirror, recent searches, pending captures, query cache). */
export const storage = createMMKV({ id: 'calico' });

export const storageKeys = {
  theme: 'theme',
} as const;

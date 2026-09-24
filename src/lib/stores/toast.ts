import { create } from 'zustand';

import type { ToastTone } from '@/components/ds/Toast';

export const TOAST_MS = 4200; // prototype toast timeout

export type ToastInput = {
  message: string;
  /** Action button; defaults to none. */
  action?: { label: string; onPress: () => void };
  tone?: ToastTone;
};

type ToastState = {
  toast: (ToastInput & { id: number }) | null;
  show: (t: ToastInput) => void;
  hide: () => void;
};

let timer: ReturnType<typeof setTimeout> | undefined;
let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (t) => {
    clearTimeout(timer);
    set({ toast: { ...t, id: ++seq } });
    timer = setTimeout(() => set({ toast: null }), TOAST_MS);
  },
  hide: () => {
    clearTimeout(timer);
    set({ toast: null });
  },
}));

/** Imperative helper for non-React code (mutation callbacks). */
export const toast = (t: ToastInput) => useToastStore.getState().show(t);

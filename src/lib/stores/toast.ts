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
  /** Follow-ups shown one after another ("Returned" → "Move to To read?"). */
  queue: ToastInput[];
  /** Replace whatever is showing. */
  show: (t: ToastInput) => void;
  /** Show after the current toast (and any queued before it). */
  enqueue: (t: ToastInput) => void;
  clearQueue: () => void;
  /** Run the action, then move on to the next queued toast unless the action showed its own. */
  pressAction: () => void;
  /** Hide everything, queue included. */
  hide: () => void;
};

let timer: ReturnType<typeof setTimeout> | undefined;
let seq = 0;

export const useToastStore = create<ToastState>((set, get) => {
  const next = () => {
    clearTimeout(timer);
    const [head, ...rest] = get().queue;
    if (head) {
      set({ queue: rest });
      get().show(head);
    } else {
      set({ toast: null });
    }
  };
  return {
    toast: null,
    queue: [],
    show: (t) => {
      clearTimeout(timer);
      set({ toast: { ...t, id: ++seq } });
      timer = setTimeout(next, TOAST_MS);
    },
    enqueue: (t) => (get().toast ? set({ queue: [...get().queue, t] }) : get().show(t)),
    clearQueue: () => set({ queue: [] }),
    pressAction: () => {
      const current = get().toast;
      clearTimeout(timer);
      set({ toast: null });
      current?.action?.onPress();
      if (!get().toast) next();
    },
    hide: () => {
      clearTimeout(timer);
      set({ toast: null, queue: [] });
    },
  };
});

/** Imperative helper for non-React code (mutation callbacks). */
export const toast = (t: ToastInput) => useToastStore.getState().show(t);

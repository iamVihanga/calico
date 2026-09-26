import { create } from 'zustand';

export type Rect = { x: number; y: number; width: number; height: number };
export type DragItem = {
  id: string;
  kind: 'book' | 'movie' | 'show';
  title: string;
  cover: { coverPath: string | null; coverUrl: string | null; posterPath: string | null };
};

/** Which drop target (collection chip) is under the finger, if any. */
export function hitTarget(targets: Record<string, Rect>, x: number, y: number): string | null {
  for (const [id, r] of Object.entries(targets)) {
    if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) return id;
  }
  return null;
}

type DragState = {
  item: DragItem | null;
  x: number;
  y: number;
  over: string | null;
  /** Window rects of the tray's collection chips (measureInWindow). */
  targets: Record<string, Rect>;
  /** The chip that just received a drop, for its pulse. */
  landed: { id: string; at: number } | null;
  lift: (item: DragItem, x: number, y: number) => void;
  /** Returns true when the finger entered a new target (for the hover haptic). */
  move: (x: number, y: number) => boolean;
  /** End the drag; returns the target it was dropped on. */
  drop: () => string | null;
  setTarget: (id: string, rect: Rect | null) => void;
  land: (id: string) => void;
};

/** Drag to collect (plan §11.9): the lifted card, where it is, and the chips it can land on. */
export const useDragStore = create<DragState>((set, get) => ({
  item: null,
  x: 0,
  y: 0,
  over: null,
  targets: {},
  landed: null,
  lift: (item, x, y) => set({ item, x, y, over: null }),
  move: (x, y) => {
    const over = hitTarget(get().targets, x, y);
    const entered = over !== null && over !== get().over;
    set({ x, y, over });
    return entered;
  },
  drop: () => {
    const { item, over } = get();
    set({ item: null, over: null });
    return item ? over : null;
  },
  setTarget: (id, rect) =>
    set((s) => {
      const targets = { ...s.targets };
      if (rect) targets[id] = rect;
      else delete targets[id];
      return { targets };
    }),
  land: (id) => set({ landed: { id, at: Date.now() } }),
}));

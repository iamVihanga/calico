import { create } from 'zustand';

/**
 * Global sheets (plan §9.1): sheets are not routes; `SheetHost` renders the open one.
 * Each phase adds its sheets to `SheetParams`.
 */
export type SheetParams = {
  add: undefined;
  ruler: { itemId: string };
  finish: { itemId: string };
  stop: { itemId: string };
  overflow: { itemId: string };
  startReading: { itemId: string; reread: boolean };
  confirmDelete: { itemId: string };
  renew: { itemId: string };
  loanQuick: { itemId: string };
  loanForm: { itemId: string };
  notif: undefined;
  tmdbPreview: {
    tmdbId: number;
    kind: 'movie' | 'show';
    title: string;
    year: number | null;
    posterPath: string | null;
    overview: string | null;
  };
  franchise: { itemId: string; tmdbId: number; collectionId: number };
  watchAgain: { itemId: string };
  mediaOverflow: { itemId: string };
  tray: { itemId: string; title: string };
  addToCollection: { itemId: string; title: string };
  newCollection: { itemId?: string };
  collectionMenu: { collectionId: string };
  setting: { field: 'goal' | 'loanDays' | 'library' | 'time' };
  export: undefined;
};
export type SheetName = keyof SheetParams;

type OpenSheet = { [K in SheetName]: { name: K; params: SheetParams[K] } }[SheetName];

type ParamsArg<K extends SheetName> = SheetParams[K] extends undefined ? [] : [SheetParams[K]];
type OpenFn = <K extends SheetName>(name: K, ...params: ParamsArg<K>) => void;

type SheetState = {
  sheet: OpenSheet | null;
  open: OpenFn;
  close: () => void;
};

export const useSheetStore = create<SheetState>((set) => ({
  sheet: null,
  open: (name, ...params) => set({ sheet: { name, params: params[0] } as OpenSheet }),
  close: () => set({ sheet: null }),
}));

export const openSheet: OpenFn = (name, ...params) => useSheetStore.getState().open(name, ...params);

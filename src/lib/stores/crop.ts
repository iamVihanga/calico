import { create } from 'zustand';

export type Photo = { uri: string; width: number; height: number };
type Request = Photo & { resolve: (out: Photo | null) => void };

/** One crop at a time, shown full-screen by `CropHost`. */
export const useCropStore = create<{ request: Request | null }>(() => ({ request: null }));

/** Open the four-corner crop for a picked photo: the straightened cover, or null if cancelled. */
export function cropPhoto(photo: Photo): Promise<Photo | null> {
  return new Promise((resolve) => {
    useCropStore.getState().request?.resolve(null);
    useCropStore.setState({ request: { ...photo, resolve } });
  });
}

export function finishCrop(out: Photo | null) {
  const r = useCropStore.getState().request;
  useCropStore.setState({ request: null });
  r?.resolve(out);
}

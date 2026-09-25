import type { ConfidenceField, IsbnLookup, NormalizedExtraction } from '@shared/extraction.ts';
import { LOW_CONFIDENCE } from '@shared/extraction.ts';

import type { Book } from '@/features/books/types';
import type { ReviewForm } from '@/features/books/schema';

/** 2:3 cover guide inside the camera view (prototype 224×336) and the wide barcode frame (300×120). */
export const GUIDE = { cover: { w: 224, h: 336 }, barcode: { w: 300, h: 120 } } as const;

export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Map a crop box drawn over a displayed image (fit "contain" in a view) back to image pixels.
 * `view` is the size of the area the image is fitted into; `image` is the (rotated) image size.
 */
export function viewRectToImage(
  box: Rect,
  view: { width: number; height: number },
  image: { width: number; height: number },
): Rect {
  const scale = Math.min(view.width / image.width, view.height / image.height);
  const shownW = image.width * scale;
  const shownH = image.height * scale;
  const offX = (view.width - shownW) / 2;
  const offY = (view.height - shownH) / 2;
  const x = Math.max(0, Math.round((box.x - offX) / scale));
  const y = Math.max(0, Math.round((box.y - offY) / scale));
  const width = Math.min(image.width - x, Math.round(box.width / scale));
  const height = Math.min(image.height - y, Math.round(box.height / scale));
  return { x, y, width: Math.max(1, width), height: Math.max(1, height) };
}

/** The shown image area inside a view (for placing the initial crop box). */
export function containedRect(view: { width: number; height: number }, image: { width: number; height: number }): Rect {
  const scale = Math.min(view.width / image.width, view.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (view.width - width) / 2, y: (view.height - height) / 2, width, height };
}

/** Initial crop box: the largest 2:3 box centred in the shown image (matches the camera guide). */
export function initialCropBox(shown: Rect, ratio = 2 / 3): Rect {
  let width = shown.width * 0.9;
  let height = width / ratio;
  if (height > shown.height * 0.9) {
    height = shown.height * 0.9;
    width = height * ratio;
  }
  return { x: shown.x + (shown.width - width) / 2, y: shown.y + (shown.height - height) / 2, width, height };
}

export const MIN_CROP = 60;

/** Move one corner/edge of the crop box by (dx, dy), clamped to the shown image and a minimum size. */
export function dragBox(
  start: Rect,
  handle: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move',
  dx: number,
  dy: number,
  bounds: Rect,
): Rect {
  'worklet';
  let { x, y, width, height } = start;
  const right = x + width;
  const bottom = y + height;
  if (handle === 'move') {
    x = Math.min(Math.max(bounds.x, x + dx), bounds.x + bounds.width - width);
    y = Math.min(Math.max(bounds.y, y + dy), bounds.y + bounds.height - height);
    return { x, y, width, height };
  }
  let l = x;
  let t = y;
  let r = right;
  let b = bottom;
  if (handle.includes('l')) l = Math.min(Math.max(bounds.x, x + dx), right - MIN_CROP);
  if (handle.includes('r')) r = Math.max(Math.min(bounds.x + bounds.width, right + dx), x + MIN_CROP);
  if (handle.includes('t')) t = Math.min(Math.max(bounds.y, y + dy), bottom - MIN_CROP);
  if (handle.includes('b')) b = Math.max(Math.min(bounds.y + bounds.height, bottom + dy), y + MIN_CROP);
  return { x: l, y: t, width: r - l, height: b - t };
}

export const isLowConfidence = (c: number | undefined) => c !== undefined && c < LOW_CONFIDENCE;

export type FieldKey = 'titleNative' | 'title' | 'authorNative' | 'author';

/** Lead with whichever script the cover was printed in (brief §7.5.4). */
export function fieldOrder(script: NormalizedExtraction['script_on_cover'] | undefined): FieldKey[] {
  return script === 'latin'
    ? ['title', 'titleNative', 'author', 'authorNative']
    : ['titleNative', 'title', 'authorNative', 'author'];
}

/** Form field ← extraction field, for the ✦ / dotted-underline confidence states. */
export const CONFIDENCE_OF: Record<string, ConfidenceField> = {
  titleNative: 'title_native',
  title: 'title_romanized',
  authorNative: 'author_native',
  author: 'author_romanized',
  language: 'language',
  pages: 'total_pages',
};

export function formFromExtraction(e: NormalizedExtraction): Partial<ReviewForm> {
  return {
    titleNative: e.title_native ?? '',
    title: e.title_romanized ?? '',
    authorNative: e.author_native ?? '',
    author: e.author_romanized ?? '',
    language: e.language,
    pages: e.total_pages ? String(e.total_pages) : '',
  };
}

export function formFromLookup(l: IsbnLookup): Partial<ReviewForm> {
  return {
    title: l.title ?? '',
    author: l.author ?? '',
    language: l.language ?? 'English',
    pages: l.pages ? String(l.pages) : '',
  };
}

const norm = (s: string | null | undefined) =>
  (s ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/** A book already on the shelf with the same title in either script (duplicate notice). */
export function findDuplicate(books: Book[], title: string, titleNative: string): Book | null {
  const a = norm(title);
  const b = norm(titleNative);
  if (!a && !b) return null;
  return (
    books.find(
      (x) =>
        (a && (norm(x.title) === a || norm(x.titleNative) === a)) ||
        (b && (norm(x.titleNative) === b || norm(x.title) === b)),
    ) ?? null
  );
}

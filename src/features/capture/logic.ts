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

// Four-corner crop (perspective) ------------------------------------------------------------------

export type Pt = { x: number; y: number };
/** Corners in order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [Pt, Pt, Pt, Pt];

export const rectQuad = (r: Rect): Quad => [
  { x: r.x, y: r.y },
  { x: r.x + r.width, y: r.y },
  { x: r.x + r.width, y: r.y + r.height },
  { x: r.x, y: r.y + r.height },
];

/** Keep a dragged corner on the shown image. */
export function clampPt(p: Pt, r: Rect): Pt {
  'worklet';
  return {
    x: Math.min(Math.max(p.x, r.x), r.x + r.width),
    y: Math.min(Math.max(p.y, r.y), r.y + r.height),
  };
}

/** A quad drawn over the shown image (`shown` inside the view) in image pixels. */
export function viewQuadToImage(q: Quad, shown: Rect, image: { width: number; height: number }): Quad {
  const s = image.width / shown.width;
  return q.map((p) => ({
    x: Math.min(Math.max((p.x - shown.x) * s, 0), image.width),
    y: Math.min(Math.max((p.y - shown.y) * s, 0), image.height),
  })) as Quad;
}

/** Corners in order without crossing edges (a bow-tie can't be straightened). */
export function isConvex(q: Quad): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i]!;
    const b = q[(i + 1) % 4]!;
    const c = q[(i + 2) % 4]!;
    const z = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(z) < 1e-9) return false;
    if (sign === 0) sign = Math.sign(z);
    else if (Math.sign(z) !== sign) return false;
  }
  return true;
}

/** Nearly an upright rectangle (within `tol` px): a plain crop is enough, no straightening. */
export function rectOf(q: Quad, tol: number): Rect | null {
  const [tl, tr, br, bl] = q;
  const ok =
    Math.abs(tl.y - tr.y) <= tol &&
    Math.abs(bl.y - br.y) <= tol &&
    Math.abs(tl.x - bl.x) <= tol &&
    Math.abs(tr.x - br.x) <= tol;
  if (!ok) return null;
  const x = Math.round(Math.min(tl.x, bl.x));
  const y = Math.round(Math.min(tl.y, tr.y));
  return {
    x,
    y,
    width: Math.max(1, Math.round(Math.max(tr.x, br.x)) - x),
    height: Math.max(1, Math.round(Math.max(bl.y, br.y)) - y),
  };
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Size of the straightened cover: the longer of each pair of opposite edges, long side ≤ `maxLong`. */
export function quadOutputSize(q: Quad, maxLong: number): { width: number; height: number } {
  const [tl, tr, br, bl] = q;
  const w = Math.max(dist(tl, tr), dist(bl, br));
  const h = Math.max(dist(tl, bl), dist(tr, br));
  const k = Math.min(1, maxLong / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}

/**
 * The 3×3 projective transform (row-major, h[8] = 1) taking `from` corners to `to` corners: the
 * standard 8 equations, solved by Gaussian elimination.
 */
export function homography(from: Quad, to: Quad): number[] {
  const a: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i]!;
    const { x: u, y: v } = to[i]!;
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(a[r]![c]!) > Math.abs(a[p]![c]!)) p = r;
    [a[c], a[p]] = [a[p]!, a[c]!];
    const pivot = a[c]![c]!;
    if (Math.abs(pivot) < 1e-12) throw new Error('degenerate quad');
    for (let k = c; k < 9; k++) a[c]![k]! /= pivot;
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = a[r]![c]!;
      if (f === 0) continue;
      for (let k = c; k < 9; k++) a[r]![k]! -= f * a[c]![k]!;
    }
  }
  return [...a.map((row) => row[8]!), 1];
}

export function project(h: number[], x: number, y: number): Pt {
  const w = h[6]! * x + h[7]! * y + h[8]!;
  return { x: (h[0]! * x + h[1]! * y + h[2]!) / w, y: (h[3]! * x + h[4]! * y + h[5]!) / w };
}

/**
 * Straighten: every output pixel looks up where it comes from inside `quad` (bilinear). RGBA in and
 * out (`jpeg-js` layout).
 */
export function warpPerspective(
  src: Uint8Array,
  sw: number,
  sh: number,
  quad: Quad,
  ow: number,
  oh: number,
): Uint8Array {
  const h = homography(rectQuad({ x: 0, y: 0, width: ow - 1, height: oh - 1 }), quad);
  const [h0, h1, h2, h3, h4, h5, h6, h7, h8] = h as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const out = new Uint8Array(ow * oh * 4);
  const maxX = sw - 1;
  const maxY = sh - 1;
  let o = 0;
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const w = h6 * x + h7 * y + h8;
      let sx = (h0 * x + h1 * y + h2) / w;
      let sy = (h3 * x + h4 * y + h5) / w;
      sx = sx < 0 ? 0 : sx > maxX ? maxX : sx;
      sy = sy < 0 ? 0 : sy > maxY ? maxY : sy;
      const x0 = sx | 0;
      const y0 = sy | 0;
      const x1 = x0 < maxX ? x0 + 1 : x0;
      const y1 = y0 < maxY ? y0 + 1 : y0;
      const fx = sx - x0;
      const fy = sy - y0;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;
      for (let c = 0; c < 3; c++) {
        const top = src[i00 + c]! + (src[i10 + c]! - src[i00 + c]!) * fx;
        const bottom = src[i01 + c]! + (src[i11 + c]! - src[i01 + c]!) * fx;
        out[o + c] = top + (bottom - top) * fy + 0.5;
      }
      out[o + 3] = 255;
      o += 4;
    }
  }
  return out;
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

/**
 * RGBA → 24-bit BMP bytes. The straightened pixels go to the native image manipulator as a BMP, which
 * re-encodes the JPEG far faster than JS could.
 */
export function toBmp(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const row = Math.ceil((width * 3) / 4) * 4;
  const size = 54 + row * height;
  const out = new Uint8Array(size);
  const v = new DataView(out.buffer);
  out[0] = 0x42; // 'B'
  out[1] = 0x4d; // 'M'
  v.setUint32(2, size, true);
  v.setUint32(10, 54, true); // pixel data offset
  v.setUint32(14, 40, true); // BITMAPINFOHEADER
  v.setInt32(18, width, true);
  v.setInt32(22, height, true); // positive: rows bottom-up
  v.setUint16(26, 1, true);
  v.setUint16(28, 24, true);
  v.setUint32(34, row * height, true);
  for (let y = 0; y < height; y++) {
    let o = 54 + (height - 1 - y) * row;
    let i = y * width * 4;
    for (let x = 0; x < width; x++, i += 4) {
      out[o++] = rgba[i + 2]!;
      out[o++] = rgba[i + 1]!;
      out[o++] = rgba[i]!;
    }
  }
  return out;
}

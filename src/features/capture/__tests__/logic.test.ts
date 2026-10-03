import type { NormalizedExtraction } from '@shared/extraction.ts';

import type { Book } from '@/features/books/types';

import {
  clampPt,
  containedRect,
  fieldOrder,
  findDuplicate,
  formFromExtraction,
  homography,
  initialCropBox,
  isConvex,
  isLowConfidence,
  project,
  type Quad,
  quadOutputSize,
  rectOf,
  rectQuad,
  toBmp,
  viewQuadToImage,
  viewRectToImage,
  warpPerspective,
} from '../logic';

describe('crop geometry', () => {
  const view = { width: 360, height: 600 };
  const image = { width: 3000, height: 4000 }; // portrait photo

  it('fits the image and maps the crop box back to pixels', () => {
    const shown = containedRect(view, image); // scale 0.12 → 360×480, centred vertically
    expect(shown).toEqual({ x: 0, y: 60, width: 360, height: 480 });
    const crop = viewRectToImage({ x: 60, y: 120, width: 240, height: 360 }, view, image);
    expect(crop).toEqual({ x: 500, y: 500, width: 2000, height: 3000 });
  });

  it('starts with a centred 2:3 box inside the photo', () => {
    const box = initialCropBox(containedRect(view, image));
    expect(box.width / box.height).toBeCloseTo(2 / 3);
    expect(box.y).toBeGreaterThanOrEqual(60);
    expect(box.y + box.height).toBeLessThanOrEqual(540);
  });

  it('maps the four corners to image pixels and keeps them on the photo', () => {
    const shown = containedRect(view, image);
    const q = viewQuadToImage(rectQuad({ x: 60, y: 120, width: 240, height: 360 }), shown, image);
    const want = [
      [500, 500],
      [2500, 500],
      [2500, 3500],
      [500, 3500],
    ];
    q.forEach((p, i) => {
      expect(p.x).toBeCloseTo(want[i]![0]!, 6);
      expect(p.y).toBeCloseTo(want[i]![1]!, 6);
    });
    expect(clampPt({ x: -5, y: 900 }, shown)).toEqual({ x: 0, y: 540 });
  });
});

const extraction = (over: Partial<NormalizedExtraction> = {}): NormalizedExtraction => ({
  script_on_cover: 'sinhala',
  title_native: 'මඩොල් දූව',
  title_romanized: 'Madol Doova',
  author_native: 'මාර්ටින් වික්‍රමසිංහ',
  author_romanized: 'Martin Wickramasinghe',
  language: 'Sinhala',
  isbn: null,
  publisher: null,
  published_year: null,
  total_pages: 214,
  confidence: {
    title_native: 0.95,
    title_romanized: 0.9,
    author_native: 0.9,
    author_romanized: 0.9,
    language: 0.9,
    isbn: 0,
    publisher: 0,
    published_year: 0,
    total_pages: 0.4,
  },
  ...over,
});

describe('review mapping', () => {
  it('leads with the script on the cover', () => {
    expect(fieldOrder('sinhala')).toEqual(['titleNative', 'title', 'authorNative', 'author']);
    expect(fieldOrder('latin')).toEqual(['title', 'titleNative', 'author', 'authorNative']);
  });

  it('fills the form from the extraction', () => {
    expect(formFromExtraction(extraction())).toEqual({
      titleNative: 'මඩොල් දූව',
      title: 'Madol Doova',
      authorNative: 'මාර්ටින් වික්‍රමසිංහ',
      author: 'Martin Wickramasinghe',
      language: 'Sinhala',
      pages: '214',
    });
  });

  it('flags confidence below 0.6', () => {
    expect(isLowConfidence(0.4)).toBe(true);
    expect(isLowConfidence(0.6)).toBe(false);
    expect(isLowConfidence(undefined)).toBe(false);
  });

  it('finds duplicates in either script, ignoring case and punctuation', () => {
    const books = [{ id: 'g', title: 'Gamperaliya', titleNative: 'ගම්පෙරළිය' } as Book];
    expect(findDuplicate(books, 'gamperaliya!', '')?.id).toBe('g');
    expect(findDuplicate(books, '', 'ගම්පෙරළිය')?.id).toBe('g');
    expect(findDuplicate(books, 'Madol Doova', '')).toBeNull();
    expect(findDuplicate(books, '', '')).toBeNull();
  });
});

describe('four-corner crop', () => {
  const slanted: Quad = [
    { x: 30, y: 10 },
    { x: 170, y: 20 },
    { x: 180, y: 290 },
    { x: 10, y: 280 },
  ];

  it('maps each corner exactly', () => {
    const out = rectQuad({ x: 0, y: 0, width: 100, height: 150 });
    const h = homography(out, slanted);
    out.forEach((p, i) => {
      const m = project(h, p.x, p.y);
      expect(m.x).toBeCloseTo(slanted[i]!.x, 6);
      expect(m.y).toBeCloseTo(slanted[i]!.y, 6);
    });
  });

  it('sizes the result from the longer edges, capped', () => {
    const size = quadOutputSize(slanted, 10000);
    expect(size.width).toBe(Math.round(Math.hypot(170, 10)));
    expect(size.height).toBe(Math.round(Math.hypot(20, 270)));
    expect(Math.max(...Object.values(quadOutputSize(slanted, 100)))).toBe(100);
  });

  it('knows a plain rectangle, and a crossed (bow-tie) quad', () => {
    expect(rectOf(rectQuad({ x: 10, y: 20, width: 100, height: 150 }), 2)).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 150,
    });
    expect(rectOf(slanted, 2)).toBeNull();
    expect(isConvex(slanted)).toBe(true);
    expect(isConvex([slanted[0], slanted[2], slanted[1], slanted[3]])).toBe(false);
  });

  it('straightens: a slanted quad over a two-colour image comes out split in the middle', () => {
    // 200×100 source: left half red, right half blue.
    const sw = 200;
    const sh = 100;
    const src = new Uint8Array(sw * sh * 4);
    for (let y = 0; y < sh; y++)
      for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        src[i] = x < 100 ? 255 : 0;
        src[i + 2] = x < 100 ? 0 : 255;
        src[i + 3] = 255;
      }
    const quad: Quad = [
      { x: 20, y: 10 },
      { x: 180, y: 5 },
      { x: 190, y: 95 },
      { x: 10, y: 90 },
    ];
    const out = warpPerspective(src, sw, sh, quad, 40, 20);
    const px = (x: number, y: number) => Array.from(out.slice((y * 40 + x) * 4, (y * 40 + x) * 4 + 4));
    expect(px(2, 10)).toEqual([255, 0, 0, 255]);
    expect(px(37, 10)).toEqual([0, 0, 255, 255]);
  });

  it('writes a bottom-up 24-bit BMP with padded rows', () => {
    // 3×2: top row red, bottom row blue.
    const rgba = new Uint8Array(3 * 2 * 4);
    for (let i = 0; i < 3; i++) rgba.set([255, 0, 0, 255], i * 4);
    for (let i = 3; i < 6; i++) rgba.set([0, 0, 255, 255], i * 4);
    const bmp = toBmp(rgba, 3, 2);
    const v = new DataView(bmp.buffer);
    expect(String.fromCharCode(bmp[0]!, bmp[1]!)).toBe('BM');
    expect(bmp.length).toBe(54 + 12 * 2); // 9 bytes a row, padded to 12
    expect([v.getInt32(18, true), v.getInt32(22, true), v.getUint16(28, true)]).toEqual([3, 2, 24]);
    expect(Array.from(bmp.slice(54, 57))).toEqual([255, 0, 0]); // first stored row = bottom (blue, as BGR)
    expect(Array.from(bmp.slice(66, 69))).toEqual([0, 0, 255]); // then the top (red)
  });
});

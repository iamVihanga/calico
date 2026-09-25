import type { NormalizedExtraction } from '@shared/extraction.ts';

import type { Book } from '@/features/books/types';

import {
  containedRect,
  dragBox,
  fieldOrder,
  findDuplicate,
  formFromExtraction,
  initialCropBox,
  isLowConfidence,
  MIN_CROP,
  viewRectToImage,
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

  it('drags corners and edges within the image and keeps a minimum size', () => {
    const bounds = { x: 0, y: 60, width: 360, height: 480 };
    const box = { x: 60, y: 120, width: 240, height: 360 };
    expect(dragBox(box, 'tl', -100, -100, bounds)).toEqual({ x: 0, y: 60, width: 300, height: 420 });
    expect(dragBox(box, 'r', -1000, 0, bounds).width).toBe(MIN_CROP);
    expect(dragBox(box, 'move', 500, 0, bounds).x).toBe(120); // clamped to the right edge
    expect(dragBox(box, 'b', 0, 30, bounds)).toEqual({ ...box, height: 390 });
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

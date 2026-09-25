import { normalizeExtraction } from '@shared/extraction.ts';
import { isBookEan, isValidIsbn10, toIsbn13 } from '@shared/isbn.ts';
import { colomboDayWindow } from '@shared/time.ts';

describe('ISBN (shared with the edge functions)', () => {
  it('validates ISBN-13 checksums and book prefixes', () => {
    expect(isBookEan('9780553393569')).toBe(true);
    expect(isBookEan('9780553393568')).toBe(false); // checksum
    expect(isBookEan('5012345678900')).toBe(false); // not a book EAN
  });

  it('converts ISBN-10 to ISBN-13', () => {
    expect(isValidIsbn10('0553393561')).toBe(true);
    expect(toIsbn13('0-553-39356-1')).toBe('9780553393569');
    expect(toIsbn13('155404295X')).toBe('9781554042951');
    expect(toIsbn13('12345')).toBeNull();
  });
});

describe('normalizeExtraction', () => {
  it('trims, NFC-normalises, clamps and zeroes confidence for empty fields', () => {
    const n = normalizeExtraction({
      script_on_cover: 'sinhala',
      title_native: '  මඩොල්   දූව ',
      title_romanized: 'Madol Doova',
      author_native: null,
      author_romanized: '',
      language: 'Sinhala',
      isbn: 'ISBN 978-0-553-39356-9',
      publisher: null,
      published_year: 1947,
      total_pages: 9999,
      confidence: { title_native: 0.9, author_romanized: 0.8, total_pages: 0.3, isbn: 0.7 },
    });
    expect(n.title_native).toBe('මඩොල් දූව');
    expect(n.author_romanized).toBeNull();
    expect(n.confidence.author_romanized).toBe(0);
    expect(n.isbn).toBe('9780553393569');
    expect(n.total_pages).toBe(5000);
    expect(n.confidence.total_pages).toBe(0.3);
    expect(n.confidence.publisher).toBe(0);
  });

  it('keeps ZWJ conjuncts', () => {
    const n = normalizeExtraction({
      script_on_cover: 'sinhala',
      title_native: null,
      title_romanized: 'x',
      author_native: 'මාර්ටින් වික්‍රමසිංහ',
      author_romanized: null,
      language: 'Sinhala',
      isbn: null,
      publisher: null,
      published_year: null,
      total_pages: null,
      confidence: {},
    });
    expect(n.author_native).toContain('‍');
  });
});

describe('colomboDayWindow', () => {
  it('starts at Colombo midnight (18:30 UTC the day before)', () => {
    expect(colomboDayWindow(new Date('2026-09-23T15:30:00Z'))).toEqual({
      since: '2026-09-22T18:30:00.000Z',
      resetsAt: '2026-09-23T18:30:00.000Z',
    });
    // 20:00 UTC is already the next day in Colombo
    expect(colomboDayWindow(new Date('2026-09-23T20:00:00Z')).since).toBe('2026-09-23T18:30:00.000Z');
  });
});

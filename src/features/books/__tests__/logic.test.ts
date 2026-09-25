import {
  clampPage,
  computePace,
  dailyPages,
  estimateFinish,
  leadAuthor,
  leadTitle,
  libraryTag,
  nextLogicalStatus,
  progressPct,
  sortBooks,
  spineHeight,
  spineWidth,
} from '../logic';
import type { Book } from '../types';

// Evening in Colombo (UTC+5:30) on the prototype's "today".
const NOW = new Date('2026-09-23T15:30:00Z');
const at = (iso: string) => new Date(`${iso}T15:30:00Z`);

describe('computePace', () => {
  it('needs at least three logs', () => {
    expect(computePace([], NOW)).toBeNull();
    expect(
      computePace(
        [
          { page: 0, loggedAt: at('2026-09-20') },
          { page: 50, loggedAt: at('2026-09-22') },
        ],
        NOW,
      ),
    ).toBeNull();
  });

  it('uses the first log in the window as the baseline when there is none before it', () => {
    const logs = [
      { page: 342, loggedAt: at('2026-09-21') },
      { page: 377, loggedAt: at('2026-09-22') },
      { page: 412, loggedAt: at('2026-09-23') },
    ];
    expect(computePace(logs, NOW)).toBe(35); // 70 pages over 2 days
  });

  it('uses the latest log before the window as the baseline across long gaps', () => {
    const logs = [
      { page: 0, loggedAt: at('2026-08-01') },
      { page: 100, loggedAt: at('2026-08-20') }, // baseline: latest before 9 Sep
      { page: 380, loggedAt: at('2026-09-20') },
      { page: 412, loggedAt: at('2026-09-23') },
    ];
    // 312 pages over 34 days
    expect(computePace(logs, NOW)).toBeCloseTo(312 / 34);
  });

  it('returns null when the latest log is behind the baseline (went backwards)', () => {
    const logs = [
      { page: 200, loggedAt: at('2026-09-15') },
      { page: 150, loggedAt: at('2026-09-20') },
      { page: 120, loggedAt: at('2026-09-23') },
    ];
    expect(computePace(logs, NOW)).toBeNull();
  });

  it('counts at least one day even for same-day logs', () => {
    const t = (h: number) => new Date(Date.UTC(2026, 8, 23, h));
    const logs = [
      { page: 10, loggedAt: t(3) },
      { page: 20, loggedAt: t(6) },
      { page: 40, loggedAt: t(9) },
    ];
    expect(computePace(logs, NOW)).toBe(30);
  });
});

describe('estimateFinish', () => {
  it('rounds the remaining days up', () => {
    expect(estimateFinish(412, 1138, 35, '2026-09-23')).toBe('2026-10-14'); // 726/35 = 20.7 → 21 days (brief: "Finish around Wed 14 Oct")
  });
  it('is null without a pace or when finished', () => {
    expect(estimateFinish(412, 1138, null, '2026-09-23')).toBeNull();
    expect(estimateFinish(1138, 1138, 35, '2026-09-23')).toBeNull();
  });
});

describe('dailyPages', () => {
  it('gives pages gained per Colombo day, oldest first', () => {
    const logs = [
      { page: 0, loggedAt: at('2026-09-20') },
      { page: 30, loggedAt: at('2026-09-21') },
      { page: 50, loggedAt: at('2026-09-23') },
    ];
    expect(dailyPages(logs, NOW, 4)).toEqual([0, 30, 0, 20]);
  });
  it('never goes negative', () => {
    const logs = [
      { page: 100, loggedAt: at('2026-09-22') },
      { page: 80, loggedAt: at('2026-09-23') },
    ];
    expect(dailyPages(logs, NOW, 2)).toEqual([0, 0]);
  });
});

const book = (over: Partial<Book>): Book => ({
  id: 'b',
  status: 'to_read',
  title: 'Madol Doova',
  titleNative: 'මඩොල් දූව',
  author: 'Martin Wickramasinghe',
  authorNative: 'මාර්ටින් වික්‍රමසිංහ',
  language: 'Sinhala',
  format: 'physical',
  ownership: 'owned',
  totalPages: 214,
  currentPage: 150,
  rating: null,
  note: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  coverPath: null,
  coverUrl: null,
  wishlistPriority: null,
  abandonReason: null,
  loan: null,
  ...over,
});

describe('titles and tags', () => {
  it('leads with the chosen script', () => {
    expect(leadTitle(book({}), 'si')).toEqual({ main: 'මඩොල් දූව', sub: 'Madol Doova' });
    expect(leadTitle(book({ titleNative: null }), 'si')).toEqual({ main: 'Madol Doova', sub: '' });
    expect(leadAuthor(book({}), 'si')).toBe('මාර්ටින් වික්‍රමසිංහ');
    expect(leadAuthor(book({}), 'en')).toBe('Martin Wickramasinghe');
  });

  it('tags loans, ratings and progress like the prototype', () => {
    const loan = {
      id: 'l',
      direction: 'borrowed' as const,
      party: 'CPL',
      borrowedOn: '2026-09-09',
      dueStamps: [],
      renewalCount: 0,
    };
    expect(libraryTag(book({ loan: { ...loan, dueOn: '2026-09-26' } }), '2026-09-23')).toEqual({
      text: 'Due 26 SEP',
      tone: 'muted',
    });
    expect(libraryTag(book({ loan: { ...loan, dueOn: '2026-09-21' } }), '2026-09-23')).toEqual({
      text: 'Overdue',
      tone: 'danger',
    });
    expect(libraryTag(book({ status: 'read', rating: 5 }), '2026-09-23').text).toBe('★★★★★');
    expect(libraryTag(book({ status: 'reading' }), '2026-09-23')).toEqual({ text: '150/214', tone: 'accent' });
    expect(libraryTag(book({ status: 'wishlist' }), '2026-09-23').text).toBe('Wishlist');
  });
});

describe('misc', () => {
  it('next logical status', () => {
    expect(nextLogicalStatus('to_read')).toBe('reading');
    expect(nextLogicalStatus('reading')).toBe('read');
  });
  it('progress and clamping', () => {
    expect(progressPct(412, 1138)).toBe(36);
    expect(progressPct(10, null)).toBe(0);
    expect(clampPage(2000, 1138)).toBe(1138);
    expect(clampPage(-3, 1138)).toBe(0);
  });
  it('spines', () => {
    expect(spineWidth(100)).toBe(18);
    expect(spineWidth(1200)).toBe(44);
    expect(spineWidth(5000)).toBe(44);
    const h = spineHeight('madol');
    expect(h).toBeGreaterThanOrEqual(150);
    expect(h).toBeLessThanOrEqual(190);
    expect(spineHeight('madol')).toBe(h);
  });
  it('sorts by title in the lead script', () => {
    const a = book({ id: 'a', title: 'IT', titleNative: null });
    const b = book({ id: 'b', title: 'Gamperaliya', titleNative: 'ගම්පෙරළිය' });
    expect(sortBooks([a, b], 'title', 'en').map((x) => x.id)).toEqual(['b', 'a']);
    expect(sortBooks([b, a], 'title', 'si').map((x) => x.id)).toEqual(['a', 'b']); // Latin sorts before Sinhala
  });
});

import { toYearStats } from '../api';
import { booksCsv, csvField, deletionCounts, exportFileName, goalPct, languageSegments } from '../logic';

describe('export', () => {
  it('names files by date', () => {
    expect(exportFileName('2026-09-26', 'json')).toBe('calico-export-2026-09-26.json');
    expect(exportFileName('2026-09-26', 'csv', 'books')).toBe('calico-books-2026-09-26.csv');
  });

  it('escapes CSV fields', () => {
    expect(csvField('IT')).toBe('IT');
    expect(csvField('Fire & Blood, Vol 1')).toBe('"Fire & Blood, Vol 1"');
    expect(csvField('He said "hi"')).toBe('"He said ""hi"""');
    expect(csvField('two\nlines')).toBe('"two\nlines"');
    expect(csvField(null)).toBe('');
    expect(csvField(412)).toBe('412');
  });

  it('flattens books, keeps Sinhala, skips movies and shows', () => {
    const csv = booksCsv({
      items: [
        {
          id: 'a',
          kind: 'book',
          title: 'Madol Doova',
          title_native: 'මඩොල් දූව',
          status: 'reading',
          note: 'Great, so far',
        },
        { id: 'm', kind: 'movie', title: 'IT', status: 'watched' },
      ],
      books: [
        { item_id: 'a', author: 'Martin Wickramasinghe', total_pages: 214, current_page: 150, language: 'Sinhala' },
      ],
    });
    const lines = csv.replace('﻿', '').trim().split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]!.split(',')[0]).toBe('title');
    expect(lines[1]).toBe(
      'Madol Doova,මඩොල් දූව,Martin Wickramasinghe,,reading,Sinhala,,,214,150,,,,,,,"Great, so far"',
    );
    expect(csv.startsWith('﻿')).toBe(true);
  });
});

describe('year', () => {
  it('maps year_stats', () => {
    const y = toYearStats(
      {
        books_finished: 17,
        goal: 24,
        pages_read: 5412,
        language_split: { Sinhala: 10, English: 7 },
        episodes_watched: 96,
        longest_book: { item_id: 'it', title: 'IT', pages: 1138 },
        most_rewatched: null,
      },
      2026,
    );
    expect(y).toMatchObject({ booksFinished: 17, goal: 24, pagesRead: 5412, episodesWatched: 96, moviesWatched: 0 });
    expect(y.longestBook).toEqual({ itemId: 'it', title: 'IT', pages: 1138 });
    expect(y.mostRewatched).toBeNull();
  });

  it('goal percent and language segments', () => {
    expect(goalPct(17, 24)).toBe(71);
    expect(goalPct(30, 24)).toBe(100);
    expect(goalPct(3, null)).toBeNull();
    expect(languageSegments({ English: 7, Sinhala: 10, Tamil: 0 })).toEqual([
      { language: 'Sinhala', n: 10, share: 10 / 17 },
      { language: 'English', n: 7, share: 7 / 17 },
    ]);
  });

  it('counts what deletion removes', () => {
    expect(deletionCounts([{ kind: 'book' }, { kind: 'book' }, { kind: 'movie' }, { kind: 'show' }])).toEqual({
      book: 2,
      movie: 1,
      show: 1,
    });
  });
});

describe('reminder time', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { fmtTime, parseTime, toTime } = require('../logic') as typeof import('../logic');
  it('formats and round-trips Postgres times', () => {
    expect(fmtTime('09:00:00')).toBe('9:00 AM');
    expect(fmtTime('00:05:00')).toBe('12:05 AM');
    expect(fmtTime('12:30')).toBe('12:30 PM');
    expect(fmtTime('18:45:00')).toBe('6:45 PM');
    expect(toTime(7, 5)).toBe('07:05:00');
    expect(parseTime('21:15:00')).toEqual({ h: 21, m: 15 });
  });
});

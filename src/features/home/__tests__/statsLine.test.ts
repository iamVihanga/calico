import { copy } from '@/i18n/en';

/** Home's line shows exactly the chosen stat (Settings → Home stat), even at 0. */
describe('Home stat line', () => {
  const s = { booksThisMonth: 5, pagesThisMonth: 1240 };
  it('books or pages, as chosen', () => {
    expect(copy.year.statsLine(s, 'books')).toBe('5 books read this month');
    expect(copy.year.statsLine({ ...s, booksThisMonth: 1 }, 'books')).toBe('1 book read this month');
    expect(copy.year.statsLine(s, 'pages')).toBe('1,240 pages read this month');
  });
  it('never swaps to the other stat at 0', () => {
    expect(copy.year.statsLine({ booksThisMonth: 0, pagesThisMonth: 245 }, 'books')).toBe(
      'No books read this month yet',
    );
    expect(copy.year.statsLine({ booksThisMonth: 3, pagesThisMonth: 0 }, 'pages')).toBe('No pages read this month yet');
  });
});

import { storage, storageKeys } from '@/lib/storage';

import { groupItems, groupRows } from '../logic';
import { DEFAULT_PREFS, readLibraryPrefs, saveLibraryPrefs } from '../prefs';

const item = (
  id: string,
  over: Partial<{
    status: string;
    finishedAt: string | null;
    finishedPrecision: 'day' | 'month' | 'year' | null;
    createdAt: string;
  }> = {},
) => ({
  id,
  status: 'read',
  finishedAt: null as string | null,
  createdAt: '2026-01-10T00:00:00Z',
  ...over,
});

describe('library groups', () => {
  it('movies and shows on the Watchlist get their own section too', () => {
    const groups = groupItems([item('m', { status: 'watchlist' }), item('d', { status: 'dropped' })], 'finished');
    expect(groups.map((g) => [g.title, g.items.map((i) => i.id)])).toEqual([
      ['Not finished yet', ['d']],
      ['Watchlist', ['m']],
    ]);
  });

  it('by year finished: not finished, then the wishlist, then newest year first, then a while ago', () => {
    const groups = groupItems(
      [
        item('a', { finishedAt: '2024-03-09', finishedPrecision: 'day' }),
        item('b', { status: 'reading' }),
        item('c', { finishedAt: '2026-10-04', finishedPrecision: null }),
        item('d', { finishedAt: '2025-01-01', finishedPrecision: 'year' }),
        item('e', { finishedAt: '2024-01-01', finishedPrecision: 'year' }),
        item('f', { finishedAt: '2023-05-02' }), // cached before precision was stored: a day
        item('w', { status: 'wishlist' }),
      ],
      'finished',
    );
    expect(groups.map((g) => [g.title, g.items.map((i) => i.id)])).toEqual([
      ['Not finished yet', ['b']],
      ['Wishlist', ['w']],
      ['2025', ['d']],
      ['2024', ['a', 'e']],
      ['2023', ['f']],
      ['A while ago', ['c']],
    ]);
  });

  it('by year added, in Colombo time', () => {
    const groups = groupItems(
      [item('a', { createdAt: '2025-12-31T20:00:00Z' }), item('b', { createdAt: '2025-06-01T00:00:00Z' })],
      'added',
    );
    expect(groups.map((g) => [g.title, g.items.map((i) => i.id)])).toEqual([
      ['2026', ['a']], // 1:30 am on 1 Jan in Colombo
      ['2025', ['b']],
    ]);
  });

  it('rows: a header per group, then items three at a time', () => {
    const rows = groupRows([{ key: '2025', title: '2025', items: ['a', 'b', 'c', 'd'].map((id) => ({ id })) }], 3);
    expect(
      rows.map((r) => (r.type === 'header' ? `${r.title}:${r.count}` : r.items.map((i) => i.id).join(''))),
    ).toEqual(['2025:4', 'abc', 'd']);
  });
});

describe('library prefs', () => {
  const filters = { books: ['reading', 'read'], movies: ['watched'], shows: ['watching'] };
  it('survive a restart, and anything unknown falls back to the default', () => {
    saveLibraryPrefs({
      ...DEFAULT_PREFS,
      segment: 'shows',
      shows: { filter: 'watching', sort: 'finished', dir: 'asc', group: 'finished', view: 'list' },
    });
    expect(readLibraryPrefs(filters).shows).toEqual({
      filter: 'watching',
      sort: 'finished',
      dir: 'asc',
      group: 'finished',
      view: 'list',
    });
    expect(readLibraryPrefs(filters).segment).toBe('shows');
    storage.set(
      storageKeys.libraryPrefs,
      JSON.stringify({
        segment: 'podcasts',
        books: { filter: 'gone', sort: 'x', dir: 'sideways', group: 'genre', view: 'grid' },
      }),
    );
    expect(readLibraryPrefs(filters)).toEqual(DEFAULT_PREFS);
    // Saved before directions existed: the sort's own default (titles A→Z).
    storage.set(storageKeys.libraryPrefs, JSON.stringify({ books: { sort: 'title' } }));
    expect(readLibraryPrefs(filters).books.dir).toBe('asc');
    storage.set(storageKeys.libraryPrefs, '{not json');
    expect(readLibraryPrefs(filters)).toEqual(DEFAULT_PREFS);
  });
});

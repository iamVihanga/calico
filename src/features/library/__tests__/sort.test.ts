import { DEFAULT_DIR, type Sortable, sortItems } from '../sort';

const item = (id: string, over: Partial<Sortable> = {}): Sortable & { id: string } => ({
  id,
  title: id,
  rating: null,
  status: 'read',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  finishedAt: null,
  ...over,
});
const ids = (list: { id: string }[]) => list.map((i) => i.id);

describe('library sort', () => {
  it('each sort in both directions', () => {
    const list = [
      item('b', { createdAt: '2026-02-01', updatedAt: '2026-03-01' }),
      item('a', { createdAt: '2026-03-01', updatedAt: '2026-01-01' }),
      item('c', { createdAt: '2026-01-01', updatedAt: '2026-02-01' }),
    ];
    expect(ids(sortItems(list, 'title', 'asc'))).toEqual(['a', 'b', 'c']);
    expect(ids(sortItems(list, 'title', 'desc'))).toEqual(['c', 'b', 'a']);
    expect(ids(sortItems(list, 'added', 'desc'))).toEqual(['a', 'b', 'c']);
    expect(ids(sortItems(list, 'added', 'asc'))).toEqual(['c', 'b', 'a']);
    expect(ids(sortItems(list, 'updated', 'desc'))).toEqual(['b', 'c', 'a']);
    expect(ids(sortItems(list, 'updated', 'asc'))).toEqual(['a', 'c', 'b']);
  });

  it('rating: unrated last either way', () => {
    const list = [item('none'), item('low', { rating: 2 }), item('high', { rating: 4.5 })];
    expect(ids(sortItems(list, 'rating', 'desc'))).toEqual(['high', 'low', 'none']);
    expect(ids(sortItems(list, 'rating', 'asc'))).toEqual(['low', 'high', 'none']);
  });

  it('date finished: as the user gave it; undated then unfinished last', () => {
    const list = [
      item('reading', { status: 'reading' }),
      item('year', { finishedAt: '2024-01-01', finishedPrecision: 'year' }),
      item('undated', { finishedAt: '2026-10-05', finishedPrecision: null }),
      item('day', { finishedAt: '2024-03-09', finishedPrecision: 'day' }),
      item('jan', { finishedAt: '2024-01-15', finishedPrecision: 'day' }),
      item('month', { finishedAt: '2024-03-01', finishedPrecision: 'month' }),
      item('cached', { finishedAt: '2025-06-01' }), // before precision was stored: a day
      item('dropped', { status: 'abandoned', finishedAt: '2025-01-01' }),
    ];
    expect(ids(sortItems(list, 'finished', 'desc'))).toEqual([
      'cached',
      'day',
      'month',
      'jan',
      'year',
      'undated',
      'reading',
      'dropped',
    ]);
    expect(ids(sortItems(list, 'finished', 'asc'))).toEqual([
      'year',
      'jan',
      'month',
      'day',
      'cached',
      'undated',
      'reading',
      'dropped',
    ]);
  });

  it('same day: the more precise date counts as later', () => {
    const list = [
      item('y', { finishedAt: '2024-01-01', finishedPrecision: 'year' }),
      item('d', { finishedAt: '2024-01-01', finishedPrecision: 'day' }),
    ];
    expect(ids(sortItems(list, 'finished', 'desc'))).toEqual(['d', 'y']);
  });

  it('ties keep the previous order; defaults are newest / highest first, titles A→Z', () => {
    const list = [item('x', { rating: 3 }), item('y', { rating: 3 })];
    expect(ids(sortItems(list, 'rating', 'desc'))).toEqual(['x', 'y']);
    expect(ids(sortItems(list, 'rating', 'asc'))).toEqual(['x', 'y']);
    expect(DEFAULT_DIR).toEqual({ updated: 'desc', title: 'asc', rating: 'desc', added: 'desc', finished: 'desc' });
  });
});

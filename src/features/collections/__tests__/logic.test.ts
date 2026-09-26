import { kindCounts, seriesSuggestions } from '../logic';

describe('collections', () => {
  it('counts each media kind', () => {
    expect(kindCounts([{ kind: 'book' }, { kind: 'movie' }, { kind: 'movie' }, { kind: 'show' }])).toEqual({
      book: 1,
      movie: 2,
      show: 1,
    });
  });

  it('suggests the parts of a series you do not have yet, once, in release order', () => {
    const it2017 = { kind: 'movie' as const, tmdbCollection: { id: 477962, name: 'IT Collection' } };
    const parts = new Map([
      [
        477962,
        [
          { tmdbId: 474350, title: 'IT Chapter Two', year: 2019 },
          { tmdbId: 346364, title: 'IT', year: 2017 },
          { tmdbId: 1, title: 'IT: Prequel', year: 2016 },
        ],
      ],
    ]);
    const out = seriesSuggestions([it2017, it2017, { kind: 'book', tmdbCollection: null }], parts, new Set([346364]));
    expect(out.map((p) => p.title)).toEqual(['IT: Prequel', 'IT Chapter Two']);
    expect(seriesSuggestions([it2017], parts, new Set([346364, 474350, 1]))).toEqual([]);
  });
});

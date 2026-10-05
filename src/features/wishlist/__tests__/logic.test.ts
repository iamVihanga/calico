import { byPosition, isWanted, keyForMove, placesForNew, wishlistOrder } from '../logic';

const item = (id: string, createdAt = '2026-01-01T00:00:00Z') => ({ id, createdAt });

describe('wishlist order', () => {
  it('who is on it: wishlist books, watchlist movies and shows', () => {
    expect(isWanted({ kind: 'book', status: 'wishlist' })).toBe(true);
    expect(isWanted({ kind: 'book', status: 'to_read' })).toBe(false);
    expect(isWanted({ kind: 'movie', status: 'watchlist' })).toBe(true);
    expect(isWanted({ kind: 'show', status: 'watching' })).toBe(false);
  });

  it('placed items by position, then new ones oldest first (newest last)', () => {
    const rows = wishlistOrder(
      [item('new2', '2026-03-01T00:00:00Z'), item('b'), item('new1', '2026-02-01T00:00:00Z'), item('a')],
      [
        { itemId: 'a', position: 'a1' },
        { itemId: 'b', position: 'a0' },
        { itemId: 'gone', position: 'a2' }, // not on the wishlist any more: ignored
      ],
    );
    expect(rows.map((r) => [r.item.id, r.position])).toEqual([
      ['b', 'a0'],
      ['a', 'a1'],
      ['new1', null],
      ['new2', null],
    ]);
    const places = placesForNew(rows);
    expect(places.map((p) => p.itemId)).toEqual(['new1', 'new2']);
    expect([...places].sort(byPosition).map((p) => p.itemId)).toEqual(['new1', 'new2']);
    expect(places.every((p) => p.position > 'a1')).toBe(true);
    expect(placesForNew(rows.slice(0, 2))).toEqual([]);
  });

  it('a move within a filtered view lands between the visible neighbours', () => {
    // Full order a0 a1 a2 a3; the filter shows a0, a2, a3. Moving a3 up one (to index 1) lands between a0 and a2.
    const visible = [{ position: 'a0' }, { position: 'a2' }, { position: 'a3' }];
    const key = keyForMove(visible, 2, 1);
    expect(key > 'a0' && key < 'a2').toBe(true);
  });
});

import { appendKey, byPosition, keyForMove } from '../logic';

const list = (...keys: string[]) => keys.map((position) => ({ position }));

describe('fractional keys', () => {
  it('appends after the last item', () => {
    expect(appendKey([])).toBe('a0');
    expect(appendKey(list('a0', 'a1'))).toBe('a2');
    expect(appendKey(list('a9'))).toBe('aA'); // base-62 digits
  });

  it('moves an item between its new neighbours', () => {
    const l = list('a0', 'a1', 'a2', 'a3');
    const k = keyForMove(l, 3, 1); // a3 → between a0 and a1
    expect(k > 'a0' && k < 'a1').toBe(true);
    expect(keyForMove(l, 0, 3) > 'a3').toBe(true); // to the end
    expect(keyForMove(l, 3, 0) < 'a0').toBe(true); // to the top
  });

  it('keeps a stable order after 50 moves (plain string compare, like collate "C")', () => {
    let items = Array.from({ length: 50 }, (_, i) => ({ id: i, position: '' }));
    let prev: string | null = null;
    items = items.map((it) => {
      const position = appendKey(prev ? [{ position: prev }] : []);
      prev = position;
      return { ...it, position };
    });
    for (let n = 0; n < 50; n++) {
      const from = (n * 7) % items.length;
      const to = (n * 13) % items.length;
      const position = keyForMove(items, from, to);
      const moved = { ...items[from]!, position };
      items = [...items.filter((_, i) => i !== from), moved].sort(byPosition);
    }
    const keys = items.map((i) => i.position);
    expect(new Set(keys).size).toBe(50);
    expect([...keys].sort()).toEqual(keys);
  });
});

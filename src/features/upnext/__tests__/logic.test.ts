import { appendKey, byPosition, drawPick, keyForMove, pickReason, type QueueItem } from '../logic';

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

describe('pickReason', () => {
  const today = '2026-09-23';
  const q = (id: string, over: Partial<QueueItem> = {}): QueueItem => ({
    id,
    kind: 'book',
    pagesLeft: 300,
    runtimeMin: null,
    episodesLeft: null,
    progressPct: null,
    addedAt: '2026-09-11',
    ...over,
  });
  const top = [
    q('long', { pagesLeft: 700 }),
    q('movie', { kind: 'movie', runtimeMin: 169 }),
    q('show', { kind: 'show', episodesLeft: 8 }),
  ];

  it('a library book due within two weeks comes first', () => {
    const loan = { direction: 'borrowed' as const, party: 'Colombo Public Library', dueOn: '2026-09-26' };
    expect(pickReason(top[0]!, top, loan, today)).toBe('due back at Colombo Public Library Sat 26 Sep');
    expect(pickReason(top[0]!, top, { ...loan, dueOn: '2026-10-20' }, today)).not.toMatch(/due back/);
    expect(pickReason(top[0]!, top, { ...loan, direction: 'lent' }, today)).not.toMatch(/due back/);
  });

  it('the least effort in the top ten is "the shortest thing"', () => {
    // 169 min movie < 8 × 45 min of show < 700 × 1.5 min of book
    expect(pickReason(top[1]!, top, undefined, today)).toBe('the shortest thing in your queue');
  });

  it('a queue of equals has no "shortest"', () => {
    const same = [q('a'), q('b'), q('c')];
    expect(pickReason(same[0]!, same, undefined, today)).toBe('queued 12 days ago');
  });

  it('otherwise progress, then how long it has waited', () => {
    expect(pickReason({ ...top[0]!, progressPct: 42 }, top, undefined, today)).toBe("you're already 42% in");
    expect(pickReason(top[2]!, top, undefined, today)).toBe('queued 12 days ago');
    expect(pickReason({ ...top[2]!, addedAt: today }, top, undefined, today)).toBe('queued today');
    expect(pickReason({ ...top[2]!, addedAt: '2026-09-22' }, top, undefined, today)).toBe('queued 1 day ago');
  });
});

describe('drawPick', () => {
  const top = ['a', 'b', 'c'].map((id) => ({ id }));
  it('skips what was already picked this session', () => {
    expect(drawPick(top, new Set(['a']), () => 0)!.id).toBe('b');
    expect(drawPick(top, new Set(['a', 'b']), () => 0.99)!.id).toBe('c');
  });
  it('starts over once everything was picked', () => {
    expect(drawPick(top, new Set(['a', 'b', 'c']), () => 0.5)!.id).toBe('b');
    expect(drawPick([], new Set(), () => 0)).toBeNull();
  });
});

describe('shake', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { shakeDetector } = require('../shake') as typeof import('../shake');
  it('needs two strong jolts within half a second', () => {
    const onShake = jest.fn();
    const feed = shakeDetector(onShake);
    feed({ x: 0, y: 0, z: 1 }, 0); // resting: 1g
    feed({ x: 2, y: 0, z: 0 }, 100);
    feed({ x: 0, y: 2.1, z: 0 }, 900); // too late: starts a new window
    expect(onShake).not.toHaveBeenCalled();
    feed({ x: 1.5, y: 1.5, z: 0 }, 1200);
    expect(onShake).toHaveBeenCalledTimes(1);
  });
});

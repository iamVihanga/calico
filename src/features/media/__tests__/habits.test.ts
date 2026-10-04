import {
  habitOf,
  hourGap,
  hourOf,
  inHabitWindow,
  type NudgeCandidate,
  orderWatching,
  planNudges,
  scoreAt,
  type Session,
} from '../habits';

/** A Colombo wall-clock time (UTC+5:30) as an ISO instant. */
const at = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00+05:30`).toISOString();
const days = (n: number, from = '2026-10-05') => {
  const d = new Date(`${from}T12:00:00+05:30`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
/** Ticks for a show on the `n` days before Monday 5 Oct 2026, at a time. */
const nightly = (itemId: string, hhmm: string, n: number, skip = 0): Session[] =>
  Array.from({ length: n }, (_, i) => ({ itemId, at: at(days(i + 1 + skip), hhmm) }));

const monday = (hhmm: string) => new Date(at('2026-10-05', hhmm));

describe('watch-time habits', () => {
  it('reads hours in Colombo and measures them on a 24-hour circle', () => {
    expect(hourOf(at('2026-10-05', '20:30'))).toBe(20.5);
    expect(hourGap(23, 1)).toBe(2);
    expect(hourGap(8, 20)).toBe(12);
  });

  it('evening and morning shows each lead at their own time', () => {
    const sessions = [...nightly('supernatural', '20:00', 10), ...nightly('ahs', '07:30', 10)];
    const shows = [{ id: 'ahs' }, { id: 'supernatural' }, { id: 'other' }];
    expect(orderWatching(shows, sessions, monday('20:15')).map((s) => s.id)).toEqual(['supernatural', 'ahs', 'other']);
    expect(orderWatching(shows, sessions, monday('07:45')).map((s) => s.id)).toEqual(['ahs', 'supernatural', 'other']);
  });

  it('keeps the usual order when nothing stands out at this hour', () => {
    const sessions = nightly('supernatural', '20:00', 10);
    const shows = [{ id: 'ahs' }, { id: 'supernatural' }];
    expect(orderWatching(shows, sessions, monday('13:00')).map((s) => s.id)).toEqual(['ahs', 'supernatural']);
    expect(orderWatching(shows, [], monday('20:00'))).toBe(shows);
  });

  it('recent ticks count more than old ones', () => {
    const recent = nightly('a', '20:00', 3);
    const old = nightly('b', '20:00', 3, 42); // six weeks earlier, same weekdays
    expect(scoreAt(recent, monday('20:00'))).toBeGreaterThan(scoreAt(old, monday('20:00')) * 3);
  });

  it('weekend ticks count less on a weekday', () => {
    const saturday = [{ itemId: 'a', at: at('2026-10-03', '20:00') }];
    const friday = [{ itemId: 'a', at: at('2026-10-02', '20:00') }];
    expect(scoreAt(friday, monday('20:00'))).toBeGreaterThan(scoreAt(saturday, monday('20:00')));
  });

  it('a habit needs four recent sessions gathered around one time', () => {
    expect(habitOf(nightly('a', '20:00', 3), monday('12:00'))).toBeNull();
    const h = habitOf(nightly('a', '20:00', 6), monday('12:00'))!;
    expect(h.hour).toBeCloseTo(20, 5);
    expect(h.strength).toBeCloseTo(1, 5);
    expect(inHabitWindow(h, monday('19:00'))).toBe(true);
    expect(inHabitWindow(h, monday('17:00'))).toBe(false);
    // Scattered over the day: no habit.
    const scattered = ['07:00', '12:00', '17:00', '22:00', '03:00'].map((t, i) => ({
      itemId: 'a',
      at: at(days(i + 1), t),
    }));
    expect(habitOf(scattered, monday('12:00'))).toBeNull();
    // Around midnight still works (23:30 and 00:30 average to midnight).
    const late = [...nightly('a', '23:30', 3), ...nightly('a', '00:30', 3)];
    expect(hourGap(habitOf(late, monday('12:00'))!.hour, 0)).toBeLessThan(0.1);
  });
});

describe('nudges', () => {
  const candidate = (over: Partial<NudgeCandidate> = {}): NudgeCandidate => ({
    itemId: 'supernatural',
    title: 'Supernatural',
    next: { season: 5, episode: 3, name: 'Good God, Y’All' },
    habit: { hour: 20, strength: 0.9, sessions: 8 },
    watchedOn: new Set(),
    ...over,
  });

  it('today and tomorrow, ten minutes before the usual time', () => {
    const n = planNudges([candidate()], monday('12:00'));
    expect(n.map((x) => [x.id, x.minute])).toEqual([
      ['habit:2026-10-05', 19 * 60 + 50],
      ['habit:2026-10-06', 19 * 60 + 50],
    ]);
  });

  it('only tomorrow when today is past or already watched', () => {
    expect(planNudges([candidate()], monday('21:00')).map((x) => x.date)).toEqual(['2026-10-06']);
    const watched = candidate({ watchedOn: new Set(['2026-10-05']) });
    expect(planNudges([watched], monday('12:00')).map((x) => x.date)).toEqual(['2026-10-06']);
  });

  it('one a day: the strongest habit wins; none in the quiet hours', () => {
    const weak = candidate({ itemId: 'ahs', title: 'AHS', habit: { hour: 7.5, strength: 0.7, sessions: 4 } });
    expect(new Set(planNudges([weak, candidate()], monday('06:00')).map((x) => x.itemId))).toEqual(
      new Set(['supernatural']),
    );
    expect(planNudges([candidate({ habit: { hour: 23.5, strength: 1, sessions: 9 } })], monday('12:00'))).toEqual([]);
    expect(planNudges([], monday('12:00'))).toEqual([]);
  });
});

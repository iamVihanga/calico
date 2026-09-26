import type { Episode } from '../types';
import {
  airedIn,
  epKey,
  finishedShow,
  fmtRuntime,
  franchiseOthers,
  nextEpisode,
  progressOf,
  seasonsOf,
} from '../logic';

const ep = (season: number, episode: number, name: string, airDate: string | null): Episode => ({
  season,
  episode,
  name,
  airDate,
  stillPath: null,
  voteAverage: null,
  runtimeMin: null,
});
const today = '2026-09-23';
const w = (...keys: [number, number][]) => new Set(keys.map(([s, e]) => epKey(s, e)));

// Same fixture as supabase/tests/rpc.test.sql ("shows: mark_episodes, show_progress").
const hotd = [
  ep(0, 1, 'Special', '2022-08-01'),
  ep(1, 1, 'The Heirs of the Dragon', '2022-08-21'),
  ep(1, 2, 'The Rogue Prince', '2022-08-28'),
  ep(2, 1, 'A Son for a Son', '2024-06-16'),
  ep(2, 2, 'Rhaenyra the Cruel', '2026-10-23'), // airs after today
  ep(3, 1, 'TBA', null), // no date yet
];

describe('nextEpisode mirrors show_progress', () => {
  it('skips specials by default', () => {
    expect(nextEpisode(hotd, w(), today, false)).toMatchObject({ season: 1, episode: 1 });
  });

  it('counts specials when included', () => {
    expect(nextEpisode(hotd, w(), today, true)).toMatchObject({ season: 0, episode: 1 });
  });

  it('never picks unaired or undated episodes; caught up when every aired one is watched', () => {
    const p = progressOf(hotd, w([1, 1], [1, 2], [2, 1]), today, false);
    expect(p).toMatchObject({ aired: 3, watched: 3, total: 5, next: null, caughtUp: true });
  });

  // Same fixture as supabase/tests/media.test.sql (out of order).
  it('takes the earliest unwatched aired episode when later ones are watched', () => {
    const severance = [
      ep(1, 1, 'Good News About Hell', '2022-02-18'),
      ep(1, 2, 'Half Loop', '2022-02-18'),
      ep(1, 3, 'In Perpetuity', '2022-02-25'),
      ep(2, 1, 'Hello, Ms. Cobel', '2025-01-17'),
    ];
    expect(nextEpisode(severance, w([1, 1], [1, 3]), today, false)).toMatchObject({
      season: 1,
      episode: 2,
      name: 'Half Loop',
    });
    expect(nextEpisode([...severance].reverse(), w([1, 1], [1, 2], [1, 3]), today, false)).toMatchObject({
      season: 2,
      episode: 1,
    });
  });
});

describe('seasons', () => {
  it('groups in order and hides specials unless included', () => {
    expect(seasonsOf([...hotd].reverse(), false).map((s) => [s.n, s.episodes.map((e) => e.episode)])).toEqual([
      [1, [1, 2]],
      [2, [1, 2]],
      [3, [1]],
    ]);
    expect(seasonsOf(hotd, true)[0]!.n).toBe(0);
  });
  it('holding a season marks aired episodes only (like mark_season)', () => {
    expect(airedIn(seasonsOf(hotd, false)[1]!, today)).toEqual([1]);
  });
});

describe('finished show prompt', () => {
  const done = { aired: 10, watched: 10, total: 10, caughtUp: true };
  it('asks only for ended shows that are fully watched and not marked yet', () => {
    expect(finishedShow('Ended', 'watching', done)).toBe(true);
    expect(finishedShow('Canceled', 'watching', done)).toBe(true);
    expect(finishedShow('Returning Series', 'watching', done)).toBe(false);
    expect(finishedShow('Ended', 'watched', done)).toBe(false);
    expect(finishedShow('Ended', 'watching', { ...done, watched: 9, caughtUp: false })).toBe(false);
  });
});

describe('formatting', () => {
  it('formats runtimes like the prototype', () => {
    expect(fmtRuntime(135)).toBe('2h 15m');
    expect(fmtRuntime(45)).toBe('45m');
    expect(fmtRuntime(null)).toBeNull();
  });
  it('offers the other films of a series only', () => {
    const parts = [{ tmdbId: 1 }, { tmdbId: 2 }, { tmdbId: 3 }];
    expect(franchiseOthers(parts, new Set([3]), 1)).toEqual([{ tmdbId: 2 }]);
  });
});

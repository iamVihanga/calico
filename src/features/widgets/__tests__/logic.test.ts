import type { Book } from '@/features/books/types';
import type { Show, ShowProgress } from '@/features/media/types';

import { buildSnapshot, links, parseEpisodeParam, readFraction } from '../logic';

const today = '2026-10-04';
const book = (id: string, over: Partial<Book> = {}): Book => ({
  id,
  status: 'to_read',
  title: `Book ${id}`,
  titleNative: null,
  author: 'Someone',
  authorNative: null,
  language: 'English',
  format: 'physical',
  ownership: 'owned',
  totalPages: 200,
  currentPage: 0,
  rating: null,
  note: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
  coverPath: null,
  coverUrl: null,
  wishlistPriority: null,
  abandonReason: null,
  loan: null,
  ...over,
});
const show = (id: string, status: Show['status']): Show => ({
  id,
  kind: 'show',
  status,
  title: `Show ${id}`,
  titleNative: null,
  posterPath: null,
  backdropPath: '/back.jpg',
  rating: null,
  note: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '',
  updatedAt: '',
  tmdbId: 1,
  overview: null,
  year: 2024,
  network: null,
  tmdbStatus: null,
  numberOfSeasons: 2,
  nextAirDate: null,
  nextSeason: null,
  nextEpisode: null,
  lastSyncedAt: null,
});
const progress = (itemId: string, next: ShowProgress['next']): ShowProgress => ({
  itemId,
  aired: 10,
  watched: 4,
  total: 10,
  next,
  caughtUp: !next,
  nextAirDate: null,
  tmdbStatus: null,
});
const base = { books: [], shows: [], progress: [], lead: 'en' as const, coverUri: () => null };

describe('buildSnapshot', () => {
  it('nothing on the go: every widget is empty', () => {
    expect(buildSnapshot(base, today)).toEqual({ signedIn: true, reading: null, next: null, due: null });
  });

  it('the newest book being read, with its page and the cached cover photo', () => {
    const s = buildSnapshot(
      {
        ...base,
        books: [
          book('a', { status: 'reading', currentPage: 150, totalPages: 214, coverPath: 'u/a/front.jpg' }),
          book('b', { status: 'reading' }),
        ],
        coverUri: (b) => (b.id === 'a' ? 'https://signed/a' : null),
      },
      today,
    );
    expect(s.reading).toEqual({
      id: 'a',
      title: 'Book a',
      author: 'Someone',
      page: 150,
      total: 214,
      cover: 'https://signed/a',
    });
    expect(readFraction(s.reading!)).toBeCloseTo(150 / 214);
  });

  it('the Sinhala title when that script leads', () => {
    const s = buildSnapshot(
      { ...base, lead: 'si', books: [book('a', { status: 'reading', titleNative: 'මඩොල් දූව' })] },
      today,
    );
    expect(s.reading?.title).toBe('මඩොල් දූව');
  });

  it("next episode: a watching show's next (its still, else the backdrop); caught-up shows are skipped", () => {
    const s = buildSnapshot(
      {
        ...base,
        shows: [show('done', 'watching'), show('hotd', 'watching'), show('later', 'watchlist')],
        progress: [
          progress('done', null),
          progress('hotd', { season: 2, episode: 6, name: 'Smallfolk', stillPath: null }),
          progress('later', { season: 1, episode: 1, name: 'Pilot', stillPath: '/p.jpg' }),
        ],
      },
      today,
    );
    expect(s.next).toEqual({
      showId: 'hotd',
      title: 'Show hotd',
      season: 2,
      episode: 6,
      name: 'Smallfolk',
      still: 'https://image.tmdb.org/t/p/w780/back.jpg',
    });
  });

  it('next episode: a show put on hold is skipped', () => {
    const s = buildSnapshot(
      {
        ...base,
        shows: [{ ...show('held', 'watching'), onHold: true }, show('hotd', 'watching')],
        progress: [
          progress('held', { season: 1, episode: 2, name: 'Two', stillPath: null }),
          progress('hotd', { season: 2, episode: 6, name: 'Smallfolk', stillPath: null }),
        ],
      },
      today,
    );
    expect(s.next?.showId).toBe('hotd');
  });

  it('due soon: the first borrowed book due (overdue first)', () => {
    const loan = (dueOn: string) => ({
      id: `l-${dueOn}`,
      direction: 'borrowed' as const,
      party: 'Colombo Public Library',
      borrowedOn: '2026-09-20',
      dueOn,
      dueStamps: [dueOn],
      renewalCount: 0,
    });
    const s = buildSnapshot(
      {
        ...base,
        books: [book('soon', { loan: loan('2026-10-06') }), book('late', { loan: loan('2026-10-01') })],
      },
      today,
    );
    expect(s.due).toEqual({ id: 'late', title: 'Book late', party: 'Colombo Public Library', dueOn: '2026-10-01' });
  });
});

describe('links', () => {
  it('open the right screen and sheet', () => {
    expect(links.ruler('a')).toBe('calico://book/a?sheet=ruler');
    expect(links.renew('a')).toBe('calico://book/a?sheet=renew');
    expect(links.episode('s', 2, 6)).toBe('calico://show/s?episode=2-6');
    expect(parseEpisodeParam('2-6')).toEqual({ season: 2, episode: 6 });
    expect(parseEpisodeParam('x')).toBeNull();
    expect(parseEpisodeParam(undefined)).toBeNull();
  });
});

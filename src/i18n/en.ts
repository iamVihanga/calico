/**
 * All user-facing copy. Wording comes from the prototype (design/unpacked/template.html + app.js).
 * Functions take the dynamic parts.
 */
export const en = {
  common: {
    remove: 'Remove',
    clearSearch: 'Clear search',
    close: 'Close',
    undo: 'Undo',
    dismiss: 'Dismiss',
  },
  search: {
    placeholder: 'Search titles, authors, moods…',
  },
  offline: {
    banner: "Offline — changes sync when you're back.",
  },
  theme: {
    nightOn: 'Night reading on — warm paper, low light',
    nightOff: 'Night reading off',
  },
  tabs: {
    home: 'Home',
    library: 'Library',
    upNext: 'Up next',
    collections: 'Collections',
    add: 'Add',
    addHint: 'Hold to open the camera',
  },
  media: {
    book: 'Book',
    movie: 'Movie',
    show: 'TV show',
  },
  script: {
    englishFirst: 'A/අ',
    sinhalaFirst: 'අ/A',
    toggleLabel: 'Switch which script leads',
  },
  loan: {
    borrowed: 'Borrowed',
    due: 'Due',
    overdue: 'Overdue',
    dueLine: (days: number) =>
      days < 0
        ? `Overdue by ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'}`
        : days === 0
          ? 'Due today'
          : days === 1
            ? 'Due tomorrow'
            : `Due in ${days} days`,
  },
  episode: {
    a11y: (season: number, episode: number, name: string | undefined, state: string) =>
      `Season ${season}, episode ${episode}${name ? `, ${name}` : ''}, ${state}`,
    watched: 'watched',
    notWatched: 'not watched',
    nextUp: 'next up',
    notAired: 'not aired yet',
  },
  ticket: {
    viewing: 'Viewing',
  },
  kiri: {
    curled: 'Kiri curled up asleep on the shelf',
    paw: "Kiri's paw",
    stretch: 'Kiri stretching',
    asleep: 'Kiri asleep',
  },
  welcome: {
    eyebrow: 'a shelf that remembers',
    title: 'Calico',
    body: 'Books, films and shows — borrowed, read, watched and waiting, all in one place.',
  },
} as const;

export type Copy = typeof en;
export const copy = en;

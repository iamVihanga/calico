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
    google: 'Continue with Google',
    googleBadge: 'G',
    error: "Google sign-in didn't finish. Try again.",
    privacy: 'Privacy policy',
    terms: 'Terms',
    devSignIn: 'Dev: sign in as the seed user',
    // The three covers on the welcome panel.
    covers: { left: 'Madol Doova', right: 'Fire & Blood', centre: 'IT', centreAuthor: 'Stephen King' },
  },
  home: {
    greetingMorning: 'Good morning,',
    greetingAfternoon: 'Good afternoon,',
    greetingEvening: 'Good evening,',
    search: 'Search your library',
    nightOn: 'Turn on night reading',
    nightOff: 'Turn off night reading',
    settings: 'Settings',
  },
  headers: {
    libraryHand: 'everything you own',
    library: 'Library',
    upNextHand: 'one queue for everything',
    upNext: 'Up next',
    collectionsHand: 'your own groupings',
    collections: 'Collections',
  },
  settings: {
    title: 'Settings',
    back: 'Back',
    account: 'Account',
    signOut: 'Sign out',
    signOutHint: 'This phone forgets your library until you sign in again.',
    nightReading: 'Night reading',
    themeValue: { day: 'Off', night: 'On', system: 'System' },
    components: 'Component gallery (dev)',
  },
  errors: {
    saveFailed: "Couldn't save that. Try again.",
    notYet: 'Not built yet — coming in a later phase.',
  },
  add: {
    hand: 'something new for the shelf',
    title: 'What are you adding?',
    book: 'Book',
    movie: 'Movie',
    show: 'Show',
    scan: 'Scan barcode',
    scanHint: 'Last used',
    cover: 'Snap the cover',
    coverHint: 'AI reads it',
    type: 'Type it in',
  },
  dev: {
    shelfCheck: 'Shelf check (dev)',
    shelfLine: (books: number, movies: number, shows: number, loans: number) =>
      `${books} books · ${movies} movies · ${shows} shows · ${loans} open loans`,
    phase: (n: number) => `Arrives in phase ${n}.`,
  },
} as const;

export type Copy = typeof en;
export const copy = en;

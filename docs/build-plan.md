# Calico: Build Plan for Claude Code

Android app (Expo / React Native) for tracking books, library loans, movies and TV shows, with a Supabase backend and Gemini cover reading. This document is the engineering source of truth. The visual source of truth is the Claude Design prototype `design/Calico_Prototype.html`.

---

## 0. How to use this document (instructions for Claude Code)

1. Read this whole file before writing code. Then create `CLAUDE.md` in the repo root from section 4 and keep it updated.
2. Copy `Calico_Prototype.html` into `design/` in the repo. It is a bundled file; run the unpack script in Appendix A to get readable `design/unpacked/app.js` (prototype logic and sample data) and `design/unpacked/template.html` (all markup and inline styles). Use these to match spacing, copy and layout exactly. Also copy `calico-ux-prototype-brief.md` into `design/`; the user flows F1–F8, gesture map and motion notes referenced below come from it.
3. Build in the phases of section 13, in order. At the end of each phase: run `npm run typecheck`, `npm run lint`, `npm test`, fix everything, commit with message `phase N: <summary>`, and stop for review.
4. Never hard-code colors, font sizes, radii, spacing or durations in screens. Everything comes from `src/theme` (section 5).
5. All user-facing copy lives in `src/i18n/en.ts`. Copy the wording from the prototype, not from memory.
6. When this document and the prototype disagree about **how something looks or reads**, the prototype wins. When they disagree about **data or behavior**, this document wins. Section 2 lists the known differences already resolved.
7. Ask before adding a dependency that isn't listed in section 3.

---

## 1. Scope

**In scope for v1 (Android only):**

- Google sign-in (Supabase Auth, native ID-token flow).
- Books: add by barcode, by cover photo with Gemini extraction, or manually; statuses Wishlist, To read, Reading, Read, Abandoned; page logging with pace and estimated finish; re-reads; bilingual title and author; language; format; wishlist extras.
- Library loans: borrow date, due date, renewals, returned, overdue; local reminders 3 days and 1 day before due; "lent out" loans.
- Movies from TMDB: statuses Watchlist, Watched, Dropped; viewings log (rewatch count derived), rating and note per viewing; franchise suggestions.
- TV shows from TMDB: statuses Watchlist, Watching, Watched, Dropped; season and episode grid; next episode; caught-up and next air date; daily refresh.
- Collections mixing all three media types.
- Up next queue mixing all three, drag to reorder, Pick for me from the top 10.
- Global search in both scripts, Your year stats, settings, night reading theme, data export, account deletion, offline reads and queued writes.

**Out of scope for v1** (present in the design system UI kit but not in the prototype flows; do not build): `FriendsScreen`, `ReaderScreen`, `QuoteCard`, `StreakRing`, `ActivityRow` social feed. iOS build, Goodreads import, Sinhala UI language, new-episode push notifications.

---

## 2. Prototype-to-production decisions

These resolve places where the prototype is simplified or where real data sources differ.

| Prototype shows | Production behavior |
|---|---|
| Episode rows show "IMDb 7.9" | TMDB does not provide IMDb ratings. Show TMDB's `vote_average` with the label "TMDB". Keep the same layout slot. |
| Crop screen with four corner handles | v1 implements an axis-aligned crop box (drag corners and edges) plus rotate. Perspective correction and auto edge detection are deferred. |
| Pick for me reason lines are hard-coded | Reasons are computed (section 11.8). |
| Cover art for items without photos uses a hashed palette (`coverFor` in prototype) | Keep this as `GeneratedCover` for books without a photo, and as a loading/placeholder for TMDB posters. |
| Night reading toggle on Home | Stored in `profiles.theme` (`day` or `night`) and mirrored in MMKV for instant startup. Add a third option `system` in Settings. |
| Demo buttons on Review screen ("demo: duplicate notice", "demo: AI error", "demo: daily limit") | Remove. These states are triggered by real conditions. |
| Notification preview sheet in Settings | Keep as a dev-only screen under `/dev/notifications`; real reminders use expo-notifications. |
| Status bar and phone frame | Not rendered; use the real Android system bars, edge-to-edge. |
| Uppercase labels (BORROWED, DUE, RECENT SEARCHES) | Keep them; they come from the design system's `label` type role (uppercase, tracking caps). |

---

## 3. Tech stack

Install every Expo-managed package with `npx expo install` so versions match the SDK.

| Area | Choice | Notes |
|---|---|---|
| Runtime | Expo SDK 57 (React Native 0.86, React 19.2), New Architecture | Create with `npx create-expo-app@latest`; make sure `expo` is 57.0.17 or later, which fixes a Hermes memory regression affecting Reanimated apps. Development builds only (`expo-dev-client`); Expo Go cannot run native Google sign-in. |
| Language | TypeScript, `strict: true` | No `any`; use generated DB types. |
| Routing | `expo-router` | Typed routes on. |
| Backend client | `@supabase/supabase-js` v2 + `@react-native-async-storage/async-storage` | Session persisted in AsyncStorage per the Supabase Expo guide. |
| Server state | `@tanstack/react-query` + `@tanstack/query-sync-storage-persister` + `react-native-mmkv` | Persisted cache and resumable offline mutations. |
| Connectivity | `@react-native-community/netinfo` | Feeds TanStack `onlineManager`. |
| UI state | `zustand` | Drag state, capture draft, pick session. |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | Shared zod schemas with edge functions. |
| Animation and gestures | `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` | All signature interactions. |
| Sheets | `@gorhom/bottom-sheet` | Wrapped by the design-system `Sheet`. |
| Lists | `@shopify/flash-list` | Library, search, episode lists. |
| Reorder | `react-native-draggable-flatlist` | Up next and collection custom order. |
| Images | `expo-image` | Disk cache; `cacheKey` set to storage path. |
| Camera and barcodes | `expo-camera` (`CameraView`, EAN-13 scanning) | |
| Gallery | `expo-image-picker` | |
| Image processing | `expo-image-manipulator` | Crop, rotate, resize, compress. |
| Files and sharing | `expo-file-system`, `expo-sharing` | Offline capture drafts, data export. |
| Notifications | `expo-notifications` | Local scheduled reminders. |
| Haptics | `expo-haptics` | |
| Shake | `expo-sensors` (Accelerometer) | Pick for me shake. |
| Vector art | `react-native-svg` | Kiri, stamps, ticket notches, media shapes. |
| Fonts | `expo-font` + `@expo-google-fonts/playfair-display`, `@expo-google-fonts/caveat`, `@expo-google-fonts/nunito`, `@expo-google-fonts/noto-sans-sinhala` | |
| Icons | Material Symbols Outlined font via `createIconSet` from `@expo/vector-icons` | See 5.4. |
| Dates | `date-fns` + `@date-fns/tz` | Everything in `Asia/Colombo`. |
| Ordering keys | `fractional-indexing` | Up next and collection positions. |
| Google sign-in | `@react-native-google-signin/google-signin` | Config plugin in `app.config.ts`. |
| Crash reporting | `@sentry/react-native` | Phase 8. |
| Tests | `jest-expo`, `@testing-library/react-native`, Maestro for E2E, pgTAP via `supabase test db` | |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions (Deno), `pg_cron`, `pg_net`, `pg_trgm` | Supabase CLI for local dev and migrations. |
| AI | Gemini API via the `extract-book` edge function | Model set by `GEMINI_MODEL` secret (section 8.1). |

---

## 4. Repository layout and CLAUDE.md

### 4.1 Layout

```
calico/
├─ app/                          # expo-router routes (section 9)
├─ src/
│  ├─ theme/                     # tokens, themes, typography, ThemeProvider
│  ├─ components/
│  │  ├─ ds/                     # design-system primitives (section 6.1)
│  │  └─ calico/                 # Calico signature components (section 6.2)
│  ├─ features/
│  │  ├─ auth/  books/  loans/  movies/  shows/  collections/
│  │  ├─ upnext/  capture/  search/  stats/  profile/  export/
│  │  │   each: api.ts (queries + mutations), hooks.ts, logic.ts (pure), schema.ts (zod), types.ts
│  ├─ lib/                       # supabase, queryClient, persist, notifications, haptics,
│  │                             # dates, images, fractional, sinhala, env
│  ├─ i18n/en.ts                 # all copy
│  └─ types/database.ts          # generated by `supabase gen types`
├─ supabase/
│  ├─ migrations/                # SQL (section 7)
│  ├─ functions/
│  │  ├─ _shared/                # cors, auth, zod schemas, tmdb client
│  │  ├─ extract-book/  tmdb/  isbn-lookup/  refresh-shows/  delete-account/
│  ├─ tests/                     # pgTAP RLS tests
│  └─ seed.sql                   # prototype sample data for local dev
├─ design/
│  ├─ Calico_Prototype.html
│  └─ unpacked/                  # generated by Appendix A script (git-ignored)
├─ assets/ fonts/ icons/ images/
├─ .maestro/                     # E2E flows F1–F8
├─ app.config.ts  eas.json  CLAUDE.md
```

### 4.2 CLAUDE.md starter (create this file first)

```markdown
# Calico – working rules

## Commands
- `npx expo start --dev-client` – run app (requires a dev build: `eas build -p android --profile development`)
- `npm run typecheck` / `npm run lint` / `npm test`
- `supabase start` – local backend; `supabase db reset` – apply migrations + seed
- `supabase gen types typescript --local > src/types/database.ts` – after every migration
- `supabase functions serve` – run edge functions locally

## Rules
- Styles only from `src/theme` tokens via `useTheme()` / `makeStyles()`. No raw hex, px sizes or ms durations in screens.
- Text only through `<Txt>` (handles Sinhala font + line height). Never use bare `<Text>`.
- Copy only from `src/i18n/en.ts`.
- Multi-table writes go through Postgres RPCs (atomic, replayable offline). Single-row writes may use table APIs.
- Client generates UUIDs for new rows (`crypto.randomUUID()`), so offline creates are idempotent.
- Dates: store `date` columns as local Colombo dates (`yyyy-MM-dd`) computed on the client; timestamps as UTC.
- Every mutation has a `mutationKey` and is registered in `src/lib/mutations.ts` via `setMutationDefaults`, so paused offline mutations resume after restart.
- Pure logic (pace, next episode, pick reasons, fractional keys, ISBN validation) lives in `features/*/logic.ts` with unit tests.
- Every gesture has a visible button alternative. Respect reduced motion (`useReducedMotion`).
- Minimum touch target 48dp (use `hitSlop` when the visual is smaller).
- Match the prototype in `design/unpacked/` for layout and copy.
```

---
## 5. Design system implementation

The prototype ships a full design system ("CalicoDesignSystem") as CSS custom properties and 23 web React components. Port the tokens exactly, then rebuild the components natively. The web component source is in `design/unpacked/ds.js` after running Appendix A; port props and variants one-to-one.

### 5.1 Tokens (`src/theme/tokens.ts`)

These values are extracted from the prototype. Do not change them.

```ts
export const palette = {
  cream: '#FBF6EE', crumpet: '#F5E2CE', biscuit: '#DFBC94', honeycomb: '#E5A657',
  marmalade: '#EC6426', paprika: '#B53324', clay: '#A35A45', cocoa: '#6E4738',
  espresso: '#54332E', ink: '#1C1714', forest: '#1F3A32', fern: '#2F5145',
  sage: '#949A6B', slate: '#666B6E', petal: '#F2C4C7', blush: '#FAE3E1', white: '#FFFDF9',
} as const;

export const alpha = {
  ink04: 'rgba(28,23,20,0.04)', ink08: 'rgba(28,23,20,0.08)', ink12: 'rgba(28,23,20,0.12)',
  ink24: 'rgba(28,23,20,0.24)', ink56: 'rgba(28,23,20,0.56)',
  cream16: 'rgba(251,246,238,0.16)', cream72: 'rgba(251,246,238,0.72)',
} as const;

export const space = { 0: 0, 1: 2, 2: 4, 3: 8, 4: 12, 5: 16, 6: 20, 7: 24, 8: 32, 9: 40, 10: 48, 11: 64, 12: 80 } as const;
export const layout = {
  gutterScreen: 20, gapStackTight: 8, gapStack: 12, gapSection: 32, padCard: 16, padCardLg: 20,
  padControlY: 14, padControlX: 20, hitMin: 48 /* prototype says 44; Android needs 48 */, shelfGap: 14, bottomNavHeight: 72,
} as const;

export const radius = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, '2xl': 36, pill: 999,
  // --radius-cover: 4px 12px 12px 4px (spine side tighter)
  cover: { topLeft: 4, topRight: 12, bottomRight: 12, bottomLeft: 4 },
} as const;

export const size = { '3xs': 11, '2xs': 12, xs: 13, sm: 15, md: 17, lg: 20, xl: 24, '2xl': 30, '3xl': 38, '4xl': 48, '5xl': 64, '6xl': 84 } as const;
export const leading = { tight: 1.04, snug: 1.16, normal: 1.45, relaxed: 1.6, reader: 1.72 } as const;
export const tracking = { tight: -0.02, normal: 0, wide: 0.04, caps: 0.12 } as const; // em; convert: em * fontSize

// RN (New Architecture) supports the CSS boxShadow string syntax on Android.
export const shadow = {
  none: 'none',
  xs: '0 1px 2px rgba(84,51,46,0.06)',
  sm: '0 2px 8px rgba(84,51,46,0.08)',
  md: '0 6px 18px rgba(84,51,46,0.10)',
  lg: '0 14px 34px rgba(84,51,46,0.14)',
  sheet: '0 -10px 40px rgba(84,51,46,0.16)',
  cover: '0 6px 14px rgba(84,51,46,0.22)',
  press: 'inset 0 1px 2px rgba(84,51,46,0.14)',
  focus: '0 0 0 3px rgba(236,100,38,0.32)',
} as const;

export const motion = {
  duration: { instant: 90, fast: 160, base: 240, slow: 420, page: 520 },
  easing: { // use with Easing.bezier(...) in Reanimated
    cozy: [0.32, 0.72, 0.28, 1], out: [0.16, 0.84, 0.34, 1],
    inOut: [0.62, 0.04, 0.34, 1], purr: [0.34, 1.42, 0.48, 1],
  },
  pressScale: 0.97, liftHover: -2,
} as const;
```

### 5.2 Semantic themes (`src/theme/themes.ts`)

Two themes: `day` (default) and `night` (the prototype's "night reading", forest-green paper). Screens only ever read semantic keys.

```ts
export const day = {
  surfacePage: palette.cream, surfacePageWarm: palette.crumpet, surfaceCard: palette.white,
  surfaceSunk: '#F3EADD', surfaceInverse: palette.forest, surfaceInverseRaised: palette.fern,
  surfaceInk: palette.ink, surfaceAccent: palette.marmalade, surfaceAccentSoft: '#FBE0CE',
  surfaceQuiet: '#EFE7DA', surfaceScrim: alpha.ink56,
  textPrimary: palette.ink, textSecondary: palette.cocoa, textMuted: '#8A7565',
  textInverse: palette.cream, textInverseMuted: '#C3CFC6', textAccent: palette.marmalade, textOnAccent: '#2A1206',
  borderHairline: alpha.ink08, borderSoft: '#E7DACA', borderStrong: palette.biscuit,
  borderInk: palette.ink, borderInverse: 'rgba(251,246,238,0.18)',
  accentPrimary: palette.marmalade, accentPrimaryPress: '#D2541B', accentSecondary: palette.honeycomb,
  accentTertiary: palette.forest, accentQuiet: palette.sage, accentPink: palette.petal,
  statusSuccess: '#4F7A5C', statusSuccessSoft: '#DCE8DC', statusWarning: palette.honeycomb, statusWarningSoft: '#FBEBD3',
  statusDanger: palette.paprika, statusDangerSoft: '#F7DDD7', statusInfo: palette.slate, statusInfoSoft: '#E6E7E5',
  cover: [palette.marmalade, palette.forest, palette.petal, palette.ink, palette.biscuit, palette.sage],
  desk1: '#EFE2D0', desk2: '#E0CFB8', inkOnWarm: palette.espresso, fleck: alpha.ink04,
  panel1: palette.fern, panel2: palette.forest,
  ctaBg: palette.ink, ctaFg: palette.cream, ctaAccent: palette.honeycomb,
  statusBarStyle: 'dark' as 'dark' | 'light',
};

export const night: typeof day = {
  ...day,
  surfacePage: '#0F1A16', surfacePageWarm: '#17271F', surfaceCard: '#16251F', surfaceSunk: '#0A120F',
  surfaceQuiet: '#1C2F27', surfaceAccentSoft: '#24382E',
  textPrimary: '#EDF2EC', textSecondary: '#BFCFC5', textMuted: '#8DA298', textOnAccent: palette.ink,
  borderSoft: '#22352D', borderHairline: 'rgba(230,240,233,0.10)', borderStrong: '#34544A',
  accentQuiet: palette.sage, statusInfoSoft: '#1D2E29',
  statusWarningSoft: '#2C2A1C', statusSuccessSoft: '#17291D', statusDangerSoft: '#2E1D1A',
  desk1: '#1B2F28', desk2: '#0A120F', inkOnWarm: '#EDF2EC', fleck: 'rgba(230,240,233,0.05)',
  panel1: '#3A6153', panel2: '#244137',
  ctaBg: palette.cream, ctaFg: palette.espresso, ctaAccent: '#D2541B',
  statusBarStyle: 'light',
};
export type Theme = typeof day;
```

`ThemeProvider` reads `profiles.theme` (`day` | `night` | `system`), mirrors it in MMKV key `theme` for flash-free startup, sets the Android navigation bar color and status bar style, and cross-fades on change (`motion.duration.slow`). Toggling from Home shows the toast "Night reading on — warm paper, low light" (copy from prototype).

### 5.3 Typography (`src/theme/typography.ts` and `<Txt>`)

Font families loaded with `expo-font` before hiding the splash screen:

| Family key | Package / weights | Role |
|---|---|---|
| `display` | Playfair Display 700, 900 | Hero, titles, section headings, big numbers (page ruler, stats) |
| `hand` | Caveat 700 | Handwritten accents: eyebrow lines ("everything you own", "one queue for everything", "can't decide?"), hand buttons |
| `ui` | Nunito 300, 400, 600, 700, 900 | Body, labels, buttons, inputs |
| `sinhala` | Noto Sans Sinhala 400, 600, 700 | Any text run containing Sinhala |
| `icons` | Material Symbols Outlined | Icons (5.4) |

Type roles (port exactly):

| Role | Family | Size | Weight | Line height | Other |
|---|---|---|---|---|---|
| `hero` | display | 48 | 700 | 1.04 | tracking tight |
| `title` | display | 30 | 700 | 1.16 | |
| `section` | display | 20 | 700 | 1.16 | |
| `accent` | hand | 30 | 700 | 1.16 | |
| `body` | ui | 15 | 400 | 1.6 | |
| `bodyStrong` | ui | 15 | 700 | 1.6 | |
| `label` | ui | 12 | 700 | 1.45 | uppercase, letterSpacing 0.12em (= 1.44) |
| `caption` | ui | 13 | 600 | 1.45 | |
| `reader` | display | 17 | 400 | 1.72 | notes and long text |
| `numeric` | display | varies | 700 | 1.04 | `fontVariant: ['tabular-nums']` where supported |

**`<Txt>` component rules** (`src/components/ds/Txt.tsx`):

- Props: `role`, `color` (semantic key), `numberOfLines`, `align`, `children`.
- If the string contains Sinhala (`/[\u0D80-\u0DFF]/`), switch `fontFamily` to the matching Noto Sans Sinhala weight and raise `lineHeight` to at least `1.5 × fontSize` (Sinhala vowel signs sit above and below the line). Handwritten and display roles also fall back to Noto Sans Sinhala Bold for Sinhala text.
- Mixed strings (for example "මඩොල් දූව is due in 3 days") are split into runs with nested `<Text>` so Latin keeps its family.
- Normalize all displayed and stored text to Unicode NFC (`s.normalize('NFC')`) in `src/lib/sinhala.ts`; Sinhala conjuncts with ZWJ (for example "වික්‍රම") must survive round trips.
- `allowFontScaling` on; test at 200% font scale.

### 5.4 Icons

The prototype uses Material Symbols Outlined ligature names (`home`, `grid_view`, `playlist_play`, `category`, `add`, `search`, `check`, `local_library`, `event_repeat`, `assignment_return`, `drag_indicator`, `arrow_upward`, `close`, `auto_awesome`, `travel_explore`, `photo_camera`, `history`, `cloud_off`, `dark_mode`, `light_mode`, `bolt`, `rotate_right`, `image`, `more_vert`, `arrow_back`, `arrow_forward`, `error`, and others).

- Add `MaterialSymbolsOutlined.ttf` (static, weight 400, fill 0) and its `codepoints` file from Google's material-design-icons repo into `assets/icons/`.
- `scripts/gen-icon-map.ts` greps the codebase for `<Icon name="...">` and writes a glyph map subset to `src/components/ds/iconGlyphs.json`.
- `Icon = createIconSet(glyphMap, 'MaterialSymbolsOutlined', require(...ttf))`. Type the `name` prop from the glyph map keys.

### 5.5 Styling helpers

- `useTheme()` returns `{ t: Theme, tokens, type }`.
- `makeStyles((t) => StyleSheet.create({...}))` memoizes per theme.
- `Pressable` wrapper `Press` applies `motion.pressScale` with Reanimated (`duration.instant`, `easing.out`) and the inset `shadow.press`.
- Android ripple is off; the press scale is the feedback, as in the prototype.

---

## 6. Components

### 6.1 Design-system primitives (`src/components/ds/`)

Port these from the prototype design system with the same prop names (drop web-only props like `href`, `onMouseEnter`; rename `onClick` to `onPress`).

| Component | Props (from prototype) | Native notes |
|---|---|---|
| `Avatar` | `name, src, size, ring, tone (accent, forest, sand, pink, honey, ink)` | Initials fallback ("DK") |
| `Badge` | `children, tone (accent, forest, sand default, pink, honey, ink), icon, caps` | |
| `Button` | `variant (primary default, accent, secondary, ghost, inverse), size (sm, md, lg), hand, block, icon, iconAfter, disabled` | `hand` switches to Caveat 24/30 |
| `Card` | `tone (paper, warm, quiet, forest, accent, ink), radius, shadow, pad` | |
| `IconButton` | `label, tone (quiet default, card, accent, ink, inverse), size, round, active` | `label` becomes `accessibilityLabel` |
| `Tag` | `children, selected, icon, onPress, onRemove` | Used for filter chips (with counts) and collection chips |
| `EmptyState` | `hand, title, body, art, action` | `art` takes a `Kiri` pose |
| `Sheet` | `open, title, hand, children, actions, onClose` | Built on `@gorhom/bottom-sheet` `BottomSheetModal`, dynamic sizing, backdrop `surfaceScrim`, back gesture closes |
| `Toast` | `message, hand, icon, tone, action` | Global host; sits 98dp above bottom on tab screens, 28dp elsewhere (prototype values); 4.2s |
| `Checkbox`, `Switch` | `label, description, checked, disabled, onChange` | |
| `Input` | `label, hint, value, placeholder, type, icon, error, disabled, multiline, rows, onChange` | Also used as `ConfidenceField` base |
| `SearchField` | `value, placeholder, icon, onChange, onClear` | |
| `Select` | `label, value, options, onChange` | Opens a `Sheet` list |
| `ScreenHeader` | `title, eyebrow, hand, leading, trailing, tone` | `hand` renders the Caveat eyebrow above the title |
| `SegmentedControl` | `items, value, onChange` | Books / Movies / Shows |
| `TabBar` | `items, value, onChange` | Custom tab bar for expo-router; center raised `CaptureButton` (tap: Add sheet, long-press: camera) |
| `ProgressBar` | `value, label, tone, height (8), showValue` | Animated width |
| `BookCover` | `title, author, cover, size, src, tilt` | Uses `GeneratedCover` when no `src`; `radius.cover`; `shadow.cover` |
| `BookCard` | `title, author, cover, src, progress, meta, badge, action, layout` | Continue reading card |
| `Txt`, `Icon`, `Press` | see 5.3–5.5 | |

Build a hidden dev route `app/dev/components.tsx` listing every component in every variant, in both themes. This is the visual check for Phase 0.

### 6.2 Calico signature components (`src/components/calico/`)

| Component | Purpose | Key implementation notes |
|---|---|---|
| `MediaShapeIcon` | Book / movie / show silhouette | SVG. Sizes from prototype `shape()`: book 12×16 with 4px spine, movie 18×13 ticket, show 18×12 radius 3 |
| `GeneratedCover` | Typographic cover when no image | Hash item id (prototype `coverFor`) to one of 6 cover color pairs; title in `display`, spine strip |
| `BilingualTitle` | Lead script + secondary line | Reads `leadScript` from profile; falls back when a script is missing |
| `ScriptToggle` | "අ/A" switch | Updates profile `lead_script` optimistically |
| `StatusRail` | Status track with Abandoned/Dropped branch | Variants by kind; tap a stop or drag the marker (Pan gesture snapping to stops) |
| `PageRuler` | Page scrubber | Section 11.2 |
| `PaceSparkline` | 14 daily bars | Pages per day from `page_logs` |
| `LoanSlip`, `DateStamp` | Library due-date slip with stamps | Section 11.4 |
| `TicketStub`, `TicketStack` | Movie viewings | Section 11.6 |
| `EpisodeGrid`, `SeasonRow`, `EpisodeSquare` | Show progress | Section 11.5 |
| `NextEpisodeCard`, `ContinueWatchingCard` | Mark next episode | Card slide-out/slide-in on mark |
| `UpNextRow`, `PickDivider` | Queue row and "Pick for me draws from the ten above" line | |
| `PickDeck` | Pick for me moment | Section 11.8 |
| `CollectionMosaic` | 2×2 patchwork | Missing patches use `surfaceQuiet` |
| `CollectionsTray`, `DragLayer` | Long-press drag to collect | Section 11.9 |
| `SpineShelf`, `SpineTile` | Library shelf view | Section 11.10 |
| `RatingStars` | Half-star display and input | Pan across stars, snaps to 0.5 |
| `ConfidenceField` | AI-filled field with ✦ and dotted "check" state | Dotted underline via `borderStyle: 'dashed'` bottom border |
| `CoverReadingAnimation` | "Reading the cover" moment | Cover shrinks to the top-left, one scan line passes over it, then form fields fill one at a time (120ms stagger) with each value lifting off the thumbnail. Status line cycles through the prototype copy: "Reading the cover", "Finding the author", "Writing the English title", "Checking the page count", "Almost there". |
| `Kiri` | Cat illustrations: curled, paw, stretch, asleep | SVG components; use the prototype's drawings as reference |
| `OfflineBanner` | "Offline — changes sync when you're back." with `cloud_off` | Driven by NetInfo |
| `DueSoonRow` | Horizontal slips on Home; overdue first | |

---
## 7. Database (Supabase Postgres)

### 7.1 Design principles

- One `items` table for all media, with detail tables per kind (`books`, `movies`, `shows`). Collections and Up next point at `items.id`, so they mix media types with one foreign key.
- Every user table carries `user_id` and is protected by RLS. Child tables use a composite foreign key `(item_id, user_id) → items(id, user_id)` so a row can never attach to another user's item.
- Multi-table writes are `security invoker` RPCs: atomic, RLS-checked, and idempotent (client-supplied UUIDs), so offline replays are safe.
- `date` columns hold Colombo-local calendar dates. `local_today()` gives today's Colombo date on the server.
- Shared TMDB episode data lives in `tmdb_episodes` (no `user_id`), readable by signed-in users and writable only by edge functions.

### 7.2 Migration `0001_schema.sql`

```sql
create extension if not exists pg_trgm;
create extension if not exists pg_net;
create extension if not exists pg_cron;

create type media_kind as enum ('book', 'movie', 'show');
create type item_status as enum (
  'wishlist', 'to_read', 'reading', 'read', 'abandoned',   -- books
  'watchlist', 'watching', 'watched', 'dropped'            -- movies and shows
);
create type book_format as enum ('physical', 'ebook', 'audiobook');
create type loan_direction as enum ('borrowed', 'lent');

create or replace function public.local_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Colombo')::date $$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

-- Profiles -------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  lead_script text not null default 'en' check (lead_script in ('en', 'si')),
  theme text not null default 'day' check (theme in ('day', 'night', 'system')),
  reminder_time time not null default '09:00',
  remind_3d boolean not null default true,
  remind_1d boolean not null default true,
  default_loan_days int not null default 14 check (default_loan_days between 1 and 90),
  default_library text,
  reading_goal int check (reading_goal between 1 and 1000),
  include_specials boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Items ----------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind media_kind not null,
  status item_status not null,
  title text not null check (length(title) between 1 and 300),       -- English / romanized display title
  title_native text check (length(title_native) <= 300),             -- native script (Sinhala, Tamil...)
  cover_path text,          -- Supabase Storage path for user photos: {uid}/{item_id}/front.jpg
  cover_url text,           -- external cover (Open Library / Google Books)
  poster_path text,         -- TMDB poster path
  backdrop_path text,       -- TMDB backdrop path
  rating numeric(2,1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  note text check (length(note) <= 2000),
  started_at date,
  finished_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint status_matches_kind check (
    (kind = 'book'  and status in ('wishlist','to_read','reading','read','abandoned')) or
    (kind = 'movie' and status in ('watchlist','watched','dropped')) or
    (kind = 'show'  and status in ('watchlist','watching','watched','dropped'))
  )
);
create trigger items_updated before update on items for each row execute function set_updated_at();
create index items_user_kind_status on items (user_id, kind, status, updated_at desc);
create index items_title_trgm on items using gin (lower(title) gin_trgm_ops);
create index items_title_native_trgm on items using gin (title_native gin_trgm_ops);

-- Books ----------------------------------------------------------------
create table public.books (
  item_id uuid primary key,
  user_id uuid not null default auth.uid(),
  author text,
  author_native text,
  language text not null default 'English',
  isbn text check (isbn ~ '^(97[89])?\d{9}[\dX]$'),
  publisher text,
  published_year int check (published_year between 1400 and 2100),
  format book_format not null default 'physical',
  ownership text not null default 'owned' check (ownership in ('owned', 'library', 'friend', 'none')),
  progress_unit text not null default 'pages' check (progress_unit in ('pages', 'percent')),
  total_pages int check (total_pages > 0),
  current_page int not null default 0 check (current_page >= 0),
  wishlist_priority text check (wishlist_priority in ('someday', 'soon', 'must')),
  wishlist_price_lkr int check (wishlist_price_lkr >= 0),
  wishlist_where text,
  abandon_reason text,
  ai_extracted boolean not null default false,
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade,
  check (total_pages is null or current_page <= total_pages)
);
create index books_author_trgm on books using gin (lower(author) gin_trgm_ops);
create index books_author_native_trgm on books using gin (author_native gin_trgm_ops);
create index books_isbn on books (user_id, isbn);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  started_at date not null default local_today(),
  finished_at date,
  outcome text not null default 'reading' check (outcome in ('reading', 'read', 'abandoned', 'paused')),
  rating numeric(2,1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  note text,
  created_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create unique index one_open_session on reading_sessions (item_id) where outcome = 'reading';

create table public.page_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  page int not null check (page >= 0),
  logged_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create index page_logs_item_time on page_logs (item_id, logged_at desc);
create index page_logs_user_time on page_logs (user_id, logged_at);

-- Loans ----------------------------------------------------------------
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  direction loan_direction not null default 'borrowed',
  party text not null,                        -- library name, or friend's name
  borrowed_on date not null default local_today(),
  due_on date,                                -- nullable for friend loans without a date
  due_stamps date[] not null default '{}',    -- every due date ever set, for LoanSlip stamps
  returned_on date,
  renewal_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade,
  check (due_on is null or due_on >= borrowed_on)
);
create trigger loans_updated before update on loans for each row execute function set_updated_at();
create unique index one_open_loan on loans (item_id) where returned_on is null;
create index loans_open_due on loans (user_id, due_on) where returned_on is null;

-- Movies ---------------------------------------------------------------
create table public.movies (
  item_id uuid primary key,
  user_id uuid not null default auth.uid(),
  tmdb_id int not null,
  release_year int,
  runtime_min int,
  genres text[] not null default '{}',
  overview text,
  tmdb_collection_id int,
  tmdb_collection_name text,
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade,
  unique (user_id, tmdb_id)
);

create table public.watch_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  watched_on date not null default local_today(),
  rating numeric(2,1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  note text check (length(note) <= 500),
  created_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create index watch_logs_item on watch_logs (item_id, watched_on desc);

-- Shows ----------------------------------------------------------------
create table public.shows (
  item_id uuid primary key,
  user_id uuid not null default auth.uid(),
  tmdb_id int not null,
  first_air_year int,
  network text,
  tmdb_status text,               -- 'Returning Series' | 'Ended' | 'Canceled' | 'In Production' ...
  number_of_seasons int,
  next_air_date date,
  next_season int,
  next_episode int,
  overview text,
  last_synced_at timestamptz,
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade,
  unique (user_id, tmdb_id)
);
create index shows_tmdb on shows (tmdb_id);

create table public.tmdb_episodes (       -- shared cache, no user data
  tmdb_show_id int not null,
  season int not null,
  episode int not null,
  name text,
  air_date date,
  still_path text,
  vote_average numeric(3,1),
  runtime_min int,
  fetched_at timestamptz not null default now(),
  primary key (tmdb_show_id, season, episode)
);

create table public.episode_watches (
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  season int not null,
  episode int not null,
  watched_at timestamptz not null default now(),
  primary key (item_id, season, episode),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);

-- Collections ----------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 80),
  description text check (length(description) <= 200),
  pinned boolean not null default false,
  sort_mode text not null default 'custom' check (sort_mode in ('custom', 'year', 'added')),
  position text collate "C" not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create trigger collections_updated before update on collections for each row execute function set_updated_at();
create unique index collections_name_unique on collections (user_id, lower(name));

create table public.collection_items (
  collection_id uuid not null,
  item_id uuid not null,
  user_id uuid not null default auth.uid(),
  position text collate "C" not null,
  added_at timestamptz not null default now(),
  primary key (collection_id, item_id),
  foreign key (collection_id, user_id) references collections (id, user_id) on delete cascade,
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create index collection_items_item on collection_items (item_id);

-- Up next --------------------------------------------------------------
create table public.up_next (
  item_id uuid primary key,
  user_id uuid not null default auth.uid(),
  position text collate "C" not null,       -- fractional-indexing key
  added_at timestamptz not null default now(),
  foreign key (item_id, user_id) references items (id, user_id) on delete cascade
);
create index up_next_order on up_next (user_id, position);

-- AI usage (rate limiting) --------------------------------------------
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  ok boolean not null
);
create index ai_usage_user_time on ai_usage (user_id, created_at desc);

-- Side effect: finished/dropped items leave the queue ------------------
create or replace function public.items_status_side_effects() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status
     and new.status in ('read', 'watched', 'dropped', 'abandoned') then
    delete from up_next where item_id = new.id;
  end if;
  return new;
end $$;
create trigger items_status_effects after update of status on items
  for each row execute function items_status_side_effects();
```

### 7.3 Migration `0002_rls.sql`

```sql
do $$
declare t text;
begin
  foreach t in array array['items','books','reading_sessions','page_logs','loans','movies',
                           'watch_logs','shows','episode_watches','collections','collection_items','up_next']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "own rows" on public.%I for all to authenticated
                     using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))$p$, t);
  end loop;
end $$;

alter table profiles enable row level security;
create policy "own profile" on profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter table tmdb_episodes enable row level security;
create policy "read cache" on tmdb_episodes for select to authenticated using (true);
-- no insert/update policies: only the service role (edge functions) writes

alter table ai_usage enable row level security;   -- no policies: service role only

-- Storage: private covers bucket, one folder per user
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', false, 3145728, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "covers read own" on storage.objects for select to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "covers insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "covers update own" on storage.objects for update to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "covers delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = (select auth.uid())::text);
```

### 7.4 Migration `0003_rpc.sql`

All RPCs are `security invoker` (RLS applies), `set search_path = public`, and granted to `authenticated`. Implement exactly these signatures; bodies below are complete for the core ones and specified in words for the rest.

```sql
-- Create a book with optional loan, first session, and queue entry. Idempotent on p->>'id'.
create or replace function public.create_book(p jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := (p->>'id')::uuid;
  v_uid uuid := auth.uid();
  v_status item_status := (p->>'status')::item_status;
  v_page int := coalesce((p->>'current_page')::int, 0);
  v_start date := coalesce((p->>'started_at')::date, local_today());
begin
  if exists (select 1 from items where id = v_id) then return v_id; end if;

  insert into items (id, user_id, kind, status, title, title_native, cover_path, cover_url, started_at)
  values (v_id, v_uid, 'book', v_status, p->>'title', nullif(p->>'title_native', ''),
          p->>'cover_path', p->>'cover_url', case when v_status = 'reading' then v_start end);

  insert into books (item_id, user_id, author, author_native, language, isbn, publisher, published_year,
                     format, ownership, total_pages, current_page, wishlist_priority, wishlist_price_lkr,
                     wishlist_where, ai_extracted)
  values (v_id, v_uid, nullif(p->>'author',''), nullif(p->>'author_native',''),
          coalesce(p->>'language','English'), nullif(p->>'isbn',''), nullif(p->>'publisher',''),
          (p->>'published_year')::int, coalesce((p->>'format')::book_format,'physical'),
          coalesce(p->>'ownership','owned'), (p->>'total_pages')::int, v_page,
          p->>'wishlist_priority', (p->>'wishlist_price_lkr')::int, p->>'wishlist_where',
          coalesce((p->>'ai_extracted')::boolean, false));

  if p ? 'loan' then
    insert into loans (id, item_id, user_id, direction, party, borrowed_on, due_on, due_stamps)
    values ((p->'loan'->>'id')::uuid, v_id, v_uid,
            coalesce((p->'loan'->>'direction')::loan_direction, 'borrowed'),
            p->'loan'->>'party', (p->'loan'->>'borrowed_on')::date, (p->'loan'->>'due_on')::date,
            case when p->'loan'->>'due_on' is null then '{}'::date[]
                 else array[(p->'loan'->>'due_on')::date] end);
  end if;

  if v_status = 'reading' then
    insert into reading_sessions (item_id, user_id, started_at) values (v_id, v_uid, v_start);
    insert into page_logs (item_id, user_id, page) values (v_id, v_uid, v_page);  -- baseline
  end if;

  if p ? 'up_next_position' then
    insert into up_next (item_id, user_id, position) values (v_id, v_uid, p->>'up_next_position');
  end if;
  return v_id;
end $$;

-- Move a book between statuses with the right side effects.
create or replace function public.set_book_status(p_item uuid, p_status item_status, p_on date default null)
returns void language plpgsql security invoker set search_path = public as $$
declare v_old item_status; v_uid uuid := auth.uid(); v_on date := coalesce(p_on, local_today()); v_page int;
begin
  select status into v_old from items where id = p_item and kind = 'book' for update;
  if not found then raise exception 'book not found'; end if;
  if v_old = p_status then return; end if;

  if p_status = 'reading' then
    if v_old = 'read' then update books set current_page = 0 where item_id = p_item; end if;  -- re-read
    update items set status = 'reading', finished_at = null,
      started_at = case when v_old in ('read','wishlist','to_read') or started_at is null then v_on else started_at end
    where id = p_item;
    insert into reading_sessions (item_id, user_id, started_at) values (p_item, v_uid, v_on)
      on conflict do nothing;                                   -- one_open_session guards duplicates
    select current_page into v_page from books where item_id = p_item;
    insert into page_logs (item_id, user_id, page) values (p_item, v_uid, v_page);  -- baseline for pace/stats
  elsif p_status = 'read' then
    perform finish_book(p_item, v_on, null, null, false);
  elsif p_status = 'abandoned' then
    perform stop_book(p_item, null, false);
  else -- wishlist | to_read
    update reading_sessions set outcome = 'paused', finished_at = v_on
      where item_id = p_item and outcome = 'reading';
    update items set status = p_status where id = p_item;
  end if;
end $$;

-- Log the current page. Going backwards replaces today's higher logs.
create or replace function public.log_page(p_item uuid, p_page int, p_log_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare v_total int; v_status item_status;
begin
  if exists (select 1 from page_logs where id = p_log_id) then return; end if;   -- idempotent replay
  select b.total_pages, i.status into v_total, v_status
    from books b join items i on i.id = b.item_id where b.item_id = p_item;
  if not found then raise exception 'book not found'; end if;
  if p_page < 0 or (v_total is not null and p_page > v_total) then raise exception 'page out of range'; end if;
  if v_status <> 'reading' then perform set_book_status(p_item, 'reading', local_today()); end if;
  delete from page_logs where item_id = p_item and page > p_page
    and (logged_at at time zone 'Asia/Colombo')::date = local_today();
  insert into page_logs (id, item_id, user_id, page) values (p_log_id, p_item, auth.uid(), p_page);
  update books set current_page = p_page where item_id = p_item;
end $$;
```

Remaining RPCs (same conventions):

| Function | Behavior |
|---|---|
| `finish_book(p_item uuid, p_on date, p_rating numeric, p_note text, p_return_loan boolean)` | Status `read`, `finished_at = p_on`, item `rating`/`note` set; `current_page = total_pages` plus a final page log if it changed; close the open session with outcome `read`, rating and note; if `p_return_loan`, set `returned_on = p_on` on the open loan. |
| `stop_book(p_item uuid, p_reason text, p_to_read boolean)` | If `p_to_read` ("Maybe later"): status `to_read`, session outcome `paused`. Else status `abandoned`, `books.abandon_reason = p_reason`, session outcome `abandoned` with `finished_at = local_today()`. |
| `add_loan(p jsonb)` | Insert loan for an existing book (id, item_id, direction, party, borrowed_on, due_on); `due_stamps = [due_on]`; sets `books.ownership` to `library` or `friend` for borrowed loans. Idempotent on id. |
| `renew_loan(p_loan uuid, p_new_due date)` | Requires open loan and `p_new_due > due_on`; sets `due_on`, appends to `due_stamps`, increments `renewal_count`. |
| `return_loan(p_loan uuid, p_on date)` | Sets `returned_on`. If the book was borrowed and never finished, ownership becomes `none`. |
| `add_tmdb_item(p jsonb)` | Insert `items` + `movies` or `shows` from a TMDB DTO. Idempotent on `(user_id, tmdb_id)`: returns the existing item id if present. If a movie is added as `watched`, also inserts a `watch_logs` row. |
| `log_viewing(p_id uuid, p_item uuid, p_on date, p_rating numeric, p_note text)` | Insert `watch_logs`; item status `watched`, `rating` = this viewing's rating, `finished_at = p_on`. |
| `mark_episodes(p_item uuid, p_season int, p_episodes int[], p_watched boolean)` | Insert (on conflict do nothing) or delete `episode_watches`. When marking watched and the show is `watchlist`, set `watching` and `started_at`. |
| `mark_season(p_item uuid, p_season int)` | Calls `mark_episodes` with every aired episode of that season from `tmdb_episodes`. |
| `set_item_status(p_item uuid, p_status item_status, p_on date)` | For movies and shows. `watched` sets `finished_at`; `watching` sets `started_at` if null. |
| `add_to_collection(p_collection uuid, p_items uuid[], p_positions text[])` | Bulk insert with client-computed fractional positions; on conflict do nothing. |
| `export_my_data()` | Returns one `jsonb` object with arrays of every user table (items, books, sessions, page logs, loans, movies, watch logs, shows, episode watches, collections, collection items, up next, profile). |

Read-side functions:

```sql
-- Progress for one show, or all the user's shows when p_item is null.
create or replace function public.show_progress(p_item uuid default null)
returns table (item_id uuid, aired int, watched int, total int, next_season int, next_episode int,
               next_name text, next_still text, caught_up boolean, next_air_date date, tmdb_status text)
language sql stable security invoker set search_path = public as $$
  with prof as (select coalesce((select include_specials from profiles where id = auth.uid()), false) as inc),
  s as (select * from shows where user_id = auth.uid() and (p_item is null or shows.item_id = p_item)),
  eps as (
    select s.item_id, e.season, e.episode, e.name, e.still_path, e.air_date,
           (w.item_id is not null) as is_watched
    from s
    join tmdb_episodes e on e.tmdb_show_id = s.tmdb_id
    cross join prof
    left join episode_watches w on w.item_id = s.item_id and w.season = e.season and w.episode = e.episode
    where e.season > 0 or prof.inc
  ),
  agg as (
    select eps.item_id,
           count(*) filter (where air_date <= local_today()) as aired,
           count(*) filter (where is_watched) as watched,
           count(*) as total
    from eps group by eps.item_id
  ),
  nxt as (
    select distinct on (eps.item_id) eps.item_id, season, episode, name, still_path
    from eps where not is_watched and air_date <= local_today()
    order by eps.item_id, season, episode
  )
  select s.item_id, coalesce(a.aired, 0)::int, coalesce(a.watched, 0)::int, coalesce(a.total, 0)::int,
         n.season, n.episode, n.name, n.still_path, (n.item_id is null), s.next_air_date, s.tmdb_status
  from s left join agg a on a.item_id = s.item_id left join nxt n on n.item_id = s.item_id;
$$;

-- Bilingual library search (both scripts, titles and authors).
create or replace function public.search_library(q text)
returns table (item_id uuid, kind media_kind, title text, title_native text, author text, status item_status, score real)
language sql stable security invoker set search_path = public as $$
  select i.id, i.kind, i.title, i.title_native, coalesce(b.author, b.author_native), i.status,
         greatest(similarity(lower(i.title), lower(q)),
                  similarity(coalesce(i.title_native, ''), q),
                  similarity(lower(coalesce(b.author, '')), lower(q)),
                  similarity(coalesce(b.author_native, ''), q)) as score
  from items i left join books b on b.item_id = i.id
  where i.user_id = auth.uid()
    and (lower(i.title) like '%' || lower(q) || '%'
         or i.title_native like '%' || q || '%'
         or lower(coalesce(b.author, '')) like '%' || lower(q) || '%'
         or coalesce(b.author_native, '') like '%' || q || '%'
         or similarity(lower(i.title), lower(q)) > 0.25)
  order by score desc, i.updated_at desc
  limit 50;
$$;
```

`year_stats(p_year int) returns jsonb` computes, for the Your year screen: `books_finished` (sessions with outcome `read` finished in the year), `goal` (from profile), `pages_read` (sum of positive deltas between consecutive `page_logs` per item within the year, using `lag(page)` with the first log of each item as its own baseline), `language_split` (finished books by `books.language`), `movies_watched`, `episodes_watched`, `hours_watched` (movie runtimes of watch logs + episode runtimes from `tmdb_episodes`, defaulting to 45 min when unknown), `longest_book`, `fastest_read` (fewest days start-to-finish), `most_rewatched` (movie with most watch logs). Years are evaluated in Asia/Colombo time.

End `0003_rpc.sql` with:

```sql
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on function public.handle_new_user() from authenticated;
```

### 7.5 Migration `0004_cron.sql`

```sql
-- Store in Vault first: project_url, cron_secret (a random string also set as the function secret CRON_SECRET)
select cron.schedule('refresh-shows-daily', '30 20 * * *',   -- 02:00 Asia/Colombo
$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/refresh-shows',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb);
$$);

select cron.schedule('prune-ai-usage', '0 21 * * *',
  $$ delete from public.ai_usage where created_at < now() - interval '30 days' $$);
```

### 7.6 Tests and seed

- `supabase/tests/rls.test.sql` (pgTAP): two users; user B cannot select, update or delete user A's rows in every table; user B cannot insert a `books` row pointing to user A's item (composite FK fails); storage path of another user is rejected.
- `supabase/seed.sql`: create a local test user and insert the prototype sample data (7 books with the two Colombo Public Library loans, 2 movies with 3 viewings of IT, 3 shows with episode watches, 3 collections, 12 queue entries). Take the values from `design/unpacked/app.js` state. Seed `tmdb_episodes` for the three shows with the season sizes in the prototype.

---
## 8. Edge functions (`supabase/functions`)

Shared code in `_shared/`: `cors.ts`, `http.ts` (`json()`, `HttpError`, `errorResponse()`), `auth.ts`, `tmdb.ts` (typed TMDB client), `schemas.ts` (zod DTOs, also imported by the app through a path alias so client and server agree).

```ts
// _shared/auth.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { HttpError } from './http.ts';

export async function requireUser(req: Request) {
  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new HttpError(401, 'unauthorized');
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  return { uid: data.user.id, userClient, admin };
}
```

(If the project uses Supabase's newer publishable/secret API keys, read whichever key names the function environment provides.)

### 8.1 `extract-book` (Gemini cover reading)

**Request:** `POST { itemId: uuid, paths: string[] }` where `paths` are 1–2 storage paths already uploaded by the client (`{uid}/{itemId}/front.jpg`, optional `back.jpg`). Uploading first means the photo crosses the mobile network once and is already stored as the cover.

**Response 200:** `{ fields: Extraction, remaining: number }`. **Errors:** `429 { error: 'daily_limit', limit, resetsAt }`, `422 { error: 'ai_unreadable' }`, `502 { error: 'ai_failed' }`.

```ts
// supabase/functions/extract-book/index.ts
import { z } from 'npm:zod@3';
import { encodeBase64 } from 'jsr:@std/encoding/base64';
import { requireUser } from '../_shared/auth.ts';
import { json, errorResponse, HttpError, corsPreflight } from '../_shared/http.ts';
import { Extraction, EXTRACTION_JSON_SCHEMA, normalizeExtraction } from '../_shared/schemas.ts';

const Body = z.object({ itemId: z.string().uuid(), paths: z.array(z.string()).min(1).max(2) });
const LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? 30);
const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.6-flash';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsPreflight();
  try {
    const { uid, admin } = await requireUser(req);
    const { itemId, paths } = Body.parse(await req.json());
    if (!paths.every((p) => p.startsWith(`${uid}/${itemId}/`))) throw new HttpError(403, 'bad_path');

    const { since, resetsAt } = colomboDayWindow();          // Colombo midnight → next midnight, as UTC
    const { count } = await admin.from('ai_usage').select('id', { count: 'exact', head: true })
      .eq('user_id', uid).gte('created_at', since);
    if ((count ?? 0) >= LIMIT) return json({ error: 'daily_limit', limit: LIMIT, resetsAt }, 429);

    const images = await Promise.all(paths.map(async (p) => {
      const { data, error } = await admin.storage.from('covers').download(p);
      if (error) throw new HttpError(404, 'image_missing');
      return { inline_data: { mime_type: 'image/jpeg', data: encodeBase64(new Uint8Array(await data.arrayBuffer())) } };
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')! },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [...images, { text: PROMPT }] }],
          generationConfig: { responseMimeType: 'application/json', responseJsonSchema: EXTRACTION_JSON_SCHEMA },
          // Do not send temperature/top_p/top_k: deprecated on current Gemini models.
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );
    await admin.from('ai_usage').insert({ user_id: uid, ok: res.ok });
    if (!res.ok) return json({ error: 'ai_failed' }, 502);

    const body = await res.json();
    const text = body.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ?? '{}';
    const parsed = Extraction.safeParse(JSON.parse(text));
    if (!parsed.success) return json({ error: 'ai_unreadable' }, 422);
    return json({ fields: normalizeExtraction(parsed.data), remaining: LIMIT - (count ?? 0) - 1 });
  } catch (e) {
    return errorResponse(e);
  }
});

const PROMPT = `You are reading photos of a book's cover (and possibly its back cover or copyright page).
The book is most likely from Sri Lanka and may be in Sinhala, English or Tamil.
Return only what is printed or clearly implied by the photos.

Rules:
- title_native / author_native: exactly as printed in the non-Latin script (Sinhala or Tamil). Null if the cover has only Latin text.
- title_romanized / author_romanized: if the cover is in Sinhala or Tamil, give the common Sri Lankan English spelling
  (for example "Madol Doova", "Martin Wickramasinghe"), not ISO 15919 with diacritics and not a translation.
  If the cover is in English, copy the English title and author exactly.
- language: the language of the book's text.
- isbn, publisher, published_year, total_pages: only if printed in the photos. Never guess; use null.
- Strip series labels, prices and marketing text from the title.
- confidence: 0 to 1 for each field; below 0.6 means a person should check it.`;
```

`EXTRACTION_JSON_SCHEMA` (JSON Schema, mirrored by the zod `Extraction`):

```json
{
  "type": "object",
  "properties": {
    "script_on_cover": { "type": "string", "enum": ["sinhala", "latin", "tamil", "mixed"] },
    "title_native": { "type": ["string", "null"] },
    "title_romanized": { "type": ["string", "null"] },
    "author_native": { "type": ["string", "null"] },
    "author_romanized": { "type": ["string", "null"] },
    "language": { "type": "string", "enum": ["Sinhala", "English", "Tamil", "Other"] },
    "isbn": { "type": ["string", "null"] },
    "publisher": { "type": ["string", "null"] },
    "published_year": { "type": ["integer", "null"] },
    "total_pages": { "type": ["integer", "null"] },
    "confidence": {
      "type": "object",
      "properties": {
        "title_native": { "type": "number" }, "title_romanized": { "type": "number" },
        "author_native": { "type": "number" }, "author_romanized": { "type": "number" },
        "language": { "type": "number" }, "isbn": { "type": "number" },
        "publisher": { "type": "number" }, "published_year": { "type": "number" },
        "total_pages": { "type": "number" }
      }
    }
  },
  "required": ["script_on_cover", "title_romanized", "language", "confidence"]
}
```

`normalizeExtraction`: trim and NFC-normalize all strings; strip non-digits from ISBN and drop it unless the ISBN-10/13 checksum passes (convert ISBN-10 to 13); clamp `total_pages` to 1–5000; set confidence to 0 for any field that became null.

**Model choice:** `GEMINI_MODEL` defaults to `gemini-3.6-flash`. For lower cost, `gemini-3.5-flash-lite` is a reasonable alternative; test both on 20 real Sinhala covers before launch and keep the one with better Sinhala accuracy. If `responseJsonSchema` is rejected by the chosen model, fall back to `responseSchema` (OpenAPI subset); the zod validation stays either way.

### 8.2 `tmdb` (proxy + episode cache)

Single function, `POST { action, ... }`, requires a signed-in user. Uses the TMDB v4 read access token (`TMDB_READ_TOKEN`) as a Bearer header against `https://api.themoviedb.org/3`. Returns trimmed DTOs only.

| Action | TMDB calls | Returns / side effects |
|---|---|---|
| `search { type: 'movie' \| 'tv', query, page }` | `/search/{type}` with `include_adult=false` | `{ results: [{ tmdbId, kind, title, year, posterPath, overview }] }` |
| `movie { id }` | `/movie/{id}` | Movie DTO incl. `runtimeMin`, `genres`, `collection: { id, name } \| null` |
| `collection { id }` | `/collection/{id}` | `{ name, parts: [movie DTO] }` sorted by release date |
| `show { id }` | `/tv/{id}`, then `/tv/{id}?append_to_response=season/1,...,season/20` in chunks of 20 | Show DTO (`tmdbStatus`, `network` = first network name, `numberOfSeasons`, `nextEpisodeToAir`, `seasons: [{ n, episodeCount }]`). Upserts every episode into `tmdb_episodes` with the service role. |
| `season { id, season }` | `/tv/{id}/season/{n}` only if cache is stale (older than 24h for ongoing shows, 30 days for ended) | Episodes from `tmdb_episodes` |

Images are loaded by the app directly from `https://image.tmdb.org/t/p/{size}{path}` (posters `w342`, backdrops `w780`, stills `w300`). Never re-host TMDB images.

### 8.3 `isbn-lookup`

`POST { isbn }`. Validate and convert to ISBN-13. Try Open Library first (`/isbn/{isbn}.json`, then each author key for names; cover at `covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false`), sending a `User-Agent: Calico/1.0 (contact email)` header as Open Library asks. Fall back to Google Books `volumes?q=isbn:{isbn}` (optional `GOOGLE_BOOKS_API_KEY`). Returns `{ found: boolean, title, author, pages, publisher, year, language, coverUrl, source }`. No AI quota is used.

### 8.4 `refresh-shows` (cron)

Rejects requests without the correct `x-cron-secret`. Selects distinct `tmdb_id` from `shows` where `tmdb_status` is not `Ended`/`Canceled` or `last_synced_at` is older than 30 days. For each (concurrency 4): fetch `/tv/{id}`, update every user's `shows` row for that `tmdb_id` (`tmdb_status`, `number_of_seasons`, `next_air_date`, `next_season`, `next_episode`, `last_synced_at`), and refresh the cached episodes of the seasons containing `last_episode_to_air` and `next_episode_to_air`. Logs a summary line.

### 8.5 `delete-account`

`POST {}` with the user's JWT. Lists and removes every object under `covers/{uid}/`, then calls `admin.auth.admin.deleteUser(uid)`; all rows cascade. Returns 204. The app then signs out locally, clears the MMKV cache and cancels all scheduled notifications.

### 8.6 Secrets

```
supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-3.6-flash AI_DAILY_LIMIT=30 \
  TMDB_READ_TOKEN=... GOOGLE_BOOKS_API_KEY=... CRON_SECRET=...
```

---
## 9. App architecture

### 9.1 Routes (`app/`)

```
app/
├─ _layout.tsx                 # fonts, splash, providers, auth gate
├─ (auth)/welcome.tsx          # prototype: welcome
├─ (app)/_layout.tsx           # protected Stack; SheetHost, ToastHost, DragLayer, OfflineBanner
├─ (app)/(tabs)/_layout.tsx    # Tabs with custom ds/TabBar + CaptureButton
├─ (app)/(tabs)/index.tsx      # home
├─ (app)/(tabs)/library.tsx    # library (?tab=Books|Movies|Shows&filter=...)
├─ (app)/(tabs)/up-next.tsx    # upnext
├─ (app)/(tabs)/collections.tsx
├─ (app)/book/[id].tsx         # bookDetail (?sheet=renew|loanQuick|ruler)
├─ (app)/movie/[id].tsx        # movieDetail
├─ (app)/show/[id].tsx         # showDetail
├─ (app)/collection/[id].tsx   # collectionDetail
├─ (app)/capture/_layout.tsx   # fullscreen stack, dark status bar
├─ (app)/capture/camera.tsx    # camera (?mode=barcode|cover|back)
├─ (app)/capture/crop.tsx
├─ (app)/capture/reading.tsx   # "Reading the cover"
├─ (app)/capture/review.tsx    # review (also used for manual entry: ?manual=1)
├─ (app)/tmdb.tsx              # tmdb search (?type=movie|tv)
├─ (app)/search.tsx
├─ (app)/year.tsx
├─ (app)/settings/index.tsx
├─ (app)/settings/delete.tsx
├─ (app)/pick.tsx              # presentation: 'transparentModal', animation: 'fade'
└─ dev/components.tsx, dev/notifications.tsx   # __DEV__ only
```

**Sheets** are not routes. A global `SheetHost` renders whichever sheet is open from a zustand store: `openSheet('ruler', { itemId })`. Sheets from the prototype: `add`, `ruler`, `finish`, `stop`, `renew`, `loanQuick`, `tray`, `newCollection`, `notif` (reminder permission), `tmdbPreview`, `franchise`, `watchAgain`, `overflow`, plus `loanForm` (add a loan to an existing book), `addToCollection`, `episode` (episode detail), `statusDate` (start-date popover). A `?sheet=` search param on detail routes opens a sheet on arrival (used by notifications).

**Tab bar:** Home (`home`), Library (`grid_view`), center add button, Up next (`playlist_play`), Collections (`category`). Active tab: `textAccent` icon/label on a `surfaceAccentSoft` pill (prototype `core()`). Tapping the active tab scrolls to top; tapping again resets filters. Tab bar is hidden on non-tab routes.

### 9.2 Providers (`app/_layout.tsx`)

Order: `GestureHandlerRootView` → `SafeAreaProvider` → `ThemeProvider` → `PersistQueryClientProvider` → `AuthProvider` → `BottomSheetModalProvider` → `Stack`. Hide the splash screen only when fonts are loaded, the persisted cache is restored, and the auth session is known.

### 9.3 Auth

```ts
// src/features/auth/google.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';

GoogleSignin.configure({ webClientId: env.GOOGLE_WEB_CLIENT_ID });

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  if (res.type !== 'success' || !res.data.idToken) throw new Error('cancelled');
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: res.data.idToken });
  if (error) throw error;
}
```

Setup (document in README): Google Cloud project with an OAuth **Web** client (its ID and secret go into Supabase → Auth → Google, and its ID into `GOOGLE_WEB_CLIENT_ID`) and an OAuth **Android** client for the package name with the SHA-1 fingerprints from `eas credentials` (development, preview and production keystores, plus Play App Signing's SHA-1 after the first upload). Failure shows the prototype error row: "Google sign-in didn't finish. Try again."

`src/lib/supabase.ts`: `createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })`, plus an `AppState` listener calling `startAutoRefresh()` / `stopAutoRefresh()`.

Sign-out clears the query cache, MMKV (except theme), capture drafts and scheduled notifications.

### 9.4 Data layer

**Query client:** `staleTime` 60s, `gcTime` 7 days, queries `networkMode: 'offlineFirst'`. Persisted to MMKV with `createSyncStoragePersister`, `maxAge` 7 days, `buster` = app version + migration number. After restore, call `queryClient.resumePausedMutations()`. `onlineManager` is wired to NetInfo.

**Query keys** (`src/lib/queryKeys.ts`):

```ts
export const qk = {
  profile: ['profile'] as const,
  items: (kind: MediaKind, filter: string) => ['items', kind, filter] as const,
  item: (id: string) => ['item', id] as const,              // item + detail row + loan + sessions
  pageLogs: (id: string) => ['pageLogs', id] as const,
  openLoans: ['loans', 'open'] as const,
  showProgress: (id?: string) => ['showProgress', id ?? 'all'] as const,
  episodes: (tmdbId: number) => ['episodes', tmdbId] as const,
  watchLogs: (id: string) => ['watchLogs', id] as const,
  upNext: ['upNext'] as const,
  collections: ['collections'] as const,
  collection: (id: string) => ['collection', id] as const,
  search: (q: string) => ['search', q] as const,
  tmdbSearch: (type: string, q: string) => ['tmdbSearch', type, q] as const,
  stats: (year: number) => ['stats', year] as const,
  homeStats: ['homeStats'] as const,
  signedUrl: (path: string) => ['signedUrl', path] as const,
};
```

**Mutations:** every mutation has a `mutationKey` and its `mutationFn` registered with `queryClient.setMutationDefaults` in `src/lib/mutations.ts` (required for resuming after an app restart). New rows get client UUIDs. Optimistic updates (snapshot, update caches, roll back and toast on error, invalidate on settle) for: log page, status changes, mark episode(s), reorder queue, add/remove queue, renew/return, collection add/remove, log viewing, script toggle, theme.

**Home data** (`useHome`): open loans due within 7 days or overdue with embedded item (`loans?select=*,items(*)`), reading books with `books(*)` and their page logs from the last 30 days, `show_progress()` filtered to Watching shows with a next episode, the top 3 of `up_next` with items, and `home_stats()` (a small RPC returning pages this month, books finished this year and episodes this week; add it to `0003_rpc.sql`). Section order and visibility follow the prototype `homeV()`, with overdue loans first.

**Images** (`useCoverSource(item)`): `cover_path` → signed URL (batched `createSignedUrls`, 24h expiry, cached under `qk.signedUrl`) rendered by `expo-image` with `cacheKey: cover_path` and `cachePolicy: 'disk'` so rotating URLs don't re-download; `poster_path` → TMDB URL; `cover_url` → external; otherwise `GeneratedCover`.

### 9.5 Notifications (`src/lib/notifications.ts`)

- On startup: `setNotificationHandler` (show alert, play sound), Android channel `loans` (importance high), categories `loan3d` (actions `renew`, `open`) and `loan1d` (actions `renew`, `returned`), all with `opensAppToForeground: true`.
- Permission: never at launch. The first time a borrowed loan is saved, show the `notif` sheet ("Reminders for library books"); only "Allow reminders" triggers the system prompt. Remember the answer in MMKV.
- `syncLoanReminders()` computes the desired set from open borrowed loans and profile settings: identifiers `loan:{loanId}:3d` and `loan:{loanId}:1d`, fired at `reminder_time` in Asia/Colombo on `due_on − 3` and `due_on − 1` days (use `TZDate` from `@date-fns/tz`), skipping times in the past. It cancels scheduled `loan:*` identifiers not in the set and schedules missing ones (compare using `getAllScheduledNotificationsAsync`). Content `data`: `{ itemId, loanId }`.
- Run it after sign-in, on app foreground (at most hourly), after every loan mutation settles, and after reminder settings change.
- Copy (from prototype): title "{title} is due in 3 days" / "{title} is due tomorrow"; body "Due at {library} on {Sat 26 Sep}." / "Renewed once so far." (or "Not renewed yet."). Title uses the lead script.
- Response listener: `renew` → `/book/{itemId}?sheet=renew`; `returned` → `/book/{itemId}?sheet=loanQuick`; default tap → `/book/{itemId}`.
- Android 12+ may deliver these slightly late (inexact alarms); that is acceptable for day-level reminders. Do not request `SCHEDULE_EXACT_ALARM`.

### 9.6 Capture pipeline (`src/features/capture`)

1. **Start:** generate `itemId` (UUID) immediately; all photos go to `covers/{uid}/{itemId}/`. Draft state in a zustand store.
2. **Camera** (`CameraView`): barcode mode sets `barcodeScannerSettings: { barcodeTypes: ['ean13'] }`; guard `onBarcodeScanned` with a ref so it fires once; accept only 978/979 prefixes with a valid checksum; success haptic; call `isbn-lookup`; show the "Found" card ("Use this" / "Not it"). No match: "No match for this ISBN. Snap the cover instead?" and switch to cover mode keeping the ISBN. Cover and back modes use `takePictureAsync({ quality: 0.8 })`. Gallery via `expo-image-picker`.
3. **Crop:** axis-aligned crop box initialized to the 2:3 guide frame, draggable corners and edges (Gesture Handler), rotate 90°. Output via `ImageManipulator`: rotate → crop → resize to width 1024 → JPEG compress 0.7.
4. **Upload:** read bytes with the Expo FileSystem `File` API and `supabase.storage.from('covers').upload(path, bytes, { contentType: 'image/jpeg', upsert: true })`.
5. **Reading the cover:** `supabase.functions.invoke('extract-book', { body: { itemId, paths } })`. Show the slow-network message after 8s, abort at 25s. Map errors to the prototype's error states (AI error, daily limit with reset time, offline).
6. **Review:** react-hook-form + zod, defaults from extraction or ISBN lookup; fields ordered by `script_on_cover`; confidence below 0.6 renders the dotted "check" state; duplicate check (debounced title match against the user's books) shows the prototype notice. Save calls `create_book` with loan and optional queue position.
7. **Offline capture:** if offline at upload time, copy the processed photos to `documentDirectory/drafts/{itemId}/`, add the draft to MMKV `pendingCaptures`, and show a Home card "1 cover waiting to be read". When back online, upload and extract automatically; tapping the card opens Review.

---
## 10. Screen map

Each prototype screen id (the `screen` values in `design/unpacked/app.js`) maps to a route, its data, and its key components. Match the prototype's layout, copy and states for each.

| Prototype screen | Route | Data | Key components | States to implement |
|---|---|---|---|---|
| `welcome` | `(auth)/welcome` | none | stacked `BookCover` trio, hand eyebrow "a shelf that remembers", `Button` | sign-in error |
| `home` | `(tabs)/index` | `useHome` | `ScreenHeader` greeting + night toggle + `Avatar`, `SearchField` pill, `DueSoonRow`/`LoanSlip`, `BookCard`, `ContinueWatchingCard`, `UpNextRow`, hand "can't decide?" + Pick for me, stats line | empty ("nothing on the shelf yet"), overdue pinned, offline, pending capture card |
| `library` | `(tabs)/library` | `items` by kind + filter | `SegmentedControl`, filter `Tag`s with counts, sort `Select`, grid/list/shelf toggle, `ScriptToggle`, `FlashList` | per-filter empty copy, swipe actions |
| `bookDetail` | `book/[id]` | `item`, `pageLogs`, open loan, sessions, collections | `StatusRail`, `ProgressBar`, `PaceSparkline`, `LoanSlip`, collection `Tag`s, notes | reading, read, wishlist, abandoned, on loan, overdue |
| `movieDetail` | `movie/[id]` | `item`, `watchLogs` | `StatusRail`, `TicketStack`, "Watched it again" | single, stacked, fanned |
| `showDetail` | `show/[id]` | `item`, `showProgress(id)`, `episodes(tmdbId)` | backdrop, `StatusRail`, `NextEpisodeCard`, `EpisodeGrid`, specials `Switch` | watching, caught up with/without date, finished-show prompt |
| `camera` | `capture/camera` | draft store | `CameraView`, guide frame, mode switcher, found card | barcode found / not found |
| `crop` | `capture/crop` | draft store | crop box, rotate | |
| `reading` | `capture/reading` | extract-book | `CoverReadingAnimation` | slow network, error |
| `review` | `capture/review` | draft store, duplicate query | `ConfidenceField`s, source/format/status `Tag` groups, conditional library/wishlist fields | duplicate, AI error, daily limit, manual entry |
| `tmdb` | `tmdb` | tmdb search | `SearchField`, result rows with quick add, TMDB attribution line | empty, no results |
| `upnext` | `(tabs)/up-next` | `upNext` | draggable `UpNextRow`s with move-up and remove buttons, `PickDivider`, sticky hand "let Kiri choose" + Pick for me | empty, dragging |
| (pick overlay) | `pick` | `upNext` top 10 | `PickDeck`, `Kiri` paw | shuffling, revealed |
| `collections` | `(tabs)/collections` | `collections` | `CollectionMosaic` grid with media-shape counts | empty |
| `collectionDetail` | `collection/[id]` | `collection` | mosaic header, type `Tag`s, mixed grid, `auto_awesome` suggestion row, "Add items", "All to up next" | |
| `search` | `search` | `search_library` | recent searches, grouped results | idle, no results with TMDB/add-book actions |
| `year` | `year` | `year_stats` | year `Select`, spine goal shelf, language split bar, stat tiles | |
| `settings` | `settings/*` | `profile` | grouped rows, `Switch`, `Select`, delete account | delete confirmation (type DELETE) |

---

## 11. Feature logic and signature interactions

### 11.1 Status rules

| Kind | Move | Side effects (RPC) | UI |
|---|---|---|---|
| Book | any → Reading | `set_book_status`: start date, new session, baseline page log; from Read it's a re-read (page reset to 0) | Start-date popover (default today); from Read, confirm "Start a re-read?" |
| Book | → Read | `finish_book` | Finish sheet (rating, prompt note, finished date, "Return to {library} too" if on loan) |
| Book | → Abandoned | `stop_book` | Stop sheet with reason chips; "Maybe later" turns the primary button into "Move to To read instead" |
| Book | Reading → To read / Wishlist | session paused | none |
| Movie | → Watched | `log_viewing` | Watched it again sheet (date, rating, note) |
| Show | first episode marked | status Watching automatically | none |
| Show | last episode of an Ended/Canceled show marked | none automatically | Prompt "That was the last episode of {show}. Mark the show as watched?" |
| Any | → Read / Watched / Dropped / Abandoned | trigger removes from Up next | Toast "Removed from up next" with Undo (re-inserts with the old position) |

`StatusRail` stops are fixed per kind; Abandoned (books) and Dropped (movies, shows) render as the branch below the rail.

### 11.2 Page ruler (`PageRuler`)

- A horizontal `Animated.FlatList` (Reanimated) of tick items, one per page (or per percent for `progress_unit = 'percent'`), `getItemLayout` with a fixed tick width of 12dp, `snapToInterval` 12, `decelerationRate: 'fast'`, horizontal padding of half the screen so page 0 and the last page can reach the fixed center needle. Opens scrolled to the last logged page.
- `useAnimatedScrollHandler` computes `page = round(x / 12)` on the UI thread; `useAnimatedReaction` calls `runOnJS(onTick)` when the page changes: `Haptics.selectionAsync()` per page (throttled to one every 25ms), `impactAsync(Light)` on multiples of 10.
- Big number above (display font, tabular), "+{n} since yesterday", quick chips `+10`, `+25`, `+50`, `End` (scroll with animation), and "at this pace: {date}" recomputed live by feeding a hypothetical log at the scrubbed page into `computePace`.
- Tapping the number opens a numeric `Input`. Lower than the last log shows the confirm "Go back to page 390? This replaces today's log."
- CTA text from prototype: "Log page {n}", or "Finish the book" at the last page (opens the Finish sheet).
- Accessibility: `accessibilityRole="adjustable"`, increment/decrement actions of 1 page, value announced as "Page 412 of 1138".

### 11.3 Pace and estimated finish (`features/books/logic.ts`)

```ts
export function computePace(logs: { page: number; loggedAt: Date }[], now: Date, windowDays = 14): number | null {
  if (logs.length < 3) return null;                       // UI: "Log a few sessions to see your pace."
  const sorted = [...logs].sort((a, b) => +a.loggedAt - +b.loggedAt);
  const windowStart = subDays(now, windowDays);
  const baseline = sorted.filter((l) => l.loggedAt < windowStart).at(-1)
    ?? sorted.find((l) => l.loggedAt >= windowStart)!;
  const latest = sorted.at(-1)!;
  const pages = latest.page - baseline.page;
  const days = Math.max(1, differenceInCalendarDays(toColombo(now), toColombo(baseline.loggedAt)));
  return pages > 0 ? pages / days : null;
}

export function estimateFinish(current: number, total: number, pace: number | null, today: Date): Date | null {
  if (!pace || current >= total) return null;
  return addDays(today, Math.ceil((total - current) / pace));
}
```

Copy: "About {round(pace)} pages a day", "Finish around {Wed 14 Oct}". `PaceSparkline` shows the pages gained per day for the last 14 days.

### 11.4 Library loans (`LoanSlip`)

- Layout from the prototype: library name with `local_library` icon, columns BORROWED and DUE with ink-style `DateStamp`s (format `26 SEP`), one stamp per entry in `due_stamps`, the latest on top; `dueLine` text ("Due in 3 days", "Due tomorrow", "Due today", "Overdue by 2 days"); renewal count; Renew and Returned buttons.
- Each `DateStamp` gets a stable rotation of −4° to +4° seeded by its date.
- **Renew:** `renew` sheet with quick choices (+7, +14, +21 days from the current due date) → optimistic update → the new stamp scales from 1.4 to 1 with `easing.purr` over `duration.slow`, `impactAsync(Heavy)`, and a strike line animates across the previous due stamp.
- **Returned:** the slip translates down and collapses (`duration.base`, `easing.inOut`), `impactAsync(Medium)`, toast "Returned to {library}" with Undo. If the book was unfinished, follow with "Move to To read so you remember it?".
- **Overdue:** a large rotated OVERDUE stamp over the slip (`statusDanger`, hatched background), and the slip sorts first in Home.
- `loanQuick` sheet (long-press on a Home slip): title, due line, Renew, Returned.
- Lent-out loans reuse the slip with "Lent to {name}" and no reminders.

### 11.5 Episode grid (`EpisodeGrid`)

- Rows per season (`SeasonRow`): label button ("Season 2", chevron, "4/8") that expands into an episode list (number, title, "TMDB 7.9", air date, watched icon), and a wrapped grid of `EpisodeSquare`s (visual 32dp with `hitSlop` to 48dp). Hint under the grid from prototype: "tap a square · hold one to fill the season".
- Square states: watched (filled), unwatched (outline), next up (outline + pulsing ring, the only ambient animation in the app), unaired (dashed, not tappable).
- One `Gesture.Pan().activateAfterLongPress(250)` per row plus a `Gesture.Tap()`, composed with `Gesture.Exclusive(pan, tap)`:
  - **Tap:** toggle one episode (`mark_episodes`), tooltip with episode name for 1s.
  - **Hold still 550ms** (pan active, no movement beyond 8dp since activation): mark the whole season (`mark_season`); squares fill left to right with a 30ms stagger and a light haptic per square; toast with Undo.
  - **Hold then drag:** paint mode; compute the square index from the touch position within the row's measured layout; collect indexes; on release commit once via `mark_episodes` with the set.
- `nextEpisode(episodes, watched, today, includeSpecials)` in `features/shows/logic.ts` mirrors the SQL `show_progress` so optimistic updates can advance "Next up" instantly.

### 11.6 Ticket stubs (`TicketStack`)

Each viewing is a `TicketStub`: perforated left edge (SVG circles cut-out), date, stars, note. Stubs stack with 6dp offsets, latest on top; the prototype's "stack hint" line sits under it. Tapping the stack fans the stubs into a vertical list (`LinearTransition` layout animation). "Watched it again" plays a tear animation (the new stub rotates 3° and drops 12dp, `duration.fast`) with `impactAsync(Rigid)`, then opens the `watchAgain` sheet.

### 11.7 Up next ordering

```ts
import { generateKeyBetween } from 'fractional-indexing';

export const appendKey = (list: { position: string }[]) => generateKeyBetween(list.at(-1)?.position ?? null, null);

export function keyForMove(list: { position: string }[], from: number, to: number) {
  const rest = list.filter((_, i) => i !== from);
  return generateKeyBetween(to > 0 ? rest[to - 1].position : null, to < rest.length ? rest[to].position : null);
}
```

- Sort on the client with plain `<`/`>` string comparison (never `localeCompare`); the DB column uses `collate "C"` so both agree.
- Reorder with `react-native-draggable-flatlist`: lifted row scales to 1.03 with `shadow.lg`; `Haptics.selectionAsync()` whenever the row crosses another. One optimistic single-row update per drop.
- Every row also has the prototype's `arrow_upward` (move up one) and `close` (remove) buttons, which are the accessible alternatives to dragging.
- `PickDivider` after position 10: "Pick for me draws from the ten above".
- Filter chips (All, Books, Movies, Shows) filter the view only; dragging is disabled while a filter is active.
- Shake on this screen (Accelerometer magnitude above 1.8g twice within 500ms) opens Pick for me.

### 11.8 Pick for me (`app/(app)/pick.tsx`, `PickDeck`)

1. Load the top 10 queue items. Dim the screen (`surfaceScrim`).
2. Shuffle (about 1s): ten face-down cards riffle with alternating ±x offsets and small rotations, then fan into an arc. Light haptic ticks during the shuffle.
3. `Kiri` paw (SVG) slides up from the bottom edge and bats one card out of the arc.
4. The card flips (`rotateY` with two faces, `backfaceVisibility: 'hidden'`) to reveal cover, title, media shape and reason; `notificationAsync(Success)`.
5. "Start this" sets Reading/Watching (via the status RPCs) and opens the detail. "Pick again" reshuffles excluding already-picked items this session. "Close" dismisses.

Reduced motion: skip steps 2–3 and cross-fade the revealed card. Choice uses `Math.random()` uniformly over the remaining candidates.

```ts
export function pickReason(item: QueueItem, top10: QueueItem[], loan: OpenLoan | undefined, today: Date): string {
  if (loan?.direction === 'borrowed' && loan.dueOn && daysBetween(today, loan.dueOn) <= 14)
    return `due back at ${loan.party} ${fmtDay(loan.dueOn)}`;
  const effort = (x: QueueItem) => x.kind === 'book' ? (x.pagesLeft ?? 300) * 1.5
    : x.kind === 'movie' ? (x.runtimeMin ?? 120) : (x.episodesLeft ?? 8) * 45;
  if (top10.every((o) => effort(item) <= effort(o))) return 'the shortest thing in your queue';
  if (item.progressPct && item.progressPct > 0) return `you're already ${item.progressPct}% in`;
  const n = daysBetween(item.addedAt, today);
  return n === 0 ? 'queued today' : `queued ${n} days ago`;
}
```

### 11.9 Collections and drag-to-collect

- Mosaic uses the first four items by collection position; media-shape counts under the name.
- Adding: detail pages' "+ Add" chip opens `addToCollection` (checkbox list + "New collection"); the TMDB franchise sheet can create "{Series} Collection" and add all parts; collection detail "Add items" opens a picker combining library search and TMDB search.
- **Drag to collect:** long-pressing any `CoverCard`/`MediaRow` (`Gesture.Pan().activateAfterLongPress(350)`) writes `{ item, x, y }` to a drag store; the root `DragLayer` renders the lifted card following the finger; the `tray` sheet rises with collection chips, each registering its window rect (`measureInWindow`) in the store. Dropping over a chip calls `add_to_collection`, pulses the chip and shows "+1"; dropping elsewhere cancels. Haptic on lift and on hover-enter of a chip.
- Suggestions row (`auto_awesome`): for movies in the collection that belong to a TMDB collection, list parts not yet in the user's library ("More in this series: IT Chapter Two").

### 11.10 Library views

- **Grid:** 3 columns of `BookCover`/poster cards; overlay a thin `ProgressBar` (reading), stars (rated), or a due `Badge` (on loan).
- **List:** `MediaRow` with swipe right = next logical status ("Start reading", "Mark watched") and swipe left = Up next, Collection, Delete (use Gesture Handler `ReanimatedSwipeable`).
- **Shelf** (books only): `SpineTile` width = clamp(map(pages, 100 → 1200, 18 → 44dp)), height 150–190dp seeded by id, color from `GeneratedCover` palette (or dominant cover color later), title rotated −90°. Tiles wrap into shelf rows separated by a `desk1`/`desk2` shelf line with `shelfGap` spacing. Prototype hint: "wider spine, longer book". Tap: spine tilts out (rotateZ −8°, translateY −12) then pushes the detail route.
- Sort options: Recently updated, Title, Rating, Date added. Script toggle changes which title leads and the sort key (romanized sort when English-first).

### 11.11 TMDB add flow

- Search debounced 300ms, min 2 characters, `keepPreviousData`. Result rows show "＋" (quick add as Watchlist) that flips to "Added"; long-press "＋" opens a status choice. Rows for items already in the library show "Added" from the local cache.
- Preview sheet (`tmdbPreview`): poster, meta, 3-line overview (expandable), "Already watched" and "Add to watchlist".
- Adding a show calls `tmdb { action: 'show' }` (fills the episode cache) and then `add_tmdb_item`. "Already watched" for a show opens the show detail so the user can mark seasons.
- Adding a movie with `collection` fetches its parts; if others exist, show the `franchise` sheet (prototype copy: "IT is part of a 2-film series. Add the other one too?", with a checkbox to also create a collection named after the series).

### 11.12 Search

Global search: debounce 250ms, NFC-normalized, calls `search_library`. Idle state shows the last 8 searches from MMKV plus quick filters. Results grouped by media type with media shapes. No results: "Search TMDB for '{q}'" and "Add '{q}' as a book" (opens Review in manual mode with the title prefilled).

### 11.13 Settings, export, deletion

- Settings rows follow the prototype groups: account; reading (goal, default loan length, default library); reminders (time picker, 3-day, 1-day); display (night reading Off/On/System, lead script, include specials); data (export); about (TMDB attribution with logo and the notice "This product uses the TMDB API but is not endorsed or certified by TMDB", privacy policy, terms, version); Delete account.
- Export: `export_my_data()` → write `calico-export-YYYY-MM-DD.json` → `expo-sharing`. Also offer a flattened books CSV.
- Delete: dedicated screen with the prototype copy and counts ("This removes your 7 books, 2 movies, 3 shows, all loans, collections and notes."), type DELETE to enable "Delete everything", then `delete-account`.

### 11.14 Haptics map

| Event | Haptic |
|---|---|
| Ruler tick / crossing a row while dragging / pick shuffle | `selectionAsync` |
| Ruler every 10 pages, episode tap, card lift | `impactAsync(Light)` |
| Returned, mark season complete | `impactAsync(Medium)` |
| Renew stamp | `impactAsync(Heavy)` |
| Ticket tear | `impactAsync(Rigid)` |
| Book finished, pick reveal, barcode found | `notificationAsync(Success)` |
| Errors (daily limit, AI failed) | `notificationAsync(Error)` |

### 11.15 Accessibility and performance

- `accessibilityLabel` on every icon button (prototype `label` props), media shapes announce "Book", "Movie", "TV show"; episode squares announce "Season 2, episode 5, Regent, not watched".
- Reduced motion (`useReducedMotion()`): replace all signature animations with cross-fades; keep haptics.
- Font scale to 200%: long Sinhala titles wrap on detail screens, truncate only in grids.
- Target a mid-range Android phone: FlashList everywhere lists can exceed 30 rows, memoized rows, images at display size, no JS-thread animations.

---
## 12. Configuration

### 12.1 `app.config.ts`

```ts
import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Calico',
  slug: 'calico',
  scheme: 'calico',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  android: {
    package: 'com.yourname.calico',            // decide before the first Play upload; cannot change later
    edgeToEdgeEnabled: true,
    adaptiveIcon: { foregroundImage: './assets/images/adaptive-icon.png', backgroundColor: '#FBF6EE' },
    permissions: ['CAMERA', 'POST_NOTIFICATIONS', 'VIBRATE'],
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  plugins: [
    'expo-router',
    'expo-font',
    ['expo-camera', { cameraPermission: 'Calico uses the camera to scan barcodes and photograph book covers.', recordAudioAndroid: false }],
    ['expo-image-picker', { photosPermission: 'Calico lets you pick a book cover photo from your gallery.' }],
    ['expo-notifications', { icon: './assets/images/notification-icon.png', color: '#EC6426' }],
    ['expo-splash-screen', { backgroundColor: '#FBF6EE', image: './assets/images/splash.png', imageWidth: 180 }],
    '@react-native-google-signin/google-signin',
    '@sentry/react-native/expo',
  ],
  experiments: { typedRoutes: true },
  extra: { eas: { projectId: process.env.EAS_PROJECT_ID } },
};
export default config;
```

### 12.2 Environment

`.env` (client, safe to ship): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (anon or publishable key), `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_SENTRY_DSN`. Validate all of them with zod at startup in `src/lib/env.ts`. Server secrets live only in Supabase (section 8.6). The TMDB token and Gemini key never ship in the app.

### 12.3 `eas.json`

Profiles: `development` (dev client, internal distribution, APK), `preview` (internal APK against the production Supabase project with a test account), `production` (AAB, `autoIncrement: true`). EAS Update channels match the profile names; ship JS-only fixes with `eas update --channel production`.

---

## 13. Build phases

Stop at the end of every phase for review. "Done when" items are the acceptance criteria.

### Phase 0: Foundation and design system
- Create the Expo app (SDK 57, TypeScript, expo-router), install section 3 packages, ESLint + Prettier, Jest, path aliases (`@/`).
- Run Appendix A; commit `design/Calico_Prototype.html`; git-ignore `design/unpacked/`.
- Tokens, themes, typography, `Txt`, `Icon` (with glyph-map script), `Press`, `ThemeProvider` with day/night.
- All section 6.1 primitives and the static parts of 6.2 (`MediaShapeIcon`, `GeneratedCover`, `BilingualTitle`, `DateStamp`, `TicketStub`, `EpisodeSquare`, `CollectionMosaic`, `Kiri`).
- `app/dev/components.tsx` gallery.
- **Done when:** a development build runs on a physical Android phone; the gallery matches the prototype in both themes; "මාර්ටින් වික්‍රමසිංහ" renders with correct conjuncts and no clipping at 200% font scale.

### Phase 1: Backend and auth
- `supabase init`, migrations 0001–0003 (all RPCs), 0004 cron, pgTAP RLS tests, seed, generated types.
- Supabase client, auth provider, Google sign-in, Welcome screen, protected tab shell with the custom tab bar and capture button, profile query, sign out.
- Query client with MMKV persistence, NetInfo online manager, mutation registry, `OfflineBanner`, toast and sheet hosts.
- **Done when:** Google sign-in works on device with the dev keystore; `supabase test db` passes; the seed user's data loads; killing the app offline and reopening shows cached data.

### Phase 2: Books
- Library tab (Books segment: grid, list, shelf; filters with counts; sort; script toggle; swipe actions).
- Book detail with `StatusRail`, progress, pace, sparkline, reading history, notes, overflow menu (edit, add to up next, change cover, delete).
- Manual add (Review screen in manual mode), `set_book_status`, `log_page`, `finish_book`, `stop_book` with their sheets; `PageRuler`.
- Home: greeting, search pill, Continue reading, night toggle, empty state.
- **Done when:** flow F3 (log pages, then finish) works; logging a page in airplane mode syncs after reconnecting and the app restart in between; `computePace` and `estimateFinish` have unit tests covering fewer than 3 logs, gaps longer than 14 days, and backwards logs.

### Phase 3: Capture
- `isbn-lookup` and `extract-book` functions with secrets; camera (barcode, cover, back, gallery), crop, upload, reading animation, review with confidence states, duplicate notice, error states, offline drafts.
- **Done when:** flows F1 and F2 pass on device; 20 real covers (at least 10 Sinhala) are tested and the results recorded in `docs/ai-eval.md`; the 31st extraction of the day returns the daily-limit state.

### Phase 4: Loans and reminders
- Loan form on detail and in Review, `LoanSlip` with renew/returned/overdue, `loanQuick`, Home Due soon row, lent-out loans, notification permission sheet, `syncLoanReminders`, notification actions and deep links, dev notifications screen (schedule a test reminder 10 seconds out).
- **Done when:** flow F4 passes; reminders survive app restart and reinstall (resynced on first launch); returning a book cancels its reminders.

### Phase 5: Movies and shows
- `tmdb` and `refresh-shows` functions; TMDB search, preview, quick add, franchise sheet; Movies and Shows library segments; movie detail with ticket stubs and viewings; show detail with `NextEpisodeCard`, `EpisodeGrid` (tap, hold, paint), expanded season list, specials toggle, finished-show prompt; Home Continue watching with the prototype card and caught-up line.
- **Done when:** flows F5 and F6 pass; `nextEpisode` unit tests match `show_progress` for specials, unaired and out-of-order cases; the cron job updates `next_air_date` in a staging project.

### Phase 6: Up next, Pick for me, collections, search
- Up next tab (drag, move up, remove, filters, divider, auto-removal with undo), Pick for me overlay with shake trigger, Home Up next preview.
- Collections tab, detail, new collection sheet, add-to-collection sheet, drag-to-collect tray, suggestions row, "All to up next".
- Global search.
- **Done when:** flows F7 and F8 pass; reordering 50 items keeps a stable order after refetch; `pickReason` and `keyForMove` have unit tests.

### Phase 7: Stats, settings, polish
- `year_stats`, `home_stats`, Your year screen; Settings; export; delete account; night reading (Off/On/System) everywhere including system bars.
- Every screen's empty, loading (skeletons), error and offline states per the prototype; reduced motion; TalkBack pass; 200% font pass; performance pass on a low-end device.
- **Done when:** all screens in section 10 match the prototype in both themes; no screen drops below ~55 fps while scrolling on the low-end test phone.

### Phase 8: Release
- Sentry, EAS production build, Play Console listing, privacy policy page, account-deletion web page (a static page linked from the listing that explains in-app deletion and gives a contact email), Data safety form, content rating, closed testing track, production rollout.
- **Done when:** the production AAB is live on the closed testing track and the Section 15 checklist is complete.

---

## 14. Testing

- **Unit (Jest):** `computePace`, `estimateFinish`, `nextEpisode`, `keyForMove`/`appendKey`, `pickReason`, ISBN validation and 10→13 conversion, Sinhala detection and run splitting in `Txt`, `dueLine` copy, `syncLoanReminders` diffing (mock expo-notifications), zod schemas.
- **Component (RNTL):** `StatusRail` transitions, `ConfidenceField` states, `LoanSlip` variants, `EpisodeGrid` tap handling, Review form conditional fields.
- **Database (pgTAP):** RLS isolation for every table and the storage bucket; `create_book` idempotency; `log_page` backwards replacement; `renew_loan` validation; `show_progress` next episode with specials and unaired episodes.
- **E2E (Maestro, `.maestro/`):** flows F1–F8 from the UX brief using `testID`s on every interactive element; run against a local Supabase with the seed and mocked edge functions (a `MOCK_EDGE=1` build flag that returns fixtures).
- **Manual device matrix:** one low-end Android (2–3 GB RAM, Android 10–11), one mid-range current Android; check Sinhala rendering, camera in low light, notifications with battery saver on, offline capture.

---

## 15. Launch checklist (Google Play)

- [ ] Final package name and app signing via Play App Signing; add its SHA-1 to the Google OAuth Android client.
- [ ] Privacy policy URL covering: Google account email and name, book photos stored in Supabase, cover photos sent to Google Gemini for text extraction, TMDB lookups, crash data (Sentry), data deletion.
- [ ] Data safety form matching the policy (data encrypted in transit; user can request deletion).
- [ ] In-app account deletion (Settings) plus a web page URL for deletion requests in the listing.
- [ ] TMDB attribution (logo + notice) in Settings → About.
- [ ] Notification permission requested only in context; app works fully if denied.
- [ ] Target API level meets the current Play requirement at submission time.
- [ ] Closed testing: new personal developer accounts must run a closed test with a minimum number of testers for a minimum period before production access; check the current numbers in Play Console.
- [ ] Store listing: screenshots from the day and night themes, short description, feature graphic.
- [ ] Gemini, TMDB and Supabase usage alerts and billing limits configured.

---

## 16. Decisions needed from the product owner

| Decision | Default in this plan |
|---|---|
| Android package name | `com.yourname.calico` placeholder |
| Daily AI cover reads per user | 30 |
| Gemini model | `gemini-3.6-flash`, re-evaluated after the Phase 3 cover test |
| Night reading default | Off (day), with System available |
| Lead script default | English first (as in the prototype) |
| Hosting for privacy policy and deletion page | Any static host (for example a small Vercel site) |

---

## Appendix A: Unpack the prototype bundle

Save as `scripts/unpack_prototype.py` and run `python3 scripts/unpack_prototype.py design/Calico_Prototype.html design/unpacked`.

```python
import base64, gzip, json, re, sys, pathlib

src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
html = src.read_text(encoding="utf-8")

def block(kind):
    m = re.search(r'<script type="__bundler/' + kind + r'">(.*?)</script>', html, re.S)
    return m.group(1) if m else None

manifest = json.loads(block("manifest"))
for uuid, res in manifest.items():
    if res["mime"].startswith("font"):
        continue
    data = base64.b64decode(res["data"])
    if str(res.get("compressed")).lower() == "true":
        data = gzip.decompress(data)
    text = data.decode("utf-8", errors="replace")
    if text.startswith("/* @ds-bundle"):
        (out / "ds.js").write_text(text, encoding="utf-8")          # design-system components source
    elif "react.production" not in text[:400] and "react-dom" not in text[:400]:
        (out / f"runtime-{uuid[:8]}.js").write_text(text, encoding="utf-8")

template = json.loads(block("template"))
template = re.sub(r"@font-face\s*\{[^}]*\}", "", template)            # drop embedded font blobs
(out / "template.html").write_text(template, encoding="utf-8")        # markup + inline styles + tokens

m = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', template, re.S)
if m:
    (out / "app.js").write_text(m.group(1), encoding="utf-8")         # screen logic + sample data

tokens = {}
for name, value in re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", template):
    tokens.setdefault(name, value.strip())                              # first = day (:root); night overrides come later
(out / "tokens.json").write_text(json.dumps(tokens, indent=2), encoding="utf-8")
print("unpacked to", out)
```

Outputs: `ds.js` (the 23 design-system components and UI-kit source), `template.html` (every screen's markup with inline styles; search for `isHome`, `isLibrary`, `sheetRuler`, etc.), `app.js` (state, sample data, screen view-models such as `homeV()`, `detailV()`, `queueV()`), and `tokens.json` (all CSS custom properties, for checking `src/theme/tokens.ts`).

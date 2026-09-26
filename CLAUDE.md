# Calico – working rules

Engineering source of truth: `docs/build-plan.md`. Visual source of truth: `design/Calico_Prototype.html`
(unpack with `npm run unpack:design` to read `design/unpacked/app.js`, `template.html`, `ds.js`).
Expo-specific guidance: @AGENTS.md

## Commands

- `npx expo start --dev-client` – run app (requires a dev build: `eas build -p android --profile development`)
- `npm run typecheck` / `npm run lint` / `npm test`
- `npm run gen:icons` – regenerate `src/components/ds/iconGlyphs.json` after using a new `<Icon name>`
- `npm run db:start` / `npm run db:reset` – local Supabase (Docker); migrations + seed
- `npm run db:test` – pgTAP tests (`supabase/tests/*.test.sql`)
- `npm run db:types` – regenerate `src/types/database.ts` after every migration
- `npm run db:test:local` – no Docker: migrations + seed + pgTAP on plain Postgres 16 with a Supabase shim
- `supabase functions serve` – run edge functions locally
- When a new migration lands, bump `LATEST_MIGRATION` in `src/lib/queryClient.ts` (cache buster)
- Cloud sandbox: `expo install` cannot reach api.expo.dev → `EXPO_OFFLINE=1 npx expo install <pkg>`.
  Container registries are blocked, so `supabase start` / `gen types` don't work there; use
  `npm run db:test:local`, and generate types with `@supabase/postgres-meta` from npm
  (`PG_META_DB_URL=… PG_META_GENERATE_TYPES=typescript PG_META_GENERATE_TYPES_INCLUDED_SCHEMAS=public node …/dist/server/server.js`).

## Rules

- Styles only from `src/theme` tokens via `useTheme()` / `makeStyles()`. No raw hex, px sizes or ms durations in screens.
- Text only through `<Txt>` (handles Sinhala font + line height). Never use bare `<Text>`.
- Copy only from `src/i18n/en.ts`.
- Multi-table writes go through Postgres RPCs (atomic, replayable offline). Single-row writes may use table APIs.
- Client generates UUIDs for new rows (`crypto.randomUUID()`), so offline creates are idempotent.
- Dates: store `date` columns as local Colombo dates (`yyyy-MM-dd`) computed on the client; timestamps as UTC.
- Book status changes go through `useBookStatusChange()` (Read → Finish sheet, Abandoned → Stop sheet, Reading → start date).
- Tests that render the app (`renderRouter`) call `cleanupAppState` in `afterAll` so Jest can exit.
- Edge functions: `handler.ts` (dependency-injected, Deno-tested via `npm run fn:test`) + `index.ts` (`Deno.serve`).
  Pure code shared with the app lives in `supabase/functions/_shared/` and is imported as `@shared/*.ts`.
- The capture flow keeps one draft in `useCaptureStore` (`src/features/capture/store.ts`); covers upload to
  `covers/{uid}/{itemId}/front|back.jpg`. Offline captures go to `useDrafts` and are read by `processDrafts()`.
- Loans: mutations in `src/features/loans/hooks.ts` (optimistic, call `requestReminderSync()`); Undo after
  Returned is the `reopen_loan` RPC. Reminders are diffed against `getAllScheduledNotificationsAsync()` by
  identifier `loan:{loanId}:3d|1d` + a content signature (`features/loans/logic.ts`); never request
  notification permission outside the `notif` sheet.
- Follow-up toasts use `useToastStore.getState().enqueue()`; an action that should cancel them calls `clearQueue()`.
- Movies and shows: `src/features/media` (lists from `items` + `movies`/`shows`; `show_progress()` for Home and
  Library; per-show `tmdb_episodes` + `episode_watches` for detail). `nextEpisode`/`progressOf` mirror SQL
  `show_progress` for optimistic updates. Media writes share `MEDIA_SCOPE`, so they run in order (add before
  collection or episode marks). TMDB is only reached through the `tmdb` edge function; DTO types live in
  `@shared/tmdb.ts`; images load straight from `image.tmdb.org`.
- Router tests: never call `findBy*` inside `act()` (it waits forever); find first, then act.
- Anything that lists "whatever it is" (Up next, collections, search, Pick) uses `useLibraryItems()`
  (`src/features/library/items.ts`) and `ItemCover`. Queue moves compute from the query cache at call time
  (`keyForMove` on the current order), never from a render-time index.
- Screen `presentation` (modals) is declared in the parent layout's `<Stack.Screen>`, not from inside the
  screen: changing it later remounts the screen.
- Drag to collect: `useCollectDrag(item)` on covers, `useDragStore` for the lifted card and chip rects
  (`TargetChip` registers via `measureInWindow`), `DragLayer` in the app layout; tray chips are also tappable.
- Loading/error: lists show `SkeletonGrid`/`SkeletonRows`, detail screens use `DetailLoadState` (skeleton →
  retry on error → "not on your shelf" only when truly missing); a failed query with no cache shows `QueryError`.
- `Press` gives anything under 48dp a 48dp touch target automatically (`minTargetSlop`); `Txt` caps font
  scaling at 200%.
- Global sheets open via `openSheet(name)` (`src/lib/stores/sheet.ts`, rendered by `SheetHost`); toasts via `toast({...})`.
- Every mutation has a `mutationKey` and is registered in `src/lib/mutations.ts` via `setMutationDefaults`, so paused offline mutations resume after restart.
- Pure logic (pace, next episode, pick reasons, fractional keys, ISBN validation) lives in `features/*/logic.ts` with unit tests.
- Every gesture has a visible button alternative. Respect reduced motion (`useReducedMotion`).
- Minimum touch target 48dp (use `hitSlop` when the visual is smaller).
- Match the prototype in `design/unpacked/` for layout and copy.

## Status

- Phase 0 (foundation + design system): merged (PR #1).
- Phase 1 (backend + auth): merged (PR #2), pending on-device Google sign-in check.
- Phase 2 (books): merged (PR #3), pending device review.
- Phase 3 (capture): merged (PR #4), pending on-device F1/F2 check and the 20-cover eval (`docs/ai-eval.md`).
- Phase 4 (loans + reminders): merged (PR #5), pending on-device F4 and reminder checks.
- Phase 5 (movies + shows): merged (PR #6), pending on-device F5/F6 and the cron run in a staging project.
- Phase 6 (up next, pick, collections, search): merged (PR #7), pending on-device F7/F8, drag-to-collect and shake.
- Phase 7 (stats, settings, polish): done, pending device passes (TalkBack, 200% font, low-end scrolling).

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
- Global sheets open via `openSheet(name)` (`src/lib/stores/sheet.ts`, rendered by `SheetHost`); toasts via `toast({...})`.
- Every mutation has a `mutationKey` and is registered in `src/lib/mutations.ts` via `setMutationDefaults`, so paused offline mutations resume after restart.
- Pure logic (pace, next episode, pick reasons, fractional keys, ISBN validation) lives in `features/*/logic.ts` with unit tests.
- Every gesture has a visible button alternative. Respect reduced motion (`useReducedMotion`).
- Minimum touch target 48dp (use `hitSlop` when the visual is smaller).
- Match the prototype in `design/unpacked/` for layout and copy.

## Status

- Phase 0 (foundation + design system): merged (PR #1).
- Phase 1 (backend + auth): done, pending on-device Google sign-in check.

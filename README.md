# Calico

Android app (Expo / React Native) for tracking books, library loans, movies and TV shows.

- Build plan (engineering source of truth): [`docs/build-plan.md`](docs/build-plan.md)
- Visual source of truth: [`design/Calico_Prototype.html`](design/Calico_Prototype.html) — run `npm run unpack:design`
  to get readable `design/unpacked/` sources. The original Claude Design handoff bundle is in `design/handoff/`.
- Working rules for contributors and agents: [`CLAUDE.md`](CLAUDE.md)

## Getting started

```sh
npm install
cp .env.example .env            # fill in (see below)
npm run typecheck && npm run lint && npm test
```

### Local backend

```sh
npm run db:start                 # supabase start (Docker); prints the API URL + anon key for .env
npm run db:reset                 # apply migrations + seed
npm run db:test                  # pgTAP: RLS isolation + RPC behaviour
npm run db:types                 # regenerate src/types/database.ts after a migration
```

No Docker? `npm run db:test:local` runs the migrations, seed and pgTAP tests on a throwaway local
Postgres 16 (needs `postgresql-16`, `postgresql-16-pgtap`, `postgresql-16-cron`) with a small shim for
Supabase's `auth` / `storage` schemas (`supabase/tests/local/supabase_shim.sql`).

The seed creates one user with the prototype's sample data. In a development build the Welcome screen
has a "Dev: sign in as the seed user" link (`dilan@calico.test` / `calico-dev`) — local only.

### Edge functions

`isbn-lookup` (Open Library, then Google Books), `extract-book` (Gemini reads the cover photos), `tmdb`
(TMDB search and details; fills the shared episode cache) and `refresh-shows` (nightly cron) live in
`supabase/functions/`. Pure helpers shared with the app are in `supabase/functions/_shared/` and
imported in the app as `@shared/*`.

```sh
supabase functions serve         # local
npm run fn:test                  # Deno unit tests for the handlers (needs deno)
supabase secrets set GEMINI_API_KEY=… CONTACT_EMAIL=… TMDB_READ_TOKEN=… CRON_SECRET=…   # production
```

| Secret                 | Used by                 | Notes                                            |
| ---------------------- | ----------------------- | ------------------------------------------------ |
| `GEMINI_API_KEY`       | `extract-book`          | required                                         |
| `GEMINI_MODEL`         | `extract-book`          | default `gemini-3.6-flash`                       |
| `AI_DAILY_LIMIT`       | `extract-book`          | cover reads per user per Colombo day, default 30 |
| `GOOGLE_BOOKS_API_KEY` | `isbn-lookup`           | optional (higher quota)                          |
| `CONTACT_EMAIL`        | `isbn-lookup`           | sent in the Open Library `User-Agent`            |
| `TMDB_READ_TOKEN`      | `tmdb`, `refresh-shows` | TMDB v4 read access token                        |
| `CRON_SECRET`          | `refresh-shows`         | must match the `cron_secret` Vault secret        |

The nightly `refresh-shows` job (02:00 Colombo, migration `…04_cron.sql`) reads two Vault secrets:
`project_url` (e.g. `https://<ref>.supabase.co`) and `cron_secret` (same value as `CRON_SECRET`). Create
them in Supabase → Project Settings → Vault. The function skips JWT checks (`supabase/config.toml`) and
rejects calls without the right `x-cron-secret`.

### Reminders

Library due-date reminders are local notifications (`expo-notifications`), scheduled 3 days and 1 day
before each due date at the profile's reminder time (Colombo). They are resynced from the loans on every
launch, on foreground (hourly) and after every loan change. In a development build, Settings → "Notifications
(dev)" previews them, sends a test reminder in 10 seconds (its Renew / Open / Returned buttons deep-link to
the book) and lists what is scheduled.

Cover-reading quality is tracked in [`docs/ai-eval.md`](docs/ai-eval.md).

### Google sign-in

Native Google sign-in needs a development build (not Expo Go):
`eas build -p android --profile development`, then `npx expo start --dev-client`.

1. Google Cloud console → APIs & Services → Credentials:
   - an OAuth **Web** client. Its client ID and secret go into Supabase → Authentication → Providers →
     Google (and `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `_SECRET` for the local stack); its client ID
     also goes into `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
   - an OAuth **Android** client for package `com.yourname.calico` with the SHA-1 fingerprints from
     `eas credentials` (development, preview and production keystores; after the first Play upload also
     Play App Signing's SHA-1).
2. In Supabase → Google provider, enable "Skip nonce checks" (the Android SDK sends no nonce;
   `skip_nonce_check = true` in `supabase/config.toml` does the same locally).
3. A failed sign-in shows the prototype's "Google sign-in didn't finish. Try again." row.

## Status

| Phase | Scope                              | State                                           |
| ----- | ---------------------------------- | ----------------------------------------------- |
| 0     | Foundation and design system       | Merged                                          |
| 1     | Backend and auth                   | Merged — pending on-device Google sign-in check |
| 2     | Books                              | Merged — pending device review                  |
| 3     | Capture                            | Merged — pending device check and cover eval    |
| 4     | Loans and reminders                | Merged — pending device check (F4, reminders)   |
| 5     | Movies and shows                   | Merged — pending device check (F5, F6, cron)    |
| 6     | Up next, pick, collections, search | Done — pending device check (F7, F8, shake)     |
| 7–8   | See build plan §13                 | Not started                                     |

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

| Phase | Scope                        | State                                         |
| ----- | ---------------------------- | --------------------------------------------- |
| 0     | Foundation and design system | Merged                                        |
| 1     | Backend and auth             | Done — pending on-device Google sign-in check |
| 2–8   | See build plan §13           | Not started                                   |

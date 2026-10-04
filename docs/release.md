# Release runbook (Phase 8)

The code side of the release is in the repo. The steps below happen in Play Console, EAS, Sentry,
Supabase and Google Cloud, and need the account owner. Work top to bottom; each step says where it
happens and what "done" looks like. Section 15 of the build plan is the checklist this follows.

## 1. Package name and contact

- Android package: **`com.codeville.calico`** (`app.config.ts`). It can never change after the first
  Play upload. Earlier development builds used the placeholder `com.yourname.calico`: make a new
  development build, and create the Google OAuth Android clients for the new package (step 2).
- Public contact / support email: **vihangarashansilva@gmail.com**. It's on the public pages, the Play
  listing's contact details and the OAuth consent screen, and it's the Supabase `CONTACT_EMAIL` secret
  (Open Library `User-Agent`).

## 2. Services

**Supabase (production project)**

- Link and push: `supabase link --project-ref <ref>`, `supabase db push`, `supabase functions deploy`
  (all five functions: `isbn-lookup`, `extract-book`, `tmdb`, `refresh-shows`, `delete-account`).
- Secrets: see the README table (`GEMINI_API_KEY`, `TMDB_READ_TOKEN`, `CRON_SECRET`, `CONTACT_EMAIL`, …).
- Vault: `project_url` and `cron_secret` for the nightly `refresh-shows` job.
- Auth → Google provider: the Web client ID and secret.
- Spend cap on, usage alerts on (Organization → Billing).

**Google Cloud**

- OAuth consent screen: app name Calico, the support email, scopes `email`, `profile`, `openid` only,
  no logo (a logo triggers brand verification). While it's in "Testing", only listed test users can
  sign in. Publishing needs the home page and privacy policy URLs, so publish after step 3: Branding →
  home, privacy and terms URLs + the host under Authorized domains → Audience → Publish app.
- Android OAuth client with the final package name and the **Play App Signing** SHA-1 (step 5). Keep
  the upload-key and EAS development SHA-1 clients too, so development and preview builds still sign in.
- Gemini API: use a billing-enabled (paid tier) key so prompts and photos aren't used to improve
  Google's products, and set a budget alert.

**TMDB**: the API key's application details name Calico and the listing URL; attribution is in Settings → About.

**Sentry**

- Create a React Native project. Copy the DSN into the EAS environment variable
  `EXPO_PUBLIC_SENTRY_DSN` (production + preview).
- Add `SENTRY_ORG`, `SENTRY_PROJECT` (plaintext) and `SENTRY_AUTH_TOKEN` (secret) as EAS environment
  variables so builds upload source maps.
- Crash reporting is off in development builds and whenever the DSN is empty. Before release, send one
  test crash from a preview build and check the event in Sentry: it should carry only the user `id`,
  paths without query strings, and no console breadcrumbs (`src/lib/sentryScrub.ts`).

**Client environment for EAS builds**: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`,
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_PRIVACY_URL`,
`EXPO_PUBLIC_TERMS_URL`. `EXPO_PUBLIC_APP_ENV` is set per profile in `eas.json`.

## 3. Public pages (privacy policy, account deletion, terms)

The pages are in `site/`, with the contact address from step 1 filled in at build time:

```sh
npm run site:build     # → site/dist/  (CONTACT_EMAIL=… overrides the address)
```

Host `site/dist` anywhere static. On Vercel: new project from this repo, **Root Directory** `site`;
`site/vercel.json` already sets the build command and output.
You get:

| Page           | URL                             | Used in                                                       |
| -------------- | ------------------------------- | ------------------------------------------------------------- |
| Privacy policy | `https://<host>/privacy`        | Play listing, OAuth consent screen, `EXPO_PUBLIC_PRIVACY_URL` |
| Delete account | `https://<host>/delete-account` | Play Console → Data safety → "Delete account URL"             |
| Terms          | `https://<host>/terms`          | `EXPO_PUBLIC_TERMS_URL`                                       |

If anything in the app changes what data leaves the phone (a new service, analytics, ads), update
`site/privacy.html`, the Data safety answers below, and `POLICY_UPDATED` when building.

## 4. Builds

```sh
npx eas-cli@latest build -p android --profile preview      # internal APK: full pass on two phones
npx eas-cli@latest build -p android --profile production   # AAB, versionCode auto-increments (remote)
```

Before the production build, finish the device passes still open from earlier phases (listed in the
README under "Status"). The preview profile talks to the production Supabase project; use a test account.

Native changes need a new build **and** a new `version` in `app.config.ts` (the runtime is the app version,
so older builds never receive an update they can't run). 1.1.0 added the home-screen widgets: install a new
development and preview build after it.

## 5. Play Console

1. **Create the app**: name Calico, app (not game), free, default language English (United Kingdom or
   United States).
2. **Play App Signing**: accept Google-managed signing on the first upload. Then App integrity → App
   signing → copy the **app signing key SHA-1** into the Google Cloud Android OAuth client (step 2).
   Without it, Google sign-in fails in every Play-installed build.
3. **Upload**: Testing → Closed testing → create a track, upload the production `.aab`, or use
   `npx eas-cli@latest submit -p android --profile production` with a Play service-account key.
4. **Target API level**: Expo SDK 57 builds target API 36, which meets the current requirement. Check
   the "Target API level" requirement in Play Console on the day you submit.
5. Complete **App content** (below), the **store listing** (below) and **Pricing & distribution**
   (all countries or Sri Lanka first).
6. **Closed test**: new personal developer accounts must run a closed test with a minimum number of
   opted-in testers for a minimum number of consecutive days before they can apply for production
   access. Check the numbers Play Console shows for your account, invite testers by email list or
   Google Group, and keep the test running for the full period.
7. **Production**: apply for production access, then roll out in stages (e.g. 20% → 50% → 100%)
   while watching Sentry and Android vitals.

## 6. App content answers

### Privacy policy

`https://<host>/privacy`

### Ads

No ads.

### App access

Everything is behind Google sign-in. Give reviewers a way in: add a Google test account under
"All or some functionality is restricted" with instructions ("Sign in with Google using the account
below"), and seed it with a few books, a loan and a show.

### Content rating (IARC questionnaire)

- Category: **All other app types** (a personal tracker).
- Violence, sexuality, language, controlled substances, gambling: **No**.
- Users can interact or exchange content with each other: **No** (there is no sharing between accounts).
- Shares the user's location: **No**. Digital purchases: **No**.
- Note: search results show TMDB posters and plot summaries for films of any age rating. Answer
  the questionnaire's "unrestricted access to online content" style questions honestly; this usually
  still lands at a low age rating, but record whatever rating comes back here.

### Target audience

18+ (or 13+). Not designed for children; don't opt in to Families.

### Data safety

Matches `site/privacy.html`. Everything below is **collected** (sent off the device) and **not shared**:
the providers (Supabase, Google Gemini, Open Library/Google Books, TMDB, Sentry) process data on
Calico's behalf, which Play doesn't count as sharing.

| Play data type                                                                         | Collected | Required? | Purposes                                       |
| -------------------------------------------------------------------------------------- | --------- | --------- | ---------------------------------------------- |
| Personal info → Name                                                                   | Yes       | Required  | App functionality, Account management          |
| Personal info → Email address                                                          | Yes       | Required  | App functionality, Account management          |
| Personal info → User IDs                                                               | Yes       | Required  | Account management, Analytics (crash grouping) |
| Personal info → Other info (lender/friend names on loans)                              | Yes       | Optional  | App functionality                              |
| Photos and videos → Photos                                                             | Yes       | Optional  | App functionality                              |
| App activity → Other user-generated content (library, notes, ratings, Ask Pinki chats) | Yes       | Required  | App functionality                              |
| App activity → App interactions (when episodes are marked watched)                     | Yes       | Required  | App functionality, Personalization             |
| App info and performance → Crash logs                                                  | Yes       | Required  | Analytics (app stability)                      |
| App info and performance → Diagnostics                                                 | Yes       | Required  | Analytics (performance traces, 10% sample)     |

- Not collected: location, contacts, messages, audio, files, calendar, financial info, health, web
  history, installed apps, device or other IDs (confirm this on a real Sentry event: if it shows a
  device identifier, declare "Device or other IDs" for Analytics).
- Is all data encrypted in transit? **Yes**.
- Can users request deletion? **Yes**: in-app (Settings → Delete account) and at the delete-account URL.
- Independent security review: **No**.

### Other declarations

- News app: No. Government app: No. Financial features: None. Health: No.
- Photo and video permissions: the app uses the system photo picker. The merged manifest only has
  `READ_EXTERNAL_STORAGE` capped at API 32 (from `expo-image-picker`), no `READ_MEDIA_IMAGES`, so no
  photo-permission declaration is needed.
- Camera: used only for barcode scanning and cover photos; the permission text says so.
- Notifications: requested only from the reminders sheet; the app works fully if denied.

## 7. Store listing

**App name**: Calico

**Short description** (80 characters max):

> Track books, library loans, movies and shows. Snap a cover to add a book.

**Full description**:

> Calico keeps your reading and watching in one warm, simple place.
>
> BOOKS
> • Photograph a cover (Sinhala or English) or scan the barcode, and Calico fills in the details.
> • Log the page you're on and see your pace and when you'll finish.
> • Rate, note and finish books; see your reading year at a glance.
>
> LIBRARY LOANS
> • Add the library or friend a book came from, with a due date.
> • Get a reminder three days and one day before it's due. Renew or return in a tap.
>
> MOVIES AND SHOWS
> • Search and add films and series, and mark episodes as you watch.
> • Always know which episode is next.
>
> UP NEXT AND COLLECTIONS
> • Keep one queue for everything you want to read or watch, and let "Pick for me" choose.
> • Group anything into collections.
>
> HOME-SCREEN WIDGETS
> • See the book you're reading, the next episode (tick it from the home screen) and what's due back.
>
> Works offline, has a night reading theme, and exports your data any time. No ads.
>
> This product uses the TMDB API but is not endorsed or certified by TMDB.

**Graphics** (generated by `npm run brand` from `scripts/brand.mjs`, using the design/v2 painted icon and illustrations)

| Play Console field      | File                                        | Spec                                         |
| ----------------------- | ------------------------------------------- | -------------------------------------------- |
| App icon                | `assets/store/play-icon-512.png`            | 512×512 PNG, full square (Play rounds it)    |
| Feature graphic         | `assets/store/feature-graphic-1024x500.jpg` | 1024×500 JPEG, no alpha                      |
| Phone screenshots (2–8) | take on a phone (below)                     | 9:16, at least 1080×1920 for promotion slots |

The app's own launcher icon (adaptive, with a themed monochrome layer), notification icon and
splash come from the same script (`assets/images/`); they change only with a new build.

Screenshots: from a preview build, signed in with a test account that has a few books, a library
loan, a show in progress and some Up next items (not your real data). Take 4–8 at native
resolution: Home, Library grid, a book with its loan slip, the cover-reading Review screen, a show
with the episode grid, Up next, Your year. Include at least two in the night theme.

**Category**: Books & Reference. **Tags**: reading tracker, library, TV tracker.
**Contact details**: vihangarashansilva@gmail.com and the website `https://<host>/`.

## 8. Launch checklist (plan §15)

| Item                                                                               | Where it's handled                                    | Status                |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------- |
| Final package name; Play App Signing SHA-1 in the Google OAuth Android client      | Steps 1, 5.2                                          | Owner                 |
| Privacy policy URL covering Google account, photos, Gemini, TMDB, Sentry, deletion | `site/privacy.html`, step 3                           | Done in repo; host it |
| Data safety form matching the policy                                               | Section 6                                             | Owner                 |
| In-app account deletion plus a deletion web page in the listing                    | Settings → Delete account; `site/delete-account.html` | Done in repo; host it |
| TMDB attribution in Settings → About                                               | `app/(app)/settings/index.tsx`                        | Done                  |
| Notification permission only in context; app works if denied                       | `notif` sheet only (Phase 4)                          | Done; check on device |
| Target API level meets the current Play requirement                                | SDK 57 → API 36                                       | Check on submit day   |
| Closed testing (testers and days per Play Console)                                 | Step 5.6                                              | Owner                 |
| Store listing: screenshots in both themes, short description, feature graphic      | Section 7                                             | Owner                 |
| Gemini, TMDB and Supabase usage alerts and billing limits                          | Step 2                                                | Owner                 |
| Sentry receiving scrubbed crash reports from a release build                       | Step 2 (Sentry)                                       | Owner                 |

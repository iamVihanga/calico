# Calico

Android app (Expo / React Native) for tracking books, library loans, movies and TV shows.

- Build plan (engineering source of truth): [`docs/build-plan.md`](docs/build-plan.md)
- Visual source of truth: [`design/Calico_Prototype.html`](design/Calico_Prototype.html) — run `npm run unpack:design`
  to get readable `design/unpacked/` sources. The original Claude Design handoff bundle is in `design/handoff/`.
- Working rules for contributors and agents: [`CLAUDE.md`](CLAUDE.md)

## Getting started

```sh
npm install
npm run typecheck && npm run lint && npm test
eas build -p android --profile development   # dev client (native Google sign-in needs it)
npx expo start --dev-client
```

In development the app opens the component gallery (`/dev/components`) until Phase 1 adds auth.

## Status

| Phase | Scope                        | State                           |
| ----- | ---------------------------- | ------------------------------- |
| 0     | Foundation and design system | Done — pending on-device review |
| 1–8   | See build plan §13           | Not started                     |

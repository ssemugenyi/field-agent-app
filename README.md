# Nyumban Field Agent App

An offline-first Expo / React Native app for field agents to browse assigned properties and record inspections. Built to keep working through flaky connectivity: every read and write goes through a local SQLite mirror first, with a background sync engine reconciling against the backend API when a connection is available.

## Features

- **Browse properties** — searchable, filterable by region and status, backed by a local mirror so the list works offline.
- **Room-by-room inspections** — for each room, record a condition (`Good` / `Fair` / `Poor` / `Needs repair`), free-text notes, and photos (camera or library).
- **Drafts autosave locally** — every change lands in SQLite immediately, so a killed app or lost connection never loses progress; resume a draft from the property's detail screen.
- **My Inspections** — see every inspection's status at a glance (`Draft` → `Queued` → `Uploading photos` → `Submitting` → `Synced`, or `Needs attention` on failure/conflict).
- **Conflict handling** — if a property changed on the server since the inspection was started, the sync engine surfaces it as `Needs attention` instead of silently overwriting.

## Stack

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) / React Native 0.81
- TypeScript
- Redux Toolkit + RTK Query (`src/store`, `src/api`)
- `expo-sqlite` for local persistence (`src/db`)
- React Navigation (bottom tabs + native stacks) (`src/navigation`)

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the required API key
npx expo start
```

Scan the QR code with Expo Go (SDK 54 build), or press `a` / `i` to open an emulator/simulator.

### Environment

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_ASSESSMENT_KEY` | API access key sent as `X-Assessment-Key` on every request. Never commit it — `.env` is gitignored. |

## Architecture

### Auth

`src/auth` and `src/api/baseQuery.ts` implement session handling against `POST /auth/login` and `POST /auth/refresh`:

- Access tokens expire after 15 minutes with no grace period; a proactive refresh fires ~60s before expiry, with a reactive 401-retry as the fallback.
- Refresh tokens are single-use and rotating — concurrent refresh attempts are coalesced into one in-flight call so a second caller can't spend the token first.
- Being offline with an expired token does not force a logout; only a genuine 401 from the server ends the session.

### Local-first data

`src/db` holds the SQLite schema (`properties`, `rooms`, `inspections`, `photos`, `sync_meta`) and per-table repositories. Every screen reads from and writes to this store directly — the UI never blocks on a network round trip.

### Inspections

An inspection is created as a `draft` row (`src/db/inspections.repo.ts`) the moment an agent starts one from a property's detail screen, capturing the property's `version` at that point for later conflict detection. `InspectionFormScreen` then edits it room by room — condition, notes, and photo attachments — with every change written straight back to SQLite (`updateDraftRooms`), so there's no separate "save" step to forget.

Finishing the form flips the draft to `queued` (`markQueued`) with a locally-generated idempotency key, handing it off to the sync engine. `src/sync/inspectionSync.ts` then, for each queued draft:

1. Uploads any not-yet-uploaded photos (`uploadPhoto`, retried with backoff), tracking each photo's own `pending → uploading → uploaded/failed` status.
2. Builds the submit payload from the current room data plus the now-server-side photo ids, and `POST`s it to `/inspections` with the saved idempotency key so a retried request can't create a duplicate.
3. On success, marks the draft `synced` and deletes the now-uploaded local photo files.
4. On a `409` version conflict, pulls the fresh property record and re-diffs it against the draft's rooms: if the room set still matches, it retries once automatically with the new `propertyVersion`; otherwise (or if a second conflict follows the retry) it marks the draft `conflict` with a message describing what to check, rather than guessing.
5. Any other transient failure (`500`/network/`503`) requeues the draft for the next sync pass instead of failing it outright.

### Sync engine

`src/sync/syncEngine.ts` drains queued work whenever connectivity is restored or the app is foregrounded:

1. `reconciliation.ts` requeues any inspection stuck mid-upload for more than 5 minutes (e.g. the app was killed mid-sync).
2. Queued inspections are processed one at a time via the flow above.
3. `propertySync.ts` runs a background portfolio pull to keep the local property mirror fresh.

`src/api/rateLimiter.ts` caps outgoing requests at 16 per 10-second window client-side and backs off further on a `429`'s `Retry-After` header.

### Navigation

`RootNavigator` switches between the auth stack and the main app based on session state (`src/store`), landing on a bottom-tab layout (`MainTabs`) for **Properties** and **My Inspections**, each with its own native stack for list → detail → form flows.

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the Metro dev server |
| `npm run android` | Start and open on Android |
| `npm run ios` | Start and open on iOS |
| `npm run web` | Start and open in a browser |

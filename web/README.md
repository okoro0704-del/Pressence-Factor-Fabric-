# PFF — Sovereign Web (PWA)

Next.js PWA for the Vitalization Manifesto. **No App Store.** Install via **Add to Home Screen** for the full PFF experience. Built for Lagos; works offline.

## Features

- **PWA manifest** — mrfundzman branding, `standalone` display, installable on home screens.
- **WebAuthn handshake** — `navigator.credentials` / device biometrics (Face ID, Touch ID, fingerprint) for Presence Proof. Works offline.
- **Workbox offline-first** — Manifesto slides and API cached; Presence Proof generatable without internet.
- **Security** — Strict CSP and HSTS via `vercel.json` / `netlify.toml`. **HTTPS only.**
- **How to Install** — Tooltip (top-right) with “Add to Home Screen” instructions, including Lagos-specific copy.
- **Lagos-Proof Offline Sync** — IndexedDB vault (`pff_sync_queue`), AES-256‑encrypted pending proofs, `sync-presence` Background Sync, UUID per handshake, Sync Status (Red / Yellow / Green).
- **Biometric layer** — Registration via `navigator.credentials.create` (userVerification required); `generatePresenceProof()` via `navigator.credentials.get`. Secure context (HTTPS) only. “Scanning…” HUD during biometric prompt.
- **National Pulse** — `/pulse`: world map (TopoJSON, Obsidian/Gold, vitalization density), PulsePoint ripples on handshake events, real-time leaderboard, “Estimated Fraud Blocked” tooltip on country hover. Supabase Realtime for `presence_handshakes` or mock fallback.

## Setup

```bash
cd web
npm install
```

## Develop

```bash
npm run dev
```

**WebAuthn** requires **HTTPS** (or `localhost`). Use `npm run dev` and open `https://localhost:3000` if you use a local TLS setup, or rely on production.

## Build

```bash
npm run build
npm run start
```

`build` runs `ensure-pwa-assets` (icons) then `next build`.

## Deploy

- **Vercel**: CI deploys on push to `main`. Configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` in GitHub Secrets. Add custom domain (e.g. **vitalization.org**) in Vercel → Project → Settings → Domains.
- **Netlify**: Use `@netlify/plugin-nextjs`. Headers in `netlify.toml`. Add domain in Netlify Domain management.

Manual deploy (Vercel):

```bash
npx vercel --prod
```

## PWA

- **Manifest**: `public/manifest.json` (mrfundzman, standalone, icons).
- **Service worker**: Workbox via `@ducanh2912/next-pwa`. **Cache-First** for `/api/manifesto` (8‑slide assets); **Network-First** for `/api/voting`; **NetworkOnly** + **workbox-background-sync** (`sync-presence`) for `POST /api/sync-presence`.
- **Icons**: `public/icons/` (placeholders). Replace with final mrfundzman assets.

## Biometric layer (WebAuthn)

- **Registration**: `navigator.credentials.create` with `userVerification: 'required'`. Stores `credentialID` and `publicKey` via `POST /api/vitalize/register` (proxies to backend `/vitalize/register` when `PFF_BACKEND_URL` is set). UI: `/vitalize/register`.
- **Verification**: `generatePresenceProof()` uses `navigator.credentials.get`; the signed assertion is the Presence Proof. No raw biometric data is exposed.
- **Secure context**: All WebAuthn logic runs only over HTTPS or localhost.
- **Scanning HUD**: Full-screen “Scanning…” overlay (mrfundzman aesthetic) while the native biometric prompt is active.

## Lagos-Proof Offline Sync

- **Vault**: `idb` store `pff_sync_queue`. Pending proofs are AES‑256‑GCM encrypted at rest, high‑resolution timestamp, `pending` / `synced` status.
- **Conflict prevention**: UUID per handshake; backend idempotent by `handshakeId`.
- **Background Sync**: `sync-presence` queue; failed POSTs retried when connection is restored.
- **Sync Status** (footer): **Red** — Presence Logged (Offline); **Yellow** — Synchronizing…; **Green** — Vitalized & Synced.

## National Pulse (`/pulse`)

- **Map**: `react-simple-maps` + TopoJSON (world-atlas 110m). Fill by Vitalization Density; Obsidian → Gold. `useMemo` for style.
- **PulsePoint**: `framer-motion` gold ripple at nation centroid when a handshake is recorded.
- **Leaderboard**: Rank, Nation, Vitalization Score, Wealth Secured, Live handshake count. Updates via `subscribeHandshakes` (Supabase Realtime or mock).
- **Wealth Secured Ticker**: Fetches `total_handshakes` from `presence_handshakes` via `GET /api/wealth-ticker`. Wealth = handshakes × `FRAUD_PREVENTION_VALUE` ($50). Rolling-digit `AnimateNumber` (framer-motion), ticks up on each new handshake. JetBrains Mono, #FFD700 on #0B0B0B, “Wealth Protected” label. Uses motion spring + transform for 60fps.
- **Tooltip**: Country hover → “Estimated Fraud Blocked: $X,XXX,XXX” (mrfundzman Metric).
- **Supabase**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Create `presence_handshakes` with `nation` (text) and enable Realtime for the table. Otherwise mock interval emits handshakes.

## System Health Check (`/debug`)

Diagnostic utility for the 3 core layers. **Hidden** `/debug` route + console `pffHealthCheck()`.

- **Hardware:** `PublicKeyCredential` + `isUserVerifyingPlatformAuthenticatorAvailable` (Secure Enclave / Face ID / Touch ID).
- **Resilience:** IndexedDB `pff_sync_queue` open, pending count; Service Worker registered, `registration.sync` available.
- **National Pulse:** `GET /api/health` liveness; Supabase Realtime `presence_handshakes` (if configured).

**Output:** `[OK]` / `[FAIL]` lines + `[SYSTEM READY FOR VITALIZATION]` when all pass. Implemented in `core/health-check.ts`; `/debug` page runs it and exposes `pffHealthCheck` on `window` for console use.

## Security

CSP and HSTS are set in `vercel.json` and `netlify.toml`. The app must be served over **HTTPS**; `upgrade-insecure-requests` is enabled.

## PFF × Sovryn (Rootstock / RSK)

Presence-gated DeFi: **No trade or loan without a biometric handshake.**

- **`withPresence(transaction)`** — Middleware in `lib/sovryn/withPresence.ts`. Runs `fetchChallenge` → `generatePresenceProof` → then executes the transaction callback. Use for any Sovryn contract write (Zero, Spot Exchange, lending, borrowing).
- **Wallet** — `getBrowserProvider`, `ensureRSK`, `getConnectedAddress` from `lib/sovryn/wallet`. Connect MetaMask, Defiant, or hardware wallet on Rootstock (chainId 30).
- **DLLR** — `getDLLRBalance(address)` reads Sovryn Dollar balance on RSK. **Dashboard** (`/dashboard`) shows a DLLR balance tracker and “My wealth is secured by my presence.”
- **CSP** — `connect-src` includes `https://public-node.rsk.co` for RSK RPC.

## Master Handshake (Sovryn Bridge)

**Launch Sovereign Vault** — PWA button on `/dashboard`. Flow:

1. Connect wallet (MetaMask, Defiant, etc.) and ensure Rootstock (RSK).
2. Tap **Launch Sovereign Vault** → triggers `generatePresenceProof()` (3D/biometric scan).
3. On success, **Sovryn Bridge** sends a **Presence_Verified** signal: `POST /api/master-handshake` with proof + address. Backend verifies challenge, burns nonce, marks address attested.
4. Redirect to **Sovryn Wealth Dashboard** (`https://sovryn.app`).

**Sovereign Unit (DLLR)** balance is visible **only after** the Master Handshake is complete. Before that, the dashboard shows “Complete Master Handshake to view balance.”

- **API:** `POST /api/master-handshake` (proof verification, attestation), `GET /api/master-handshake?address=0x...` (check attested).
- **Bridge:** `lib/sovryn/bridge.ts` — `runMasterHandshake()`, `isMasterHandshakeComplete(address)`.

## Fortress Security Audit

Hardening for 2026-level identity theft and deepfake injection. See `docs/FORTRESS-AUDIT.md`.

1. **WebAuthn:** `userVerification: 'required'` everywhere (hard biometric).
2. **XSS:** `sanitizeNation()` on all National Pulse / realtime stream input.
3. **Challenge validation:** Server-issued challenge via `GET /api/challenge`; `POST /api/sync-presence` verifies proof challenge matches session. Mismatch → fraud alert, block IP.
4. **IndexedDB:** Session-only encryption key (in-memory); never persisted. Device dump yields useless blobs.
5. **Replay:** One-time nonce (`handshakeId`); backend burns after verification. Replay → fraud alert, block IP.

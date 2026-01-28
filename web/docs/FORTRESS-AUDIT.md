# Fortress Security Audit — PFF Protocol

Hardening for 2026-level identity theft and deepfake injection.

## 1. WebAuthn Strictness

**Requirement:** `userVerification` MUST be `'required'` (hard biometric). Never `'preferred'`.

**Implementation:**
- `lib/webauthn.ts`: `createCredential` uses `authenticatorSelection.userVerification: 'required'`. `getAssertion` uses `publicKey.userVerification: 'required'`. Comments document Fortress rule.
- All `navigator.credentials` flows go through these helpers; no alternate code paths use `'preferred'`.

## 2. XSS / Injection Defense (National Pulse)

**Requirement:** Sanitize all inputs from the real-time stream. No “Digital Ghost” script injection via leaderboard / PulsePoint data.

**Implementation:**
- `lib/sanitize-pulse.ts`: `sanitizeNation(input)`. Allowlist: letters (incl. extended Latin), digits, spaces, `.'\-()`. Strip all other chars. Max length 80. Prevents HTML, scripts, control chars.
- `lib/pulse-realtime.ts`: `emitHandshake` sanitizes `ev.nation` before broadcasting. Drops event if result empty.
- `useHandshakeRealtime`: Sanitizes `nation` from Supabase payload and from mock NATIONS before emit.
- `Leaderboard`, `usePulsingNations`: Sanitize `ev.nation` again before using as state key / pulse set (defense in depth).

## 3. Cryptographic Signature / Challenge Validation

**Requirement:** Backend must verify the challenge in the Presence Proof matches the one issued for that session. Mismatch → Fraud Alert, block IP.

**Implementation:**
- `GET /api/challenge`: Issues 32-byte challenge, stores it per session (append-only queue). Sets `pff_fortress_session` cookie (httpOnly, secure in prod, sameSite lax, 5 min).
- Client: `fetchChallenge()` before Prove Presence, then `generatePresenceProof(undefined, challenge)`. `getAssertion` uses that challenge.
- `POST /api/sync-presence`: Reads session from cookie. Decodes `clientDataJSON` from proof, extracts `challenge`. Uses `consumeMatchingChallenge(sessionId, proofChallenge)` for byte-wise match (padding-safe). No match → `fraudAlert(ip, ...)`, `blockIp(ip)`, 403.
- `lib/fortress-server.ts`: Challenge store (queue per session), `consumeMatchingChallenge`, `blockIp`, `fraudAlert`, `getClientIp`. Blocked IPs receive 403 on challenge and sync-presence.

## 4. IndexedDB Encryption (Session-Specific Key)

**Requirement:** Pending handshakes in `pff_sync_queue` must be encrypted. Use a session-specific key so a device dump leaves proofs useless.

**Implementation:**
- `lib/vault.ts`: Encryption key is **session-only**, held in memory (`sessionKey`). Never persisted to `pff_keys` or elsewhere. New key per tab/page load; lost on close.
- `encryptPayload` / `decryptPayload` use `getOrCreateKey()` (in-memory key only). Encrypted blobs remain in `pff_sync_queue`.
- Dump of IndexedDB yields only ciphertext; without the session key, proofs are unusable.

## 5. Replay Protection (One-Time Nonce)

**Requirement:** Every handshake has a unique, one-time-use ID. Backend “burns” it after successful verification. Replay → reject.

**Implementation:**
- Client: `handshakeId` = `crypto.randomUUID()` (or fallback) per proof.
- `lib/fortress-server.ts`: `burnNonce(handshakeId)`. Returns `true` if first use, `false` if already used (replay).
- `POST /api/sync-presence`: After challenge verification, calls `burnNonce(handshakeId)`. If `false` → `fraudAlert(ip, 'sync-presence: replay detected')`, `blockIp(ip)`, 403. Sync only proceeds when nonce is burned successfully.

---

## Summary of New / Touched Files

| File | Change |
|------|--------|
| `lib/webauthn.ts` | Fortress comments; `userVerification: 'required'` explicitly noted |
| `lib/sanitize-pulse.ts` | **New.** `sanitizeNation` for Pulse stream |
| `lib/pulse-realtime.ts` | Sanitize at emit |
| `lib/fortress-server.ts` | **New.** Challenge store, blocklist, burn nonce, fraud alert |
| `app/api/challenge/route.ts` | **New.** GET challenge, session cookie |
| `app/api/sync-presence/route.ts` | Challenge verify, consume match, burn nonce, fraud+block on failure |
| `lib/vault.ts` | Session-only key; no persistence |
| `lib/handshake.ts` | `fetchChallenge`, `generatePresenceProof(_, challenge)`, `performHandshake(_, override)` |
| `lib/sync.ts` | `credentials: 'include'` on POST to sync-presence |
| `components/ProvePresenceButton.tsx` | Fetch challenge → prove → submit |
| `components/pulse/useHandshakeRealtime.ts` | Sanitize nation before emit |
| `components/pulse/Leaderboard.tsx` | Sanitize nation before state update |
| `components/pulse/usePulsingNations.ts` | Sanitize nation before pulse set |

## Operational Notes

- **Prove Presence** requires network (to fetch challenge). Offline prove is no longer supported.
- **Blocked IPs**: In-memory set; cleared on process restart. For production, use a persistent blocklist (e.g. Redis).
- **Challenge store / burned nonces**: In-memory; same caveat for multi-instance or restarts.

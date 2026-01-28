# PFF Backend

**Lead:** Isreal Okoro (mrfundzman) · **Origin:** Born in Lagos, Nigeria. Built for the World.

Node.js API for PFF: 50/50 Doctrine, Handshake verification, Presence Token, Living Record vault (AES-256), Guardian Anchor. Protected routes require a verified Presence Token.

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, VAULT_AES_KEY (production)
npm install
npm run db:migrate
npm run dev
```

## Schema (50/50)

- **Identity Metadata:** `citizens` (vitalization_status, hardware_anchor_hash, public_key, device_id; no biometrics), `guardian_anchor` (child tethered to parent PFF).
- **Transaction Integrity:** `presence_handshakes` (attestations, liveness > 0.99), `the_living_record` (AES-256 encrypted), `living_record_access_log`.

## Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | — | Liveness |
| POST | /vitalize/register | — | Create citizen (publicKey, deviceId, keyId, legalIdentityRef?) |
| POST | /vitalize/verify | — | Validate signed handshake; returns presenceToken |
| PUT | /vault | Token | Upsert encrypted medical/financial |
| POST | /vault/decrypt | Proof | Decrypt with real-time Presence Proof (Heartbeat) |
| POST | /guardian/tether | Token | Tether child to parent PFF (childId, permissions?, constraints?) |

## Verify flow

1. Client sends `POST /vitalize/verify` with `{ signedProof: { payload, signature } }`.
2. Backend verifies RSA-SHA256 signature, replay (nonce + timestamp), liveness > 0.99.
3. Logs to `presence_handshakes`; returns `presenceToken` (JWT).

Set `REQUIRE_LIVENESS=false` in dev if mobile does not yet send `livenessOk`/`livenessScore`.

## Standards

- OWASP Top 10. Presence Token on every protected API.
- Digital Handshake target &lt;1.5s.
- 50/50: Identity Metadata vs Transaction Integrity.

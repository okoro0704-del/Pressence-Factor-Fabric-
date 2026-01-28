# PFF Vitalize

**Lead:** Isreal Okoro (mrfundzman) · **Origin:** Born in Lagos, Nigeria. Built for the World.

**Vitalization** — Onboarding flow that anchors the user’s hardware to their legal identity. Secure Enclave / Keymaster key creation, biometric enrolment, optional liveness. No raw biometrics leave the device.

## Flow

1. **Welcome** — Intro, consent.
2. **Legal Identity** — Bind legal identity (KYC ref, ID type/number).
3. **Device Binding** — Capabilities check → create hardware-bound key (Layer 1–2).
4. **Complete** — Summary; optionally perform Handshake, receive Presence Token.

## Contract

- Key generation: non-exportable, hardware-backed. See `core` Hardware Anchor.
- Data doctrine: zero-knowledge. Only public key and attestation material sent to backend.
- Resiliency: offline-first; key creation and proof signing work offline; registration when online.

## Contents

- **`types`** — Legal identity form, vitalization result, flow steps.
- **`index`** — Public API.

## Dependencies

- `core`, `protocols`.

## Usage

UI lives in `mobile/src/vitalization`. This module defines the vitalization contract and shared types for backend (e.g. vitalization API).

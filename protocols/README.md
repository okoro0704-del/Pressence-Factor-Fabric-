# PFF Protocols

**Lead:** Isreal Okoro (mrfundzman) · **Origin:** Born in Lagos, Nigeria. Built for the World.

Formal definitions for the Digital Handshake, Heartbeat, and 50/50 data schema. Implements zero-knowledge Presence-Based Reality.

## Protocols

- **Handshake** — Client produces signed Presence Proof (attestation + biometric + liveness); backend verifies, issues Presence Token. Target &lt;1.5s. Offline-first: proof can be created offline, verified when online.
- **Heartbeat** — Real-time Presence Proof required for sensitive actions (e.g. Living Record decrypt). Backend enforces freshness window.
- **50/50 Schema** — Identity Metadata (citizen autonomy) and Transaction Integrity (audit, integrity) stored and accessed separately. Prevents centralized data harvesting.

## Dependencies

- `core` — types, constants.

## Usage

Referenced by `backend` (verification, middleware), `mobile` (proof creation), and `vitalize` (onboarding contract).

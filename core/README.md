# PFF Core

**Lead:** Isreal Okoro (mrfundzman) · **Origin:** Born in Lagos, Nigeria. Built for the World.

Shared identity primitives, crypto contracts, and invariants for the Presence Factor Fabric. All PFF modules (mobile, backend, protocols, guardian, vitalize) depend on core.

## Standards

| Rule | Meaning |
|------|--------|
| **50/50 Doctrine** | Decouple citizen autonomy from national efficiency. Identity metadata and transaction integrity are strictly separated. |
| **Anti-Greed** | No raw biometrics on servers. Zero-knowledge handshakes only. Backend receives signed Presence Proofs, never templates. |
| **Hardware Anchor** | All keys non-exportable, stored in Secure Enclave / Keymaster. |
| **Liveness** | 3D liveness detection required to prevent deepfake/replay attacks. |
| **Resiliency** | Offline-first sync for low-connectivity environments (Lagos-tested). |

## Contents

- **`types`** — Presence Proof payload, key identifiers, device capabilities, 50/50 boundaries.
- **`constants`** — Protocol constants (replay window, key aliases, etc.).

## Usage

Consumed by `protocols`, `guardian`, `vitalize`, `mobile`, and `backend`. Import from `core` or `../core` as appropriate for your workspace layout.

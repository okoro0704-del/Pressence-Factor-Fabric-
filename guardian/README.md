# PFF Guardian

**Lead:** Isreal Okoro (mrfundzman) · **Origin:** Born in Lagos, Nigeria. Built for the World.

**Guardian Anchor** — Sub-identity tethering (e.g. child protection). A secondary identity is cryptographically bound to a Primary PFF. Actions on behalf of the sub-identity require the Primary’s Presence Proof and scope.

## Invariants

- Primary holds hardware-backed keys; sub-identity has no separate keys.
- Tether payload (sub-id, permissions, constraints) is signed by Primary.
- Stored in Identity Metadata only; no raw biometrics. 50/50 respected.

## Contents

- **`types`** — Tether payload, sub-identity scope, permissions.
- **`index`** — Public API.

## Dependencies

- `core`, `protocols`.

## Usage

Consumed by `backend` (tether verification, scope checks) and `mobile` (Guardian UI, tether creation).

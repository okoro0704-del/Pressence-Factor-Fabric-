# PFF Project — Terminology Index

All terminologies used across the codebase since project start. Grouped by category.

---

## Protocol & product names

| Term | Meaning |
|------|--------|
| **PFF** | Presence Factor Fabric. The sovereign protocol that binds identity to presence (Phone, Face, Palm) instead of passwords. Hardware-bound, zero-knowledge. Born in Lagos. Built for the World. |
| **VITALIE** | Global reserve and payment layer rooted in Proof of Personhood. Citizen-owned fabric where value flows only when presence is proved. “The soul that Libra lacked.” |
| **ATE** | Architect Treasury Engine. Infrastructure that realizes Universal High Income through Proof of Personhood; distributes value (VIDA CAP, DLLR, vNGN) only to verified humans. |
| **VIDA** / **VIDA CAP** | Deep Truth VIDA (Capital). Unit of value minted and unlocked through vitalization (Face + Palm + Device). 1 VIDA unlocks when Triple-Anchor is verified. |
| **ALT** | Anchor-Linked Token. Assets and rights bound to the Identity Anchor; benefits (UBI, airdrops, governance) flow only to proven humans. Anti-sybil layer. |
| **Sovryn** | Companion / sovereign intelligence; voice and UI (e.g. Sovryn Companion, sovereign swap). |

---

## Detailed definitions: PFF, VITALIE, ATE, VIDA, VIDA CAP, ALT, Sovryn

### PFF — Presence Factor Fabric

The sovereign protocol that binds identity to **presence** (Phone, Face, Palm) instead of passwords. It is a **hardware-bound, zero-knowledge** layer that keeps the human at the center of the digital and AI age. Identity is not a username or a KYC file; it is the continuous proof that a single, living human is present. No central vault of biometrics—the proof lives at the edge, and the protocol only checks: *“Is this the same human who enrolled?”* **Tagline:** *Born in Lagos. Built for the World.*

---

### VITALIE

**The soul that Libra lacked.** A **global reserve and payment layer** rooted in **Proof of Personhood**. Unlike Libra (a corporate stablecoin with identity handed to gatekeepers), VITALIE is a **citizen-owned fabric** where value flows only when presence is proved. There is no central custodian of “who you are”—the human is the root of trust. Value flows to verified persons, not to wallets that bots can farm. Decentralized, human-centric, and resistant to bot capture. Proof of Personhood is the foundation, not an afterthought.

---

### ATE — Architect Treasury Engine

The **infrastructure that realizes Universal High Income** through Proof of Personhood. ATE **distributes and accounts for value** (VIDA CAP, DLLR, vNGN) **only to verified humans**—no sybils, no bots. It fulfills the dream of income tied to **existence**, not exploitation. The question “who gets UBI?” is answered by presence: one human, one share. Value is minted and distributed only when Face + Palm + Device are verified.

---

### VIDA

**Deep Truth VIDA** (value unit). Used interchangeably with **VIDA CAP** in many contexts. Represents **attested human presence**—the basis for Universal Basic Income and sovereign treasury in the PFF ecosystem. Not speculation; proof that a living human completed vitalization.

---

### VIDA CAP — Deep Truth VIDA Capital

The **unit of value minted and unlocked through vitalization**: Face + Palm + Device. **1 VIDA unlocks when the Triple-Anchor is verified.** It represents not speculation but **attested human presence**—the basis for Universal Basic Income and sovereign treasury. In the app, “5 VIDA CAP” is minted after the full Four-Layer Gate (identity anchor → presence → biometric → vault) and Constitution Gate. VIDA CAP appears in Sovereign Treasury, National Treasury (liquidity, national pool), and swap/receive flows.

---

### ALT — Anchor-Linked Token

A **class of assets and rights bound to the Identity Anchor** (phone + biometrics). ALT ensures that benefits—**UBI, airdrops, governance**—flow **only to proven humans**. It is the **anti-sybil layer** that makes Universal High Income and fair distribution possible. Any token or right that is “anchor-linked” is gated by Proof of Personhood, so bots and duplicate accounts cannot capture value.

---

### Sovryn

In this project, **Sovryn** refers to:

1. **Sovryn Companion** — The in-app **Sovereign Intelligence**: voice recognition and speech (e.g. “Show PFF Balance”, daily briefing, scan cues). Runs locally when APIs are offline. Renders in the dashboard next to the user’s name.
2. **Sovryn AMM** — The **swap and DeFi layer**: citizens can “Swap to DLLR on Sovryn AMM” from the Sovereign Wallet. DLLR (Sovryn Dollar) is the dollar-pegged token; Zero (0% interest loans), Spot Exchange, lending, and borrowing are described as “Sovryn actions.”
3. **Brand line** — *PFF × Sovryn · Born in Lagos. Built for the World.*

So: **Sovryn** = the companion (voice/intelligence) + the financial/AMM ecosystem (DLLR, swap, lending) integrated with PFF.

---

## Identity & presence

| Term | Meaning |
|------|--------|
| **Presence** | Proof that a living human is present (device + biometrics + liveness). Replaces passwords. |
| **Presence Factor Fabric** | Same as PFF; the fabric of presence-based identity. |
| **Identity Anchor** | Root handle: phone number. Tied to Sovereign Palm + Sovereign Face + Device Signature. |
| **Triple-Anchor** | Face, Sovereign Palm (or fingerprint), and Device. All three must be verified to unlock 1 VIDA. |
| **Proof of Personhood** | Binding rights and value to the human body; one person, one presence, one share. Solves bot/sybil crisis. |
| **Presence Proof** | Signed on-device payload (zero-knowledge; no raw biometric data). |
| **Global Presence Gateway** | Context/provider for presence verification state across the app. |
| **Presence Pillar** | One of the layers (e.g. device, GPS, face, palm) in the gate/progress ring. |

---

## Biometrics & verification flows

| Term | Meaning |
|------|--------|
| **Face Pulse** | Face capture + verification (camera, face mesh/oval, liveness). Architect Vision step. |
| **Palm Pulse** | Contactless palm verification (MediaPipe Hands); replaces fingerprint for daily unlock. “Palm Wave.” |
| **Sovereign Face** | Face-based identity pillar; face_hash in user_profiles. |
| **Sovereign Palm** | Palm-based identity pillar; palm_hash in user_profiles. |
| **Architect Vision** | UI/camera step for Face Pulse (mesh overlay, confidence, gold freeze on success). |
| **Biometric Session** | Session state for biometric verification (e.g. verified for this flow). |
| **Triple Lock** | Face + Palm + Device verified (same idea as Triple-Anchor). |
| **Backup Anchor** | Fallback: Sovereign Palm + Device ID only (e.g. after face failures). |
| **Recovery Seed** | Encrypted seed for account recovery; stored after Face Pulse and confirmation. |
| **Guardian Anchor** | Sub-identities (e.g. children) tethered to your PFF; permissions you set. |
| **Guardian Recovery** | Flow where a guardian authorizes recovery for a dependent. |

---

## Gates, vault & access

| Term | Meaning |
|------|--------|
| **Four-Layer Gate** | Universal 1-to-1 identity matching gate: identity anchor → presence → biometric (face/palm) → vault. |
| **Gate** | General term for the unlock / vitalization flow (e.g. “when the Gate opens” = April 7th). |
| **Vault** | Post–gate destination; sovereign treasury/dashboard (5 VIDA, wallet, etc.). |
| **Vault Door Animation** | UI animation before entering the vault. |
| **Constitution Gate** | Step requiring signing the Sovereign Constitution (biometric signature) before mint. |
| **Public Gatekeeper** | Logic that shows Manifesto & Countdown to non-authorized users; full Protocol to authorized identities. |
| **Protected Route** | Route that requires presence/biometric verification (e.g. dashboard, treasury). |

---

## Vitalization & ritual

| Term | Meaning |
|------|--------|
| **Vitalization** | Process of proving presence and minting/unlocking value (Face + Palm + Device). |
| **Vitalization Manifesto** | The manifesto: “Presence over passwords”; “Phone. Finger. Face.” |
| **9-Day Vitalization** | Ritual: complete Face + Palm scan for 9 consecutive days to unlock progression (e.g. 0.9 VIDA). |
| **Vitalization Ritual** | Daily Face + Palm (or fingerprint) scan; streak and unlock logic. |
| **Vitalized State** | World where identity is hardware-bound, zero-knowledge, presence-only (vs Shadow Economy). |
| **Vitalized Citizen** | User who has completed presence proof and joined the fabric. |

---

## Sentinel & tiers

| Term | Meaning |
|------|--------|
| **Sentinel** | Guardian layer: hardware-bound security and attestations. Tiers: Citizen, Personal Multi, Enterprise. |
| **Sentinel Vault** | Vault/plan tied to Sentinel (e.g. sentinel-vault route). |
| **Sentinel Hub** | Physical hub (e.g. with industrial scanner) for hardware verification. |
| **Primary Sentinel Device** | Device bound as primary (primary_sentinel_device_id) for the identity. |
| **Citizen** | Sentinel tier 1. |
| **Personal Multi** | Sentinel tier 2. |
| **Enterprise** | Sentinel tier 3. |
| **Sentinel Officer / Staff** | Roles for Sentinel admin flows. |
| **isSentinelActive** | Whether the user has an active Sentinel (e.g. bypass palm when guardian’s Sentinel is active). |

---

## Tokens & treasury

| Term | Meaning |
|------|--------|
| **VIDA** | See Protocol & product names. |
| **DLLR** | Dollar-pegged token in the ecosystem (swap, receive). |
| **USDT** | USDT in treasury/swap. |
| **vNGN** | Nigerian Naira-linked value in the ecosystem. |
| **Sovereign Treasury** | Personal treasury (VIDA, DLLR, USDT, vNGN); swap, receive, withdraw. |
| **National Treasury** | Country-level reserves (National Block, liquidity, pool). |
| **National Pulse** | Real-time presence and attestations (dashboard, handshakes). |
| **Sovereign Ledger** | Transaction ledger (sovereign_ledger, labels). |
| **Internal Wallet** | Sovereign internal wallet (vida_cap_balance, dllr_balance, usdt_balance). |

---

## Roles & personas

| Term | Meaning |
|------|--------|
| **Architect** | Privileged role; can access full Protocol (dashboard, treasury, Palm, etc.) during unveiling. |
| **Master Architect** | First registrant / admin role; Master Command Center, EVG, low sensitivity init. |
| **Grandmaster** | Grandmaster auth / tier. |
| **Government Admin** | Role for government routes (elections, treasury). |
| **Authorized Identity** | Device/user that bypasses Manifesto-only (device_id in allowlist or architect). |
| **Vanguard** | Early waitlist (“Join the Vanguard”); first 10,000 Citizens for 9-Day Vitalization. |

---

## UI & experience

| Term | Meaning |
|------|--------|
| **Sovereign Presentation** | Main landing scroll: Mission, Terminologies, Global Impact. |
| **Manifesto of Truth** | Education page: glossary (PFF, VITALIE, ATE, VIDA CAP, ALT), Visionary Connection, Proof of Personhood. |
| **Sovereign Countdown** | Countdown to April 7, 2026; page and inline widget. |
| **Sovereign Companion** | AI/voice companion (daily briefing, Eyes, scan cues during Face/Palm). |
| **Companion Eyes** | Speaks scan cues during Face Pulse and Palm Scan. |
| **Layer Status Bar** | UI showing Face, Palm, Device pillars (turn gold when verified). |
| **Presence Progress Ring** | Triple-Pillar Shield progress: Device → GPS → Face → Palm. |
| **AppShell** | Layout: sidebar, bottom nav (Dashboard, Treasury, Elections, Master, Command, Settings). |
| **Gatekeeper** | Logic that restricts full Protocol to authorized identities (URL + device check). |

---

## Technical & ecosystem

| Term | Meaning |
|------|--------|
| **EVG** | Enterprise Verification Gateway; partner ecosystem (authorize, verify, token, partner-info). |
| **Master Command Center** | Master dashboard (telemetry, security status, national liquidity). |
| **Humanity Ledger** | Humanity-related ledger/attestations. |
| **National Block** | National reserves / block engine. |
| **Genesis** | Genesis hash, genesis handshake, binding (e.g. ROOT device, Day Zero). |
| **Handshake** | Presence handshake (e.g. presence_handshakes), protocol handshake. |
| **50/50 Doctrine** | Half serves you (vault, keys, consent); half serves integrity (attestations, audits, no PII). |
| **Heartbeat** | Metaphor for real-time presence gating (“The Heartbeat gates everything”). |
| **Shadow Economy** | Unverified identities, fraud, no presence-based reality (vs Vitalized State). |
| **Living Record** | Medical/financial records encrypted with you at centre; decryption on presence proof. |

---

## Deployment & config

| Term | Meaning |
|------|--------|
| **Sovereign Override** | Deployment override: continue-on-error, manual trigger, ignore TS/lint for build. |
| **Manifesto Mode** | Unveil phase: public sees Manifesto + Countdown; wallet/Protocol behind gatekeeper. |
| **IS_PUBLIC_REVEAL** | Flag: when true, hide Withdraw and Palm Scan for non-vetted users. |
| **Lab URL** | Netlify deploy-preview URL; full Protocol visible for testing. |
| **Waitlist** | Table (waitlist) for Vanguard email capture (email, created_at, referral_source). |

---

## Other recurring terms

| Term | Meaning |
|------|--------|
| **Born in Lagos. Built for the World.** | Tagline. |
| **Three Layers of Truth** | Phone. Finger. Face. |
| **Mint** | Minting VIDA (e.g. 5 VIDA CAP, gasless mint, verified mint listener). |
| **MINTED** | Mint status (e.g. after hub verification). |
| **Device Signature** | Device ID / composite fingerprint (primary_sentinel_device_id). |
| **Link Device** | Flow to link phone to laptop (QR, login request, approve with palm/device). |
| **Hub Verification** | PC-side verification with external scanner; then set MINTED and mint. |
| **Zero-knowledge** | No central vault of secrets; proof without exposing raw data. |
| **Hardware-bound** | Identity/keys tied to device and biometrics. |
| **PWA** | Progressive Web App; mobile-first sovereign experience. |
| **Vanguard Status Acknowledged** | Success message after joining the waitlist. |

---

*Generated from project scan. For definitions in the app, see `/education` (Manifesto of Truth) and `SovereignManifestoLanding` / `SovereignEducationPage`.*

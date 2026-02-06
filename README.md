# PFF Protocol: The End of the Digital Ghost

**Born in Lagos. Built for the World.** Led by mrfundzman.

---

## The Mission

The PFF (Presence Factor Fabric) Protocol eliminates fraud by replacing passwords with **Presence-Based Reality**: your identity is proved by your hardware, your biometrics, and your physical presence—never by a string in a database. We decouple citizen autonomy from national efficiency through the **50/50 Data Doctrine**: decentralized identity sovereignty meets rigorous transaction integrity, without centralized data harvesting.

---

## Core Pillars — The Fabric

| Layer | Anchor | Purpose |
|-------|--------|---------|
| **[P] Phone** | Hardware-bound attestation via Secure Enclave / Keymaster | Non-exportable keys stored in silicon. Identity lives on the device, not in the cloud. |
| **[F] Finger** | Tactile biometric authorization (Touch ID / Android Biometrics) | Instant, local verification. No raw templates leave the device. |
| **[F] Face** | 3D Passive Liveness Detection (Face ID / LiDAR) | Anti-deepfake, anti-replay. Presence is real, not spoofed. |

🧬 The Fabric runs **local-first**: biometric processing happens on-device. The backend receives only a signed **Presence Proof**—zero raw biometric data, ever.

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Sovereign PWA — React / Next.js. Installable via *Add to Home Screen*; no App Store. |
| **Identity** | WebAuthn API — direct hardware hook into Face ID, Touch ID, fingerprint. |
| **Resilience** | Workbox Offline-First Sync — Lagos-proof. Manifesto cached; Presence Proof generatable without connectivity. |
| **Backend** | Node.js / Supabase — 50/50 decoupled schema. Identity Metadata and Transaction Integrity stored and accessed separately. |

---

## Security Architecture

- **Zero-Knowledge Handshakes** — No raw biometric data ever leaves the device. Only cryptographic attestations and signed Presence Proofs reach the backend.
- **Non-Exportable Keys** — Identity is anchored to the silicon. Secure Enclave and Keymaster ensure keys cannot be extracted or replicated.
- **Fortress Hardening** — Challenge validation, replay protection (burned nonces), session-bound encryption, and strict WebAuthn `userVerification: required` defend against 2026-level identity theft and deepfake injection.

🛡️ The protocol is designed to be **never served over insecure connections**: strict CSP, HSTS, and HTTPS-only deployment.

---

## Getting Started

1. **Sovereign Web (PWA)**  
   ```bash
   cd web && npm install && npm run dev
   ```
   Then open **http://localhost:3000** (not from repo root—the app is in `web/`).  
   Open the app, complete the Manifesto flow, and trigger your first **Prove Presence** handshake. Install via *Add to Home Screen* for the full experience—including Lagos-specific “How to Install” guidance in the UI.

2. **Mobile (React Native)**  
   ```bash
   cd mobile && npm install && npm start
   ```  
   See `mobile/README.md` for Expo/EAS and native setup.

3. **Backend**  
   ```bash
   cd backend && npm install && npm run dev
   ```
   See `backend/README.md` for env, schema, and `/vitalize/verify`.

4. **Supabase (optional)** — For National Pulse realtime and wealth ticker, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `web/.env.local`. Backend can use Supabase Postgres via `DATABASE_URL`. See `docs/SUPABASE-SETUP.md`.

---

## Auto-deploy to Netlify (push = deploy)

To have **every push to `main`** automatically build and deploy the web app to Netlify:

**Option 1 — GitHub Actions (recommended)**  
1. In your **GitHub repo** go to **Settings → Secrets and variables → Actions**.  
2. Add these **secrets**:
   - `NETLIFY_AUTH_TOKEN` — from [Netlify: Personal access tokens](https://app.netlify.com/user/applications#personal-access-tokens)
   - `NETLIFY_SITE_ID` — from Netlify: **Site configuration → General → Site information → API ID**
   - (Optional for full features) `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Push to `main`. The workflow `.github/workflows/netlify.yml` will build `web/` and deploy to Netlify.

**Option 2 — Netlify “Build on push”**  
1. In [Netlify](https://app.netlify.com): **Add site → Import from Git** (or open the site).  
2. Connect the GitHub repo and set **Base directory** to `web`, **Build command** to `npm run build`, **Publish directory** to `out`.  
3. Every push to the linked branch triggers a Netlify build and deploy.

Full details: **`docs/NETLIFY-AUTOPUSH.md`**.

---

## Deploy (fix "Page Not Found")

If you see **Page Not Found** after deploying:

- **Netlify:** Site configuration → Build & deploy → **Base directory** = `web` → Save → **Clear cache and deploy**. For Supabase (National Pulse), add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Environment variables. See `web/docs/NETLIFY-SETUP.md`.
- **Vercel:** Project Settings → General → **Root Directory** = `web` → Redeploy.
- **Local:** Run from the `web` folder: `cd web && npm run dev`, then open http://localhost:3000.

See `web/docs/DEPLOYMENT-FIX.md` for full steps.

---

## Repository Layout

```
PFF/
├── core/           # Shared types, constants, 50/50 boundaries, economic layer
├── protocols/      # Handshake, Heartbeat, 50/50 schema
├── guardian/       # Guardian Anchor — sub-identity tethering (Child Protection)
├── vitalize/       # Vitalization flow contract
├── mobile/         # React Native app (Expo/EAS, Vitalization UI, Secure Enclave)
├── backend/        # Node.js API (Handshake verification, PFF middleware, Economic Layer)
├── web/            # Sovereign PWA (Next.js, WebAuthn, Workbox, National Pulse)
├── .github/        # CI — tests, version bump, EAS build, Vercel deploy
└── docs/           # Deployment, Fortress audit, Master Prompt, Economic Architecture
```

## Economic Layer (ATE)

The **Autonomous Truth Economy** (ATE) implements the three immutable economic laws:

1. **50/50 Minting Split** — When a citizen is Vitalized, 50% of VIDA CAP goes to their Private Vault, 50% to the National Reserve
2. **45-10-45 Recovery Split** — External funds: 45% to People, 45% to State, 10% to Agents
3. **Debt-Free Backing** — $VIDA currency issued 1:1 against VIDA CAP Reserve

**See:** `docs/MASTER-PROMPT.md` for framework definitions, `docs/ECONOMIC-ARCHITECTURE.md` for technical details.

---

## The Call to Action

**Join the Movement. Eliminate the Fraud. Vitalize the Nation.** 🇳🇬

---

*PFF Protocol — Lead Architect: Isreal Okoro (mrfundzman). Proprietary.*

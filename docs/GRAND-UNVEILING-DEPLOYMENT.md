# Grand Unveiling Deployment — Netlify Testing → Custom Domain

**Purpose:** Move from the Netlify testing site to the Custom Domain while keeping the Netlify URL functional for the team. Ensure Architect Recognition (Supabase singleton + getVibration) is active on the new domain.

**Timer behavior:**
- **pffprotocol.com (custom domain):** Shows Manifesto & Countdown (timer) for visitors; authorized identities see full Protocol.
- **pffwork.netlify.app:** No timer — full Protocol so you can keep working and testing.

---

## 1. Branch Alignment

- **Current branch:** `main` (single production branch).
- **If you were on a dev branch:** Merge all "Unveiling" changes into `main`, then push. All Sovereign Shield, greeting logic, vibration engine, and Ledger Lock changes are in the working tree; commit them to `main` so the custom domain build includes them.
- **Recommended:** Commit and push the current changes so `main` has the full Unveiling stack before you point the custom domain at Netlify.

```bash
git add web/lib/utils.ts web/components/manifesto/PublicSovereignCompanion.tsx web/components/dashboard/FourLayerGate.tsx web/lib/manifestoCompanionKnowledge.ts web/lib/sovereignRecognition.ts web/src/app/api/sovereign-recognition/route.ts web/src/app/layout.tsx netlify.toml web/.env.example
git status
git commit -m "Grand Unveiling: Sovereign Shield, canonical URL, greeting logic, Ledger Lock"
git push origin main
```

---

## 2. Environment Variable Audit — Custom Domain vs Netlify

**Rule:** The Custom Domain (production) must have the **exact same** env vars as the Netlify testing site for parity. Set these in **Netlify → Site settings → Environment variables** for the **production** context (or the site that serves the custom domain).

### Required (copy from Netlify testing site to Custom Domain)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (JWT) |
| `SERPER_API_KEY` | SOVRYN search (OSINT); used by sovereign-recognition |
| `TAVILY_API_KEY` | SOVRYN search fallback |

### Set only on Custom Domain (production)

| Variable | Value | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_PRODUCTION_DOMAIN` | Your live hostname (e.g. `app.purefreedomfoundation.org`) | Enables Public Mode, hides debug UI, no sensitive logs on live |
| `NEXT_PUBLIC_CANONICAL_ORIGIN` | `https://app.purefreedomfoundation.org` (no trailing slash) | Canonical URL and Open Graph base for SEO |

### Optional (match Netlify if you use them)

- `SUPABASE_AUTH_EXTERNAL_SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` — if OTP/SMS is used
- `NODE_VERSION` — already in `netlify.toml` (20.10.0)

### Checklist before going live on Custom Domain

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = same as Netlify
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = same as Netlify
- [ ] `SERPER_API_KEY` = same as Netlify
- [ ] `TAVILY_API_KEY` = same as Netlify
- [ ] `NEXT_PUBLIC_PRODUCTION_DOMAIN` = your custom domain hostname (e.g. `app.purefreedomfoundation.org`)
- [ ] `NEXT_PUBLIC_CANONICAL_ORIGIN` = `https://app.purefreedomfoundation.org`

**If any are missing on the production domain,** copy them from Netlify → Environment variables (testing site) into the production site’s Environment variables.

---

## 3. Canonical Link and Metadata

- **layout.tsx** uses `NEXT_PUBLIC_CANONICAL_ORIGIN` for:
  - `metadataBase` (Next.js resolves OG and canonical from this)
  - `alternates.canonical` (tells search engines the preferred URL)
- **Netlify URL:** Leave `NEXT_PUBLIC_CANONICAL_ORIGIN` **unset** on the Netlify testing site so the canonical stays same-origin; the site remains fully functional for testing.
- **Custom domain:** Set `NEXT_PUBLIC_CANONICAL_ORIGIN=https://your-domain.com` so the canonical points to the new domain.

---

## 4. The Ledger Lock and Architect Recognition

- **Architect Recognition** (AI recognizes you on the new domain) depends on:
  - **Supabase singleton** (`web/lib/supabase.ts`): single client, no Multiple GoTrueClient warnings.
  - **Memory Vault** (`web/lib/memoryVault.ts`): stores vault entries and vibration in Supabase when authenticated.
  - **Vibration engine** (`web/lib/vibrationEngine.ts`): `getVibration` / `getVibrationFromInput`; persisted via Memory Vault.
  - **PublicSovereignCompanion** and **sovereign-recognition** flow: use the same Supabase and vault so the AI has context and recognition on first load.
- These are all on `main` once you commit the current changes. After deploy:
  - **Custom domain:** Set `NEXT_PUBLIC_PRODUCTION_DOMAIN` so Ledger Lock (Public Mode) is active; recognition still uses the same Supabase + vault.
  - **Netlify URL:** Architect Mode (full search) remains for testing; same singleton and getVibration, so you are recognized on both.

**Supabase:** Ensure in **Authentication → URL configuration** both are allowed:
- Custom domain: `https://app.purefreedomfoundation.org`
- Netlify: `https://<your-site>.netlify.app`

---

## 5. Supabase Site URL and Redirect Allow List (reminder)

**Update in Supabase Dashboard → Authentication → URL Configuration:**

1. **Site URL**  
   Set to your canonical origin, e.g. `https://pffprotocol.com` (so auth defaults to the custom domain).

2. **Redirect Allow List**  
   Add both origins so logins work on Netlify and custom domain:
   - `https://pffprotocol.com/**`
   - `https://pffwork.netlify.app/**`

The app passes `redirectTo: window.location.origin` in auth calls so the correct domain is used per visit. Both URLs must be in the allow list or redirects will be rejected.

---

## 6. Netlify Bypass (Sandbox)

- **netlify.toml** and docs state: do **not** set `NEXT_PUBLIC_PRODUCTION_DOMAIN` on the default Netlify .app site so it stays the **Sandbox** (Architect Mode, full search, dev panels).
- Same build can serve both: custom domain (with production env) and Netlify URL (without production domain env).

---

**Service Worker (mobile cache-bust):** On each deploy, bump `CACHE_VERSION` in `web/public/sw.js` (e.g. `v2` → `v3`) so phones drop old caches and load new code. HTML is fetched with `cache: 'no-store'` so navigations get fresh content when online.

**Summary:** Commit Unveiling changes to `main`, push, then set the env vars above on the Custom Domain site. Canonical and Ledger Lock are wired in code; Architect Recognition (singleton + getVibration) is active on both URLs once deployed.

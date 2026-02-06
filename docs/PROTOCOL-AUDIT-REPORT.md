# Full Protocol Audit Report

**Date:** 2026-01-28  
**Scope:** Functionally live features, Bridges, Red List, Architect Priority List

---

## 1. What is Functionally 'Live' & Working

### 1.1 9-Day Ritual logic and streak tracking in Supabase

| Item | Status | Details |
|------|--------|---------|
| **Streak tracking** | ✅ **Live** | `web/lib/vitalizationRitual.ts`: `getVitalizationStatus()` and `recordDailyScan()` read/update `user_profiles.vitalization_streak` and `vitalization_last_scan_date`. Consecutive-day logic: streak increments only when `last_scan_date === yesterday`; missed days leave streak unchanged (no reset). |
| **Schema** | ✅ **Migration present** | `supabase/migrations/20260253000000_vitalization_9day_ritual.sql` adds `vitalization_streak`, `vitalization_last_scan_date` to `user_profiles` and creates `vitalization_daily_scans` (training sample per day). **Must be applied** in your Supabase project. |
| **Wiring** | ✅ **Wired** | `FourLayerGate` calls `recordDailyScan(anchor.phone)` after successful Face + Palm (or fingerprint fallback) on both first-device and authorized-device paths. `VitalizationCountdown` and Sovereign Companion use `getVitalizationStatus(phone)` for "Day X of 9" and daily briefing. |

**Verdict:** 9-Day Ritual is correctly implemented and wired. Ensure migration `20260253000000_vitalization_9day_ritual.sql` has been run.

---

### 1.2 Daily $100 Unlock (VIDA movement)

| Item | Status | Details |
|------|--------|---------|
| **Starting balance** | ✅ **Live** | `masterArchitectInit.ts` and `mintStatus.ts` set **0.1 VIDA spendable** ($100) and **4.9 VIDA locked** on first grant (5 VIDA total). |
| **Day 9 unlock** | ✅ **Live** | `vitalizationRitual.ts` `recordDailyScan()`: on 9th consecutive day it moves **0.9 VIDA** from `locked_vida` to `spendable_vida` (not 0.1 daily; the "daily $100" is the initial 0.1 + the Day-9 unlock of 0.9). |
| **Clarification** | ⚠️ **Naming** | There is no "daily 0.1 VIDA unlock" each day. Flow is: start 0.1 + 4.9; each day a scan is recorded and streak advances; on **Day 9 only**, 0.9 moves locked → spendable. So "Daily $100 Unlock" in product terms = Day 9 unlock (0.9 VIDA = $900) plus the initial $100 (0.1 VIDA) already spendable. |

**Verdict:** 0.1 / 4.9 start and 0.9 on Day 9 are correctly implemented in code and ritual.

---

### 1.3 Sentinel Commission (0.1 VIDA on mint)

| Item | Status | Details |
|------|--------|---------|
| **Edge Function** | ✅ **Implemented** | `supabase/functions/gasless-mint/index.ts`: when `SENTINEL_WALLET_ADDRESS` is set and `BETA_LIQUIDITY_TEST` is not `1`, **sentinelVida = 0.1** is minted to Sentinel; citizen receives **4.9 VIDA** (not 5). |
| **Activation** | ⚠️ **Env-dependent** | Commission is **active only if** the gasless-mint Edge Function is deployed and env has `SENTINEL_WALLET_ADDRESS` set. If unset, `sentinelVida = 0` and citizen gets full mint amount. |
| **Web app** | ✅ **Display only** | UI (e.g. `UserProfileBalance`, `TripleVaultDisplay`) describes "0.1 VIDA → Sentinel"; no web-side deduction logic. Actual 0.1 is in the **mint** flow (gasless-mint). |

**Verdict:** Sentinel commission is implemented in gasless-mint; ensure Edge Function env has `SENTINEL_WALLET_ADDRESS` for it to be active.

---

### 1.4 Face Pulse (MediaPipe) and Palm Scan initializing

| Component | Status | Details |
|-----------|--------|---------|
| **Face Pulse** | ✅ **Live** | `ArchitectVisionCapture` uses camera + canvas overlay (face oval/mesh). It does **not** load MediaPipe Face Mesh in this codebase; it uses a placeholder mesh and an **AI confidence** value (e.g. from a separate pipeline or mock). Camera and HUD (confidence, liveness, gold freeze) initialize and run. |
| **Palm Scan** | ✅ **Live** | `PalmPulseCapture` loads **MediaPipe Hands** from CDN (`@mediapipe/hands@0.4.1675469240`), initializes `Hands`, starts camera, and processes frames. Scan circle, "Scanning Veins…", and palm geometry → `palm_hash` are implemented. |

**Verdict:** Face Pulse and Palm Scan components initialize; Palm uses MediaPipe Hands. Face uses local camera + overlay (no MediaPipe face mesh in repo).

---

## 2. The 'Bridges' Check

### 2.1 Laptop-to-Mobile QR pairing and Remote Logout

| Bridge | Status | Details |
|--------|--------|---------|
| **Login QR (laptop → phone)** | ✅ **In code** | `createLoginRequest()`, `subscribeToLoginRequest()`, `completeLoginBridge()` in `web/lib/loginRequest.ts`. `FourLayerGate` shows `LoginQRDisplay` when `showAwaitingLoginApproval` and `loginRequestId`; mobile can approve via `AwaitingLoginApproval` / link-device flow. Tables: `login_requests` (migrations `20260240000000`, `20260251000000`). |
| **Remote logout (Terminate Session)** | ✅ **In code** | `requestTerminateSession(deviceId)` inserts into `device_session_terminate`. `subscribeToTerminateSession(myDeviceId, () => location.reload())` in `web/lib/deviceTerminateSession.ts`. `TerminateSessionListener` in AppShell subscribes when user is logged in. Settings → Linked Devices uses `SentinelDevicesManager` with "Terminate Session" calling `requestTerminateSession`. Table: `device_session_terminate` in migration `20260252000000_trust_level_and_device_terminate.sql`. |

**Verdict:** Both bridges are implemented. Ensure migrations for `login_requests` (and pairing bridge) and `device_session_terminate` are applied; Realtime enabled for `device_session_terminate` if using postgres_changes.

---

### 2.2 Sovereign Companion and Dashboard / profile data

| Item | Status | Details |
|------|--------|---------|
| **Dashboard** | ✅ **Connected** | `DashboardContent` imports and renders `<SovereignCompanion userName="Architect" phoneNumber={getIdentityAnchorPhone()} />`. |
| **Profile data** | ✅ **Used** | Companion uses `getIdentityAnchorPhone()` for `phoneNumber`; calls `getVitalizationStatus(phoneNumber)` for daily briefing (Day X of 9) and `getSpendableVidaFromProfile(phoneNumber)` for real-time credit detection. No external AI API; local Sovereign Intelligence and Supabase only. |

**Verdict:** Sovereign Companion is connected to the Dashboard and receives user profile data via `phoneNumber` and the above libs.

---

## 3. The 'Red List' (What Needs Immediate Fixing)

### 3.1 Placeholder URLs / ERR_CONNECTION_TIMED_OUT risks

| Location | Issue | Recommendation |
|----------|--------|-----------------|
| **docs/PRODUCTION-DEPLOYMENT.md** | ~~Example `curl https://api.your-production-domain.com/health`~~ | **Fixed.** Curl example now uses `$NEXT_PUBLIC_PFF_BACKEND_URL/health`; no placeholder domain. |
| **web/lib/governmentTreasury.ts** | ~~Empty BACKEND_URL → same-origin fetch~~ | **Fixed.** `BACKEND_URL` trimmed; `hasBackend()` guards all fetches; fallbacks (e.g. National Vault 3.5 VIDA CAP) used when backend not configured. |
| **web/lib/deviceMigration.ts** | ~~Empty apiUrl → same-origin fetch~~ | **Fixed.** `apiUrl` trimmed; fetch only when `apiUrl` is non-empty; otherwise Supabase path or console.warn only. |
| **.env.example / .env.production** | `NEXT_PUBLIC_APP_URL=`, `NEXT_PUBLIC_PFF_BACKEND_URL=` empty. | No hardcoded placeholder domain in app code; timeouts come from env not set and code still calling. Add guards where BACKEND_URL/APP_URL are required. |

No literal `your-production-domain.com` in **application** code; only in docs. Risk is **empty env** leading to same-origin or invalid fetches.

---

### 3.2 Missing Supabase tables/columns ("Relation Does Not Exist")

These migrations must be applied for the features we audited. If you see "relation does not exist" or "column does not exist", run the corresponding migration.

| Table / Column | Migration | Purpose |
|----------------|-----------|---------|
| **user_profiles.vitalization_streak** | `20260253000000_vitalization_9day_ritual.sql` | 9-Day Ritual streak |
| **user_profiles.vitalization_last_scan_date** | Same | Last scan date for consecutive-day logic |
| **vitalization_daily_scans** | Same | Training sample per phone per day |
| **user_profiles.trust_level** | `20260252000000_trust_level_soft_start.sql` or `20260252000000_trust_level_and_device_terminate.sql` | Soft start / Sovereign Shield suggestion |
| **device_session_terminate** | `20260252000000_trust_level_and_device_terminate.sql` | Remote Terminate Session |
| **user_profiles.palm_hash** | `20260254000000_user_profiles_palm_hash.sql` | Palm Pulse second pillar |
| **user_profiles.locked_vida** | `20260250000000_master_architect_locked_vida_device_model.sql` | 5 VIDA grant split |
| **user_profiles.biometric_strictness** | `20260248000000_user_profiles_biometric_strictness.sql` | Settings slider + Day 9 auto HIGH |

**Action:** Run `supabase db push` (or apply migrations manually) and confirm no "relation/column does not exist" errors in browser/Edge logs.

---

### 3.3 Biometric Sensitivity Slider vs camera thresholds

| Finding | Status | Details |
|--------|--------|---------|
| **Slider persists** | ✅ | `BiometricStrictnessSlider` loads/saves `biometric_strictness` (low/high) via `getBiometricStrictness` / `setBiometricStrictness` and displays `strictnessToConfig(strictness)` (confidenceThreshold, enforceBrightnessCheck). |
| **Gate does not use it** | ❌ **Red** | `FourLayerGate` renders `<ArchitectVisionCapture ... isMasterArchitectInit={isFirstRun \|\| softStart} />` **without** passing `confidenceThreshold` or `enforceBrightnessCheck`. So Architect Vision always uses **defaults** (0.4, no brightness check when `isMasterArchitectInit` true; else defaults in `ArchitectVisionCapture`). The slider **does not** override Face Pulse camera thresholds. |

**Fix:** In `FourLayerGate`, when identity anchor is set, fetch `getBiometricStrictness(anchor.phone)` (and optionally `strictnessToConfig`). When opening Architect Vision, pass `confidenceThreshold` and `enforceBrightnessCheck` from that config (respecting soft start: if `softStart` or `isFirstRun`, force low sensitivity).

---

## 4. Architect Priority List — Next 3 Coding Tasks

To make the system **100% operational**, do the following in order:

1. **Wire Biometric Sensitivity Slider to Face Pulse (and Palm)**  
   - In `FourLayerGate`, load `getBiometricStrictness(identityAnchor.phone)` (and map with `strictnessToConfig`) when identity is set.  
   - Pass `confidenceThreshold` and `enforceBrightnessCheck` into `ArchitectVisionCapture`, respecting soft start (e.g. when `softStart || isFirstRun`, use low sensitivity regardless of stored value).  
   - Optionally apply the same strictness to Palm (e.g. stability/frame requirements) if you expose a threshold there.

2. **Guard backend/API calls when env is empty**  
   - In `governmentTreasury.ts`, do not call `fetch(\`${BACKEND_URL}/economic/...\`)` when `!BACKEND_URL`; use Supabase/fallback only.  
   - In `deviceMigration.ts`, before calling `fetch(\`${apiUrl}/api/security-alert\`)`, check `if (!apiUrl?.trim()) return;` (or equivalent) so no request is sent when backend URL is not set.

3. **Confirm migrations and Realtime**  
   - Apply all migrations under `supabase/migrations/` (especially `20260253000000_vitalization_9day_ritual.sql`, `20260252000000_trust_level_and_device_terminate.sql`, `20260254000000_user_profiles_palm_hash.sql`).  
   - If using Remote Logout via `device_session_terminate`, ensure this table is in the Supabase Realtime publication so `subscribeToTerminateSession` (postgres_changes) receives events.  
   - ~~Remove or replace the placeholder URL in `docs/PRODUCTION-DEPLOYMENT.md`~~ **Done.** Curl example now uses `NEXT_PUBLIC_PFF_BACKEND_URL`; required env vars documented.

---

**Summary**

- **Live:** 9-Day Ritual (streak, Day 9 unlock), 0.1/4.9 start and 0.9 unlock, Sentinel commission in gasless-mint, Face Pulse and Palm Scan init, QR login bridge, Terminate Session bridge, Sovereign Companion on Dashboard with profile data.  
- **Bridges:** Laptop–mobile QR pairing and remote logout are implemented; migrations and Realtime must be applied.  
- **Red list:** No placeholder URLs in app code; guard empty backend URL; ensure all listed migrations are applied; **wire Biometric Slider to Architect Vision (and optionally Palm)** so sensitivity settings affect camera thresholds.

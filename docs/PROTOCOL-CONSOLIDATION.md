# Protocol Consolidation Checklist

Unified state as of consolidation: 9-Day Ritual, Daily $100 Unlock, Biometric Unification, Master Architect, Remote Logout.

## 1. Features Verified

| Feature | Status | Location |
|--------|--------|----------|
| **9-Day Ritual** | ✅ | `web/lib/vitalizationRitual.ts`: `vitalization_streak`, `vitalization_last_scan_date`; `recordDailyScan()`; `getVitalizationStatus()` |
| **Daily $100 Unlock** | ✅ | Same: Days 2–9 move 0.1 VIDA locked → spendable per calendar day; same-day scan = no double-unlock |
| **Biometric Unification** | ✅ | `FourLayerGate`: Face (ArchitectVisionCapture) + Palm (PalmPulseCapture) + Device ID; `confidenceThreshold` / `enforceBrightnessCheck` from `biometric_strictness` (soft-start when streak < 10 or first run) |
| **Master Architect (Day Zero)** | ✅ | `web/lib/masterArchitectInit.ts`: `isFirstRegistration()` uses RPC `get_user_profiles_count`; `creditArchitectVidaGrant(phone)` sets 0.1 spendable + 4.9 locked. RPC in `supabase/migrations/20260249000000_day_zero_and_master_architect.sql` |
| **Remote Logout** | ✅ | `web/lib/deviceTerminateSession.ts`: `requestTerminateSession`, `subscribeToTerminateSession`. `TerminateSessionListener` in `AppShell`; dashboard/settings/treasury/master use AppShell. Table `device_session_terminate` in Realtime publication (unified migration). |

## 2. Build & Deploy

- **Dependencies:** `@mediapipe/face_mesh` and `@mediapipe/hands` in `web/package.json`. No `@mediapipe/drawing_utils` imports in codebase.
- **Static export:** Next.js `output: 'export'`; no Dynamic Server Usage on static pages; API routes are ƒ (handled by Netlify/redirects).
- **Placeholder URLs:** Guarded in `governmentTreasury.ts` and `deviceMigration.ts` when `NEXT_PUBLIC_PFF_BACKEND_URL` empty; docs use env var references.

## 3. Supabase

- Run unified migration `supabase/migrations/20260228000000_unified_profiles_realtime.sql` for `user_profiles` columns and `device_session_terminate` + Realtime.
- Ensure RPC `get_user_profiles_count` exists for Day Zero (in `20260249000000_day_zero_and_master_architect.sql`).

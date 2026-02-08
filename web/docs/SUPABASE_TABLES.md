# Supabase Tables — Project Alignment

This app uses the same profiles and login-request logic as defined in the database migrations.

## Tables

### `user_profiles`
- **Usage:** Identity, verification, and vault state (e.g. `lib/mintStatus.ts`, `lib/loginRequest.ts`, `lib/resetBiometrics.ts`, API routes).
- **Key columns:** `phone_number`, `primary_sentinel_device_id`, `face_hash`, `recovery_seed_hash`, `is_fully_verified`, `is_minted`, `vida_mint_tx_hash`, `country_code`, `device_limit`, `sentinel_plan_type`.
- **Migrations:** e.g. `20260230000000_face_hash_user_profiles.sql`, `20260235000000_identity_bound_and_spending_unlocked.sql`, `20260245000000_user_profiles_country_code.sql`.
- **Note:** The app references the table as `user_profiles` (not `profiles`). Types live in `types/supabase.d.ts` under `user_profile` / `user_profiles`.

### `login_requests`
- **Usage:** Computer-initiated login: computer creates PENDING row; phone approves → APPROVED; computer (Realtime or polling) then fetches user and cleans up.
- **Key columns:** `id`, `phone_number`, `requested_display_name`, `status` (PENDING | APPROVED | DENIED), `device_info`, `created_at`, `responded_at`.
- **Lib:** `lib/loginRequest.ts` — `createLoginRequest`, `approveLoginRequest`, `denyLoginRequest`, `getLoginRequestStatus`, and Realtime subscription for APPROVED.
- **Migration:** `20260240000000_login_requests.sql`. Realtime must be enabled for `login_requests` in Supabase Dashboard (Database → Replication).

All profile and login-request reads/writes in this project use these tables and the logic above.

### `sovereign_device_handshake`
- **Usage:** Cross-device anchoring: when the phone approves a laptop login (Link Device / QR scan), it writes `citizen_hash` and `device_anchor_token` here. The laptop reads the row after login request is APPROVED, applies the anchor locally, then deletes the row.
- **Key columns:** `request_id` (UUID, FK to login_requests), `citizen_hash`, `device_anchor_token`, `created_at`.
- **Lib:** `lib/sovereignDeviceHandshake.ts` — `sendHandshakePayload`, `getHandshakePayload`, `deleteHandshakePayload`.
- **Migration:** `20260263000000_sovereign_device_handshake.sql`. Run in Supabase SQL Editor if not applied via migrations.

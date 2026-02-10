# Verify Vitalization in Supabase

This doc confirms **where** vitalization hashes are stored and **how to check** that the backend has recorded your vitalization (without relying on the UI).

---

## Ways to check the backend

### 1. API (from browser or curl)

Call the app’s status endpoint with your phone number (E.164, e.g. `+234...`):

- **URL:** `GET /api/v1/vitalization-status?phone=+234XXXXXXXXXX`
- **Example (same origin):**  
  `https://your-app.netlify.app/api/v1/vitalization-status?phone=+2348012345678`
- **Example (local):**  
  `http://localhost:3000/api/v1/vitalization-status?phone=+2348012345678`

**Response when vitalized (example):**

```json
{
  "ok": true,
  "found": true,
  "vitalization_status": "VITALIZED",
  "is_minted": true,
  "face_hash_set": true,
  "device_id_set": true,
  "vida_cap_balance": 10,
  "updated_at": "2025-02-09T..."
}
```

**Response when no profile yet:** `"found": false` and a short `message`. So you can confirm the backend has (or has not) recorded your vitalization.

**Note:** You must run the migration that adds the RPC `get_vitalization_status` (e.g. `20260278000000_get_vitalization_status_rpc.sql`) in your Supabase project for this endpoint to work.

### 2. Supabase SQL Editor

Run the queries below in **Supabase → SQL Editor** (replace `+234...` with your phone).

---

## Where hashes are saved

| What | Table | Column(s) |
|------|--------|------------|
| **Face hash** | `public.user_profiles` | `face_hash` (TEXT) |
| **Palm hash** | `public.user_profiles` | `palm_hash` (TEXT) |
| **Device ID (Mobile ID)** | `public.user_profiles` | `anchor_device_id` (TEXT) |
| **GPS** (when 4/4) | `public.user_profiles` | `anchor_geolocation` (JSONB: `{ latitude, longitude, accuracy? }`) |
| **Vitalization status** | `public.user_profiles` | `vitalization_status` (set to `'VITALIZED'` at 75%) |

**Anchor:** All of this is tied to **phone number** in `user_profiles.phone_number`.

- **At 75% (3/4 pillars):** App calls RPC `save_pillars_at_75(phone, face_hash, palm_hash, device_id)` → updates/inserts `user_profiles` with `face_hash`, `palm_hash`, `anchor_device_id`, and sets `vitalization_status = 'VITALIZED'`.
- **At 100% (4/4 pillars):** App can call RPC `save_four_pillars(phone, face_hash, palm_hash, device_id, geolocation)` → also sets `anchor_geolocation`.

---

## Fix: "column anchor_device_id does not exist"

If you see that error, add the missing columns first. In **Supabase → SQL Editor**, run:

```sql
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS anchor_device_id TEXT,
  ADD COLUMN IF NOT EXISTS anchor_geolocation JSONB;

COMMENT ON COLUMN public.user_profiles.anchor_device_id IS 'Device ID (Pillar 3) at vitalization; tied to this phone.';
COMMENT ON COLUMN public.user_profiles.anchor_geolocation IS 'GPS at vitalization (Pillar 4): { latitude, longitude, accuracy }.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_anchor_device ON public.user_profiles(anchor_device_id) WHERE anchor_device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_anchor_geolocation ON public.user_profiles((anchor_geolocation IS NOT NULL)) WHERE anchor_geolocation IS NOT NULL;
```

Then run the verification queries below.

---

## How to confirm in Supabase

1. Open your **Supabase** project → **SQL Editor**.
2. If you got the `anchor_device_id` error, run the **Fix** SQL above first.
3. Run one of the queries below (replace `+234...` with the phone you used to vitalize, or omit the `WHERE` to see all).

### Check if a specific phone has vitalization data

```sql
SELECT
  phone_number,
  full_name,
  CASE WHEN face_hash IS NOT NULL AND TRIM(face_hash) <> '' THEN 'yes' ELSE 'no' END AS face_hash_saved,
  CASE WHEN palm_hash IS NOT NULL AND TRIM(palm_hash) <> '' THEN 'yes' ELSE 'no' END AS palm_hash_saved,
  CASE WHEN anchor_device_id IS NOT NULL AND TRIM(anchor_device_id) <> '' THEN 'yes' ELSE 'no' END AS device_id_saved,
  anchor_geolocation IS NOT NULL AND (anchor_geolocation ? 'latitude' AND anchor_geolocation ? 'longitude') AS gps_saved,
  vitalization_status,
  updated_at
FROM public.user_profiles
WHERE phone_number = '+234XXXXXXXXXX'  -- replace with your phone (E.164)
LIMIT 1;
```

### Safe query (only face + palm; use if anchor columns not added yet)

```sql
SELECT
  phone_number,
  full_name,
  CASE WHEN face_hash IS NOT NULL AND TRIM(face_hash) <> '' THEN 'yes' ELSE 'no' END AS face_hash_saved,
  CASE WHEN palm_hash IS NOT NULL AND TRIM(palm_hash) <> '' THEN 'yes' ELSE 'no' END AS palm_hash_saved,
  vitalization_status,
  updated_at
FROM public.user_profiles
WHERE phone_number = '+234XXXXXXXXXX'
LIMIT 1;
```

### If you get "No rows returned" — list all profiles

Your phone might not be in the table yet, or the format might differ. Run this to see **every** row and what phone numbers exist:

```sql
SELECT
  phone_number,
  full_name,
  CASE WHEN face_hash IS NOT NULL AND TRIM(face_hash) <> '' THEN 'yes' ELSE 'no' END AS face_hash_saved,
  CASE WHEN palm_hash IS NOT NULL AND TRIM(palm_hash) <> '' THEN 'yes' ELSE 'no' END AS palm_hash_saved,
  vitalization_status,
  created_at,
  updated_at
FROM public.user_profiles
ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST;
```

- If this returns **no rows**: `user_profiles` is empty — vitalization has not created a row yet (check app flow / RPC `save_pillars_at_75` or `save_four_pillars`).
- If this returns rows: use the `phone_number` value from a row in your `WHERE phone_number = '...'` query.

### List all vitalized users (hashes present)

```sql
SELECT
  phone_number,
  full_name,
  vitalization_status,
  LEFT(face_hash, 12) || '...' AS face_hash_preview,
  LEFT(palm_hash, 12) || '...' AS palm_hash_preview,
  anchor_device_id,
  anchor_geolocation,
  updated_at
FROM public.user_profiles
WHERE TRIM(COALESCE(face_hash, '')) <> ''
  AND TRIM(COALESCE(palm_hash, '')) <> ''
  AND TRIM(COALESCE(anchor_device_id, '')) <> ''
ORDER BY updated_at DESC;
```

### Check “four pillars complete” (same logic as the app)

```sql
SELECT * FROM public.four_pillars_complete('+234XXXXXXXXXX');
-- Returns { "ok": true, "complete": true } or { "ok": true, "complete": false }
```

---

## Migrations that define this

- `20260230000000_face_hash_user_profiles.sql` — adds `face_hash` to `user_profiles`
- `20260254000000_palm_hash_user_profiles.sql` (or similar) — adds `palm_hash`
- `20260267000000_four_pillars_anchor.sql` — adds `anchor_device_id`, `anchor_geolocation`; RPCs `save_four_pillars`, `four_pillars_complete`
- `20260268000000_save_at_75_vitalized.sql` — RPC `save_pillars_at_75` (writes hashes + sets `vitalization_status = 'VITALIZED'`)

If these migrations have been applied to your Supabase project, vitalization data is stored in **`public.user_profiles`** as above. Use the SQL queries in this file to confirm that the hash was created and where it was saved.

---

## Quick check via RPC (same as the API)

In **Supabase → SQL Editor** you can call the same function the API uses:

```sql
SELECT get_vitalization_status('+234XXXXXXXXXX');  -- replace with your phone
```

This returns one JSONB row with `ok`, `found`, `vitalization_status`, `is_minted`, `face_hash_set`, `device_id_set`, `vida_cap_balance`, `updated_at` (or `message` when not found). Requires migration `20260278000000_get_vitalization_status_rpc.sql` to be applied.

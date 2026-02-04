# Emergency: Manually Insert Master Architect Profile

If `user_profiles` is empty and you are locked out, run the following in **Supabase → SQL Editor**.

## 1. Get your Auth UUID

On the login screen, click **Debug Info** and copy your **User UUID**. Use that value below for `YOUR_AUTH_UUID`.

## 2. Manual insert (replace placeholders)

```sql
-- Replace YOUR_AUTH_UUID with your Supabase Auth user id (from Debug Info).
-- Replace +2348012345678 with your E.164 phone (Identity Anchor).
-- Replace 'Your Full Name' with your display name.

INSERT INTO user_profiles (id, phone_number, full_name, role)
VALUES (
  'YOUR_AUTH_UUID',
  '+2348012345678',
  'Your Full Name',
  'MASTER_ARCHITECT'
)
ON CONFLICT (phone_number) DO UPDATE SET
  id = EXCLUDED.id,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();
```

Example:

```sql
INSERT INTO user_profiles (id, phone_number, full_name, role)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '+2348012345678',
  'Isreal Okoro',
  'MASTER_ARCHITECT'
)
ON CONFLICT (phone_number) DO UPDATE SET
  id = EXCLUDED.id,
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();
```

After running, log in again with the same phone; you should have Master Architect access.

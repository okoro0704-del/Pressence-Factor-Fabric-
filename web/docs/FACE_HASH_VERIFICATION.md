# Face hash storage and verification

## How face is hashed and stored

1. **Face Pulse** (WebAuthn/biometric) runs in the app → `lib/biometricAuth.ts`.
2. A **mathematical hash** of the face credential is derived → `lib/biometricAnchorSync.ts` (`deriveFaceHashFromCredential`). Raw images are never stored.
3. The hash is saved to Supabase → `persistFaceHash(phoneNumber, faceTemplateHash)` in `biometricAnchorSync.ts`:
   - It first tries a direct `user_profiles` update/insert by `phone_number`.
   - If that fails (e.g. RLS blocks it), it calls the **RPC** `update_user_profile_face_hash(p_phone_number, p_face_hash)`.
4. The RPC is defined in **Supabase migration** `supabase/migrations/20260236000000_user_profiles_rls_face_hash_rpc.sql` and runs with `SECURITY DEFINER`, so the save succeeds even when the client cannot update the row directly.

So **yes, the face is hashed and stored in Supabase** when the user completes Face Pulse, as long as:
- The migration `20260236000000_user_profiles_rls_face_hash_rpc.sql` has been run (so the RPC exists), and
- The `user_profiles` table has a `face_hash` column (added in `20260230000000_face_hash_user_profiles.sql` or `20260237000000_verified_vida_mint_receipt.sql`).

## How to check in Supabase

1. Open **Supabase Dashboard** → your project.
2. Go to **Table Editor** → **user_profiles**.
3. Look at the **face_hash** column. For a user who has completed Face Pulse, you should see a non-empty string (e.g. a base64-like hash). Same for **recovery_seed_hash** after they complete the Recovery Key step.

If `face_hash` is empty for a user who you know completed Face Pulse, check:
- That the migration `20260236000000_user_profiles_rls_face_hash_rpc.sql` has been applied (Database → Migrations).
- Browser console for errors like `[FacePulse] persist face_hash failed:` when they completed the step.

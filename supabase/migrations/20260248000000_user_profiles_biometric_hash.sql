-- Fingerprint hash on user_profiles for quick-auth sync (WebAuthn / Touch ID / Face ID).
-- When fingerprint is registered, hash is stored here and in external_fingerprint_hash.
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS biometric_hash TEXT;
COMMENT ON COLUMN public.user_profiles.biometric_hash IS 'SHA-256 hash of fingerprint (or platform biometric); synced when fingerprint is registered for quick-auth.';

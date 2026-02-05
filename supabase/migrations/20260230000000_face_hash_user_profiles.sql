-- Biometric Anchor Sync: face template (mathematical face vector) stored as hash only.
-- BIOMETRIC DATA IS HASHED AND ENCRYPTED. RAW IMAGES ARE NEVER PERSISTED.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS face_hash TEXT;

COMMENT ON COLUMN public.user_profiles.face_hash IS 'SHA-256 hash of face template (mathematical face vector). Raw images never persisted.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_face_hash ON public.user_profiles(face_hash) WHERE face_hash IS NOT NULL;

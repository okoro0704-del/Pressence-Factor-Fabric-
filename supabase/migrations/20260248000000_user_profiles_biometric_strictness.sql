-- Biometric Strictness: user preference for face/fingerprint verification (follows user across devices).
-- Low = High Speed (confidence 0.4, no brightness check). High = Maximum Security (confidence 0.8, lighting enforced).

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS biometric_strictness TEXT DEFAULT 'low' NOT NULL;

COMMENT ON COLUMN public.user_profiles.biometric_strictness IS 'low = High Speed (0.4 confidence, no brightness check); high = Maximum Security (0.8 confidence, Increase Lighting enforced).';

CREATE INDEX IF NOT EXISTS idx_user_profiles_biometric_strictness
  ON public.user_profiles(biometric_strictness)
  WHERE biometric_strictness IS NOT NULL;

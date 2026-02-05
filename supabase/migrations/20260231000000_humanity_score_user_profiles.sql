-- Proof of Personhood (Verified Human): Elite Status.
-- A successful Triple-Pillar scan with external biometric device sets humanity_score to 1.0.
-- Mint is only allowed when humanity_score = 1.0 and biometric_anchor is from an external device.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS humanity_score NUMERIC(3,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.user_profiles.humanity_score IS 'Proof of Personhood: 1.0 when Triple-Pillar scan succeeded with external biometric device. Required for mint.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_humanity_score ON public.user_profiles(humanity_score) WHERE humanity_score = 1.0;

-- Sentinel Activation: one-time $100 debit when balance hits 0.1 VIDA; flip sentinel status to ACTIVE.
-- Persistence: sentinel_activation_debited ensures auto-debit runs only once at start of user journey.

-- user_profiles: one-time flag so we never debit twice
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS sentinel_activation_debited BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.user_profiles.sentinel_activation_debited IS 'True after the one-time $100 (0.1 VIDA) Sentinel Activation debit. Auto-debit runs only once.';

-- sentinel_identities: when debit succeeds, set status ACTIVE and last_activation_date
ALTER TABLE public.sentinel_identities
ADD COLUMN IF NOT EXISTS last_activation_date TIMESTAMPTZ;

COMMENT ON COLUMN public.sentinel_identities.last_activation_date IS 'Set when Sentinel Activation fee is debited and status is flipped to ACTIVE (one-time at start of journey).';

CREATE INDEX IF NOT EXISTS idx_user_profiles_sentinel_activation_debited
ON public.user_profiles(sentinel_activation_debited) WHERE sentinel_activation_debited = TRUE;

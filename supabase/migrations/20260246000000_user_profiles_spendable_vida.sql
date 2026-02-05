-- Treasury: spendable VIDA balance on user_profiles (display in Personal Treasury).
-- If empty, UI defaults to $1,000.00 (1 VIDA). Source of truth for "spendable" display.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS spendable_vida NUMERIC(20, 8) DEFAULT 1.0;

COMMENT ON COLUMN public.user_profiles.spendable_vida IS 'Spendable VIDA balance for Treasury display. Default 1.0 (anchored $1,000).';

CREATE INDEX IF NOT EXISTS idx_user_profiles_spendable_vida ON public.user_profiles(spendable_vida) WHERE spendable_vida IS NOT NULL;

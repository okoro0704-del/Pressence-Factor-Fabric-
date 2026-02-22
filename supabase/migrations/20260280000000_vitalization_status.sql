-- Vitalization Status: Database-driven vitalization (replaces NFT/SBT approach)
-- When a user completes the Sovereign Pulse, their status is set to 'VITALIZED'
-- and they receive 5 VIDA tokens (5 to citizen, 5 to treasury, 1 to foundation)

-- Add vitalization_status column (if not exists - may already be present from foundationSeigniorage.ts)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS vitalization_status TEXT NOT NULL DEFAULT 'PENDING'
  CHECK (vitalization_status IN ('PENDING', 'VITALIZED', 'SUSPENDED', 'REVOKED'));

COMMENT ON COLUMN public.user_profiles.vitalization_status IS 'Sovereign vitalization status: PENDING (not vitalized), VITALIZED (active sovereign), SUSPENDED (temporarily disabled), REVOKED (permanently disabled)';

-- Add vitalized_at timestamp
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS vitalized_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.vitalized_at IS 'Timestamp when the user was vitalized (completed Sovereign Pulse)';

-- Add vitalization_tx_hash to track the VIDA distribution transaction
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS vitalization_tx_hash TEXT;

COMMENT ON COLUMN public.user_profiles.vitalization_tx_hash IS 'Transaction hash of the VIDA distribution (5 to citizen, 5 to treasury, 1 to foundation)';

-- Create index for fast vitalization status queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_vitalization_status
  ON public.user_profiles(vitalization_status)
  WHERE vitalization_status = 'VITALIZED';

-- Create index for vitalized_at queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_vitalized_at
  ON public.user_profiles(vitalized_at)
  WHERE vitalized_at IS NOT NULL;

-- Backfill: Set existing users with is_minted=true to VITALIZED status
UPDATE public.user_profiles
SET 
  vitalization_status = 'VITALIZED',
  vitalized_at = COALESCE(updated_at, created_at)
WHERE 
  is_minted = true 
  AND vitalization_status = 'PENDING';

-- Create function to auto-set vitalized_at when status changes to VITALIZED
CREATE OR REPLACE FUNCTION public.set_vitalized_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If status is being set to VITALIZED and vitalized_at is null, set it to now
  IF NEW.vitalization_status = 'VITALIZED' AND OLD.vitalization_status != 'VITALIZED' AND NEW.vitalized_at IS NULL THEN
    NEW.vitalized_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-set vitalized_at
DROP TRIGGER IF EXISTS before_user_profiles_set_vitalized_timestamp ON public.user_profiles;
CREATE TRIGGER before_user_profiles_set_vitalized_timestamp
  BEFORE UPDATE OF vitalization_status ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vitalized_timestamp();


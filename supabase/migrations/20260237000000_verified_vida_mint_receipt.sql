-- Connect Supabase 'Verified' status to Sovryn Smart Contract.
-- is_fully_verified: when TRUE, app triggers mintVidaToken (5 VIDA to derived RSK wallet).
-- vida_mint_tx_hash: receipt of minting on Sovryn chain.
-- Safe to run only when user_profiles exists (no-op otherwise).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS face_hash TEXT;
    ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS recovery_seed_hash TEXT;
    ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_fully_verified BOOLEAN DEFAULT false;
    ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS vida_mint_tx_hash TEXT;
    EXECUTE 'COMMENT ON COLUMN public.user_profiles.is_fully_verified IS ''When TRUE, listener triggers mintVidaToken (5 VIDA to RSK wallet). Set when face_hash and recovery_seed_hash are both present.''';
    EXECUTE 'COMMENT ON COLUMN public.user_profiles.vida_mint_tx_hash IS ''Transaction hash of 5 VIDA mint on Sovryn chain (receipt).''';
  END IF;
END $$;

-- Optional: set is_fully_verified when both anchors are present (can also be set by app).
CREATE OR REPLACE FUNCTION sync_is_fully_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.face_hash IS NOT NULL AND NEW.face_hash <> '' AND NEW.recovery_seed_hash IS NOT NULL AND NEW.recovery_seed_hash <> '' THEN
    NEW.is_fully_verified := true;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    DROP TRIGGER IF EXISTS before_user_profiles_sync_is_fully_verified ON public.user_profiles;
    CREATE TRIGGER before_user_profiles_sync_is_fully_verified
      BEFORE INSERT OR UPDATE OF face_hash, recovery_seed_hash ON public.user_profiles
      FOR EACH ROW
      EXECUTE PROCEDURE sync_is_fully_verified();
  END IF;
END $$;

-- RPC: Save vida_mint_tx_hash (receipt) after Sovryn mint. Call from API when RLS blocks direct update.
CREATE OR REPLACE FUNCTION save_vida_mint_tx_hash(p_phone_number TEXT, p_tx_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NULLIF(TRIM(p_phone_number), '') IS NULL OR NULLIF(TRIM(p_tx_hash), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number and tx_hash required');
  END IF;
  UPDATE user_profiles
  SET vida_mint_tx_hash = TRIM(p_tx_hash), updated_at = NOW()
  WHERE phone_number = TRIM(p_phone_number);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Profile not found');
  END IF;
  RETURN jsonb_build_object('ok', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION save_vida_mint_tx_hash IS 'Save Sovryn mint transaction hash (receipt) to user_profiles.';

GRANT EXECUTE ON FUNCTION save_vida_mint_tx_hash(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION save_vida_mint_tx_hash(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION save_vida_mint_tx_hash(TEXT, TEXT) TO service_role;

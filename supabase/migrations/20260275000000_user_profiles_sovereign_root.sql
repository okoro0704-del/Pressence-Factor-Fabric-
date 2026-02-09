-- Store Merkle root (face + palm + identity anchor) in user_profiles so every vitalized citizen has one combined hash.
-- Used for one-way recognition; individual pillar hashes remain in face_hash, palm_hash.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS sovereign_root TEXT;

COMMENT ON COLUMN public.user_profiles.sovereign_root IS 'Merkle root of face_hash + palm_hash + identity_anchor_hash. Set after pillars verified. One-way recognition.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_sovereign_root ON public.user_profiles(sovereign_root) WHERE sovereign_root IS NOT NULL;

-- RPC: Set sovereign_root for a user by phone_number (called after generateSovereignRoot on client).
CREATE OR REPLACE FUNCTION update_user_profile_sovereign_root(
  p_phone_number TEXT,
  p_sovereign_root TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF NULLIF(TRIM(COALESCE(p_phone_number, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number required');
  END IF;
  IF NULLIF(TRIM(COALESCE(p_sovereign_root, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sovereign_root required');
  END IF;

  UPDATE user_profiles
  SET sovereign_root = TRIM(p_sovereign_root),
      updated_at = NOW()
  WHERE phone_number = TRIM(p_phone_number);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_profile not found for phone_number');
  END IF;
  RETURN jsonb_build_object('ok', true, 'updated', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION update_user_profile_sovereign_root IS 'Store Merkle/sovereign root for vitalized user by phone. Call after pillars saved and generateSovereignRoot.';

GRANT EXECUTE ON FUNCTION update_user_profile_sovereign_root(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile_sovereign_root(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_user_profile_sovereign_root(TEXT, TEXT) TO service_role;

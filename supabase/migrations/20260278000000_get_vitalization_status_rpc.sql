-- RPC: Return backend vitalization status for a phone (for "check if I'm vitalized" without relying on UI).
-- Used by GET /api/v1/vitalization-status?phone=... so users can confirm the backend has recorded their vitalization.

CREATE OR REPLACE FUNCTION get_vitalization_status(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_balance NUMERIC;
BEGIN
  IF NULLIF(TRIM(p_phone), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone required');
  END IF;

  -- Only select columns that exist in all deployments (is_minted may not be present)
  SELECT
    up.phone_number,
    up.vitalization_status,
    up.face_hash,
    up.palm_hash,
    up.anchor_device_id,
    up.updated_at
  INTO v_profile
  FROM user_profiles up
  WHERE up.phone_number = TRIM(p_phone)
  LIMIT 1;

  IF v_profile.phone_number IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'found', false,
      'message', 'No profile found for this phone. Vitalization not recorded yet.'
    );
  END IF;

  SELECT COALESCE(w.vida_cap_balance, 0) INTO v_balance
  FROM sovereign_internal_wallets w
  WHERE w.phone_number = TRIM(p_phone)
  LIMIT 1;

  RETURN jsonb_build_object(
    'ok', true,
    'found', true,
    'vitalization_status', COALESCE(v_profile.vitalization_status, ''),
    'is_minted', (v_profile.vitalization_status = 'VITALIZED' OR v_profile.vitalization_status = 'Master_Vitalization'),
    'face_hash_set', (v_profile.face_hash IS NOT NULL AND TRIM(COALESCE(v_profile.face_hash, '')) <> ''),
    'device_id_set', (v_profile.anchor_device_id IS NOT NULL AND TRIM(COALESCE(v_profile.anchor_device_id, '')) <> ''),
    'vida_cap_balance', COALESCE(v_balance, 0),
    'updated_at', v_profile.updated_at
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION get_vitalization_status(TEXT) IS 'Return vitalization status for a phone (backend check). Used by /api/v1/vitalization-status. SECURITY DEFINER.';

GRANT EXECUTE ON FUNCTION get_vitalization_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vitalization_status(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_vitalization_status(TEXT) TO service_role;

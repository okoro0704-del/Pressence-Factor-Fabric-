-- At 75% (3/4 pillars) allow saving hash and set verification status to Vitalized.
-- save_pillars_at_75: save face_hash, palm_hash, anchor_device_id; set vitalization_status = 'VITALIZED'.
-- Geolocation can be added when 4th pillar completes (separate update).

CREATE OR REPLACE FUNCTION save_pillars_at_75(
  p_phone_number TEXT,
  p_face_hash TEXT,
  p_palm_hash TEXT,
  p_device_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_updated_at TIMESTAMPTZ := NOW();
BEGIN
  IF NULLIF(TRIM(p_phone_number), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number required');
  END IF;
  IF NULLIF(TRIM(COALESCE(p_face_hash, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'face_hash required');
  END IF;
  IF NULLIF(TRIM(COALESCE(p_palm_hash, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'palm_hash required');
  END IF;
  IF NULLIF(TRIM(COALESCE(p_device_id, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'device_id required');
  END IF;

  SELECT id INTO v_id FROM user_profiles WHERE phone_number = TRIM(p_phone_number) LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE user_profiles
    SET
      face_hash = TRIM(p_face_hash),
      palm_hash = TRIM(p_palm_hash),
      anchor_device_id = TRIM(p_device_id),
      vitalization_status = 'VITALIZED',
      updated_at = v_updated_at
    WHERE id = v_id;
    RETURN jsonb_build_object('ok', true, 'action', 'updated');
  ELSE
    INSERT INTO user_profiles (phone_number, full_name, face_hash, palm_hash, anchor_device_id, vitalization_status, created_at, updated_at)
    VALUES (
      TRIM(p_phone_number),
      '—',
      TRIM(p_face_hash),
      TRIM(p_palm_hash),
      TRIM(p_device_id),
      'VITALIZED',
      v_updated_at,
      v_updated_at
    );
    RETURN jsonb_build_object('ok', true, 'action', 'inserted');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION save_pillars_at_75 IS 'Save Face, Palm, Device ID at 75% verification; set vitalization_status to VITALIZED. Call after minting.';

GRANT EXECUTE ON FUNCTION save_pillars_at_75(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION save_pillars_at_75(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION save_pillars_at_75(TEXT, TEXT, TEXT, TEXT) TO service_role;

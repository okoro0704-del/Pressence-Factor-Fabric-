-- RPC to save recovery seed server-side (bypasses frontend PostgREST schema cache).
-- Call from client when .update() fails with schema cache error.

CREATE OR REPLACE FUNCTION save_recovery_seed(
  p_phone_number TEXT,
  p_recovery_seed_hash TEXT,
  p_recovery_seed_encrypted TEXT,
  p_recovery_seed_iv TEXT,
  p_recovery_seed_salt TEXT,
  p_full_name TEXT DEFAULT '—'
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
  SELECT id INTO v_id
  FROM user_profiles
  WHERE phone_number = TRIM(p_phone_number)
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE user_profiles
    SET
      recovery_seed_hash = p_recovery_seed_hash,
      recovery_seed_encrypted = p_recovery_seed_encrypted,
      recovery_seed_iv = p_recovery_seed_iv,
      recovery_seed_salt = p_recovery_seed_salt,
      updated_at = v_updated_at
    WHERE id = v_id;
    RETURN jsonb_build_object('ok', true, 'action', 'updated');
  ELSE
    INSERT INTO user_profiles (
      phone_number,
      full_name,
      recovery_seed_hash,
      recovery_seed_encrypted,
      recovery_seed_iv,
      recovery_seed_salt,
      updated_at
    ) VALUES (
      TRIM(p_phone_number),
      COALESCE(NULLIF(TRIM(p_full_name), ''), '—'),
      p_recovery_seed_hash,
      p_recovery_seed_encrypted,
      p_recovery_seed_iv,
      p_recovery_seed_salt,
      v_updated_at
    );
    RETURN jsonb_build_object('ok', true, 'action', 'inserted');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION save_recovery_seed IS 'Server-side recovery seed save; use when client .update() fails due to schema cache.';

GRANT EXECUTE ON FUNCTION save_recovery_seed(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION save_recovery_seed(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION save_recovery_seed(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

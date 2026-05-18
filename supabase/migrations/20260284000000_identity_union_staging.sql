-- TFAN / Identity Union: short-lived staging between stage-union and seal-union (WebAuthn ceremony).
-- Raw biometrics are hashed server-side; only face_hash and challenge are retained until seal or expiry.

CREATE TABLE IF NOT EXISTS public.identity_union_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  face_hash TEXT NOT NULL,
  device_id TEXT NOT NULL,
  challenge_hex TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_union_staging_phone_expires
  ON public.identity_union_staging(phone_number, expires_at DESC);

COMMENT ON TABLE public.identity_union_staging IS 'Pre-staging for identity union pipeline; rows deleted after seal or expiry. No raw biometric strings stored.';

-- Stage: hash biometric input, store challenge, return staging id + challenge for WebAuthn.
CREATE OR REPLACE FUNCTION stage_identity_union(
  p_phone_number TEXT,
  p_face_hash TEXT,
  p_device_id TEXT,
  p_challenge_hex TEXT,
  p_ttl_seconds INT DEFAULT 600
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_expires TIMESTAMPTZ := NOW() + (COALESCE(p_ttl_seconds, 600) || ' seconds')::INTERVAL;
BEGIN
  IF NULLIF(TRIM(p_phone_number), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number required');
  END IF;
  IF NULLIF(TRIM(p_face_hash), '') IS NULL OR LENGTH(TRIM(p_face_hash)) <> 64 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'face_hash must be 64 hex chars');
  END IF;
  IF NULLIF(TRIM(p_device_id), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'device_id required');
  END IF;
  IF NULLIF(TRIM(p_challenge_hex), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'challenge_hex required');
  END IF;

  DELETE FROM identity_union_staging
  WHERE phone_number = TRIM(p_phone_number) AND expires_at < NOW();

  INSERT INTO identity_union_staging (phone_number, face_hash, device_id, challenge_hex, expires_at)
  VALUES (TRIM(p_phone_number), LOWER(TRIM(p_face_hash)), TRIM(p_device_id), TRIM(p_challenge_hex), v_expires)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'staging_id', v_id::TEXT,
    'registration_challenge', TRIM(p_challenge_hex)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

-- Seal: persist sovereign root + profile anchors; caller passes computed hashes (no raw biometrics).
CREATE OR REPLACE FUNCTION seal_identity_union(
  p_phone_number TEXT,
  p_face_hash TEXT,
  p_device_id TEXT,
  p_sovereign_root TEXT,
  p_credential_id_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NULLIF(TRIM(p_phone_number), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number required');
  END IF;
  IF NULLIF(TRIM(p_sovereign_root), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sovereign_root required');
  END IF;

  SELECT id INTO v_id FROM user_profiles WHERE phone_number = TRIM(p_phone_number) LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE user_profiles
    SET
      face_hash = COALESCE(NULLIF(TRIM(p_face_hash), ''), face_hash),
      sovereign_root = TRIM(p_sovereign_root),
      anchor_device_id = COALESCE(NULLIF(TRIM(p_device_id), ''), anchor_device_id),
      updated_at = NOW()
    WHERE id = v_id;
  ELSE
    INSERT INTO user_profiles (phone_number, full_name, face_hash, sovereign_root, anchor_device_id, created_at, updated_at)
    VALUES (
      TRIM(p_phone_number),
      '—',
      NULLIF(TRIM(p_face_hash), ''),
      TRIM(p_sovereign_root),
      NULLIF(TRIM(p_device_id), ''),
      NOW(),
      NOW()
    );
  END IF;

  IF NULLIF(TRIM(COALESCE(p_credential_id_hash, '')), '') IS NOT NULL
     AND NULLIF(TRIM(p_face_hash), '') IS NOT NULL THEN
    INSERT INTO device_anchors (phone_number, citizen_hash, credential_id_hash, created_at)
    VALUES (TRIM(p_phone_number), TRIM(p_face_hash), TRIM(p_credential_id_hash), NOW())
    ON CONFLICT (credential_id_hash) DO UPDATE SET
      phone_number = EXCLUDED.phone_number,
      citizen_hash = EXCLUDED.citizen_hash;
  END IF;

  DELETE FROM identity_union_staging WHERE phone_number = TRIM(p_phone_number);

  RETURN jsonb_build_object('ok', true, 'sealed', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION stage_identity_union(TEXT, TEXT, TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION stage_identity_union(TEXT, TEXT, TEXT, TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION stage_identity_union(TEXT, TEXT, TEXT, TEXT, INT) TO service_role;

GRANT EXECUTE ON FUNCTION seal_identity_union(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION seal_identity_union(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION seal_identity_union(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- save_pillars_at_75: use UPSERT so profile is created or updated in one step (avoids "row not found" and races).
-- Ensures humanity_score column exists; then INSERT ... ON CONFLICT (phone_number) DO UPDATE.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS humanity_score NUMERIC(3,2) DEFAULT 0 NOT NULL;

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

  INSERT INTO user_profiles (phone_number, full_name, face_hash, palm_hash, anchor_device_id, vitalization_status, humanity_score, created_at, updated_at)
  VALUES (
    TRIM(p_phone_number),
    '—',
    TRIM(p_face_hash),
    TRIM(p_palm_hash),
    TRIM(p_device_id),
    'VITALIZED',
    1.0,
    v_updated_at,
    v_updated_at
  )
  ON CONFLICT (phone_number) DO UPDATE SET
    face_hash = EXCLUDED.face_hash,
    palm_hash = EXCLUDED.palm_hash,
    anchor_device_id = EXCLUDED.anchor_device_id,
    vitalization_status = EXCLUDED.vitalization_status,
    humanity_score = 1.0,
    updated_at = EXCLUDED.updated_at;

  RETURN jsonb_build_object('ok', true, 'action', 'saved');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION save_pillars_at_75 IS 'Upsert Face, Palm, Device at 75%; set vitalization_status = VITALIZED and humanity_score = 1.0. One call creates or updates profile.';

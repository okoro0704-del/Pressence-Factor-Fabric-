-- Four Pillars Verification: Face ID, Palm Scan, Device ID, GPS — all tied to phone_number (anchor).
-- User cannot access the site until all four are saved in Supabase.
-- Both Face and Palm scans use front camera; hashes stored in user_profiles.

-- user_profiles: anchor device and GPS at vitalization (Pillars 3 & 4)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS anchor_device_id TEXT,
  ADD COLUMN IF NOT EXISTS anchor_geolocation JSONB;

COMMENT ON COLUMN public.user_profiles.anchor_device_id IS 'Device ID (Pillar 3) at vitalization; tied to this phone. Required for site access.';
COMMENT ON COLUMN public.user_profiles.anchor_geolocation IS 'GPS at vitalization (Pillar 4): { latitude, longitude, accuracy }. Required for site access.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_anchor_device ON public.user_profiles(anchor_device_id) WHERE anchor_device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_anchor_geolocation ON public.user_profiles((anchor_geolocation IS NOT NULL)) WHERE anchor_geolocation IS NOT NULL;

-- RPC: Save all four pillars for a phone (face_hash, palm_hash, device_id, geolocation). Creates/updates user_profiles.
CREATE OR REPLACE FUNCTION save_four_pillars(
  p_phone_number TEXT,
  p_face_hash TEXT,
  p_palm_hash TEXT,
  p_device_id TEXT,
  p_geolocation JSONB
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
  IF p_geolocation IS NULL OR (jsonb_typeof(p_geolocation) = 'object' AND NOT (p_geolocation ? 'latitude' AND p_geolocation ? 'longitude')) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'geolocation with latitude and longitude required');
  END IF;

  SELECT id INTO v_id FROM user_profiles WHERE phone_number = TRIM(p_phone_number) LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE user_profiles
    SET
      face_hash = TRIM(p_face_hash),
      palm_hash = TRIM(p_palm_hash),
      anchor_device_id = TRIM(p_device_id),
      anchor_geolocation = p_geolocation,
      updated_at = v_updated_at
    WHERE id = v_id;
    RETURN jsonb_build_object('ok', true, 'action', 'updated');
  ELSE
    INSERT INTO user_profiles (phone_number, full_name, face_hash, palm_hash, anchor_device_id, anchor_geolocation, created_at, updated_at)
    VALUES (
      TRIM(p_phone_number),
      '—',
      TRIM(p_face_hash),
      TRIM(p_palm_hash),
      TRIM(p_device_id),
      p_geolocation,
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

COMMENT ON FUNCTION save_four_pillars IS 'Save Face ID, Palm, Device ID, GPS (four pillars) to user_profiles tied to phone. Required before site access. SECURITY DEFINER.';

GRANT EXECUTE ON FUNCTION save_four_pillars(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_four_pillars(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION save_four_pillars(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- RPC: Check if all four pillars are saved for this phone (for guard / site access).
CREATE OR REPLACE FUNCTION four_pillars_complete(p_phone_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  IF NULLIF(TRIM(p_phone_number), '') IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'complete', false);
  END IF;
  SELECT face_hash, palm_hash, anchor_device_id, anchor_geolocation INTO r
  FROM user_profiles
  WHERE phone_number = TRIM(p_phone_number)
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'complete', false);
  END IF;
  IF NULLIF(TRIM(COALESCE(r.face_hash, '')), '') IS NULL
     OR NULLIF(TRIM(COALESCE(r.palm_hash, '')), '') IS NULL
     OR NULLIF(TRIM(COALESCE(r.anchor_device_id, '')), '') IS NULL
     OR r.anchor_geolocation IS NULL
     OR NOT (r.anchor_geolocation ? 'latitude' AND r.anchor_geolocation ? 'longitude') THEN
    RETURN jsonb_build_object('ok', true, 'complete', false);
  END IF;
  RETURN jsonb_build_object('ok', true, 'complete', true);
END;
$$;

COMMENT ON FUNCTION four_pillars_complete IS 'Returns { ok, complete } whether Face, Palm, Device, GPS are all saved for this phone.';

GRANT EXECUTE ON FUNCTION four_pillars_complete(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION four_pillars_complete(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION four_pillars_complete(TEXT) TO service_role;

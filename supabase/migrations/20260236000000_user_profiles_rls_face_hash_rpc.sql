-- Sovereign-to-Supabase Bridge: ensure user can UPDATE their own row in user_profiles (face_hash, etc.).
-- 1) RLS: allow UPDATE when auth.uid() = id (own profile row).
-- 2) RPC: update_user_profile_face_hash so face_hash saves even when anon or app.current_user_phone not set.

-- Policy: Authenticated user can update their own profile row (id = auth.uid()).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_update_by_auth_id'
  ) THEN
    CREATE POLICY user_profiles_update_by_auth_id ON public.user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- RPC: Save face_hash server-side (bypasses RLS / app.current_user_phone). Call from client when direct update is blocked.
CREATE OR REPLACE FUNCTION update_user_profile_face_hash(
  p_phone_number TEXT,
  p_face_hash TEXT
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
  IF NULLIF(TRIM(p_phone_number), '') IS NULL OR NULLIF(TRIM(p_face_hash), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number and face_hash required');
  END IF;

  SELECT id INTO v_id
  FROM user_profiles
  WHERE phone_number = TRIM(p_phone_number)
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE user_profiles
    SET face_hash = TRIM(p_face_hash), updated_at = v_updated_at
    WHERE id = v_id;
    RETURN jsonb_build_object('ok', true, 'action', 'updated');
  ELSE
    INSERT INTO user_profiles (phone_number, full_name, face_hash, created_at, updated_at)
    VALUES (TRIM(p_phone_number), '—', TRIM(p_face_hash), v_updated_at, v_updated_at);
    RETURN jsonb_build_object('ok', true, 'action', 'inserted');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION update_user_profile_face_hash IS 'Save face_hash to user_profiles; use when client .update() is blocked by RLS. SECURITY DEFINER.';

GRANT EXECUTE ON FUNCTION update_user_profile_face_hash(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile_face_hash(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_user_profile_face_hash(TEXT, TEXT) TO service_role;

-- RPC: Update full_name by phone_number. Bypasses RLS so Settings can save name when anon client cannot UPDATE.
-- Run in Supabase SQL Editor if name save fails with "permission denied" or "row not found".

CREATE OR REPLACE FUNCTION public.update_user_profile_full_name(
  p_phone_number TEXT,
  p_full_name TEXT
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

  UPDATE public.user_profiles
  SET full_name = NULLIF(TRIM(COALESCE(p_full_name, '')), ''),
      updated_at = v_updated_at
  WHERE phone_number = TRIM(p_phone_number);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Profile not found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'action', 'updated');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.update_user_profile_full_name IS 'Update user_profiles.full_name by phone_number. Use from Settings when direct .update() is blocked by RLS.';

GRANT EXECUTE ON FUNCTION public.update_user_profile_full_name(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_user_profile_full_name(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile_full_name(TEXT, TEXT) TO service_role;

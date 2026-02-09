-- Allow changing the master password: RPC updates the stored hash (call only after verifying current password in API).

CREATE OR REPLACE FUNCTION public.update_master_password(p_new_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NULLIF(TRIM(COALESCE(p_new_password, '')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'New password required');
  END IF;
  UPDATE public.master_access
  SET password_hash = encode(digest(TRIM(p_new_password), 'sha256'), 'hex')
  WHERE id = 1;
  IF NOT FOUND THEN
    INSERT INTO public.master_access (id, password_hash)
    VALUES (1, encode(digest(TRIM(p_new_password), 'sha256'), 'hex'))
    ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

COMMENT ON FUNCTION public.update_master_password(text) IS 'Set a new master password (hash stored). Call only after verifying current password.';

GRANT EXECUTE ON FUNCTION public.update_master_password(text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_master_password(text) TO authenticated;

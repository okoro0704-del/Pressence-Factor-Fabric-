-- Master password: one permanent numeric-only password for the architect to access the app from any device.
-- Password (save this; numbers only, it never changes):  202604070001

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.master_access (
  id int PRIMARY KEY DEFAULT 1,
  password_hash text NOT NULL,
  constraint single_row check (id = 1)
);

-- Insert the SHA-256 hash of the master password. Password: 202604070001 (numbers only)
INSERT INTO public.master_access (id, password_hash)
VALUES (1, encode(digest('202604070001', 'sha256'), 'hex'))
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

COMMENT ON TABLE public.master_access IS 'Single row: hash of the permanent master password for app access from any device.';

CREATE OR REPLACE FUNCTION public.validate_master_password(p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_input_hash text;
BEGIN
  IF NULLIF(TRIM(COALESCE(p_password, '')), '') IS NULL THEN
    RETURN false;
  END IF;
  SELECT password_hash INTO v_hash FROM public.master_access WHERE id = 1 LIMIT 1;
  IF v_hash IS NULL THEN
    RETURN false;
  END IF;
  v_input_hash := encode(digest(TRIM(p_password), 'sha256'), 'hex');
  RETURN v_input_hash = v_hash;
END;
$$;

COMMENT ON FUNCTION public.validate_master_password(text) IS 'Returns true if the given password matches the stored master password hash.';

GRANT EXECUTE ON FUNCTION public.validate_master_password(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_master_password(text) TO authenticated;

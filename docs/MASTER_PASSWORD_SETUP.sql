-- =============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR (Dashboard → SQL Editor → New query)
-- Paste this entire file and click "Run". Fixes master password login + change.
-- Default password after running: 202604070001 (then change it in Settings).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table for the single master password hash
CREATE TABLE IF NOT EXISTS public.master_access (
  id int PRIMARY KEY DEFAULT 1,
  password_hash text NOT NULL,
  constraint single_row check (id = 1)
);

-- Set default password to 202604070001 (will overwrite if row exists)
INSERT INTO public.master_access (id, password_hash)
VALUES (1, encode(digest('202604070001', 'sha256'), 'hex'))
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Function: validate master password (used when you log in at bottom of site)
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

GRANT EXECUTE ON FUNCTION public.validate_master_password(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_master_password(text) TO authenticated;

-- Function: update master password (used when you change it in Settings)
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

GRANT EXECUTE ON FUNCTION public.update_master_password(text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_master_password(text) TO authenticated;

-- Optional: verify the row exists and has a hash
-- SELECT id, left(password_hash, 16) || '...' FROM public.master_access WHERE id = 1;

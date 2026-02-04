-- =====================================================
-- DEFENSIVE handle_new_user + GENESIS (First Citizen)
-- Run in Supabase SQL Editor if trigger is broken.
-- =====================================================

-- 1) Defensive trigger: create profile on signup if it doesn't exist.
--    If user_profiles is empty, first user gets MASTER_ARCHITECT (Genesis).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phone_val text;
  name_val text;
  role_val text;
  profile_count int;
BEGIN
  phone_val := COALESCE(TRIM(NEW.phone::text), TRIM(NEW.raw_user_meta_data->>'phone'), '');
  name_val  := COALESCE(TRIM(NEW.raw_user_meta_data->>'full_name'), 'Citizen');

  IF phone_val = '' THEN
    phone_val := COALESCE(TRIM(NEW.email), NEW.id::text);
  END IF;

  SELECT count(*) INTO profile_count FROM user_profiles;

  role_val := CASE WHEN profile_count = 0 THEN 'MASTER_ARCHITECT' ELSE 'CITIZEN' END;

  INSERT INTO user_profiles (id, phone_number, full_name, role)
  VALUES (NEW.id, phone_val, name_val, role_val)
  ON CONFLICT (phone_number)
  DO UPDATE SET
    id = EXCLUDED.id,
    full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), user_profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Defensive: create/update user_profiles on auth signup; first citizen gets MASTER_ARCHITECT.';

-- Drop existing trigger if name differs; create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2) Genesis RPC: if user_profiles is empty, insert current user as MASTER_ARCHITECT (client calls after login).
CREATE OR REPLACE FUNCTION public.genesis_ensure_first_citizen(
  auth_user_id uuid,
  actor_phone text,
  actor_name text DEFAULT 'Genesis'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_count int;
  name_val text;
BEGIN
  name_val := COALESCE(NULLIF(TRIM(actor_name), ''), 'Genesis');
  IF NULLIF(TRIM(actor_phone), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'actor_phone required');
  END IF;

  SELECT count(*) INTO profile_count FROM user_profiles;

  IF profile_count > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_has_citizens');
  END IF;

  INSERT INTO user_profiles (id, phone_number, full_name, role)
  VALUES (auth_user_id, TRIM(actor_phone), name_val, 'MASTER_ARCHITECT');

  RETURN jsonb_build_object('ok', true, 'role', 'MASTER_ARCHITECT');
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('ok', false, 'reason', 'profile_exists');
WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.genesis_ensure_first_citizen(uuid, text, text) IS 'Genesis: if no profiles exist, insert this user as MASTER_ARCHITECT. Call from client after login.';

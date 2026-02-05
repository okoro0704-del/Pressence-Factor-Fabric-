-- Master Architect Initialization: Day Zero detection and first-registration role/status.
-- Run this migration after clearing the database so the app can detect empty DB and assign Architect to the first registrant.

-- 1) RPC for Day Zero: returns count of user_profiles (0 = database cleared). Used by GET /api/day-zero.
CREATE OR REPLACE FUNCTION get_user_profiles_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint FROM user_profiles;
$$;

-- 2) vitalization_status: first registrant gets 'Master_Vitalization'. Add column if not present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'vitalization_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN vitalization_status text DEFAULT NULL;
  END IF;
END $$;

-- 3) role column: ensure it exists for MASTER_ARCHITECT (first registrant). Many setups already have it from admin_roles migration.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role text DEFAULT 'CITIZEN';
  END IF;
END $$;

-- 4) spendable_vida: ensure it exists for 5 VIDA grant (1 spendable, 4 locked). May already exist from 20260246000000.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'spendable_vida'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN spendable_vida numeric DEFAULT 0;
  END IF;
END $$;

COMMENT ON FUNCTION get_user_profiles_count() IS 'Day Zero: returns 0 when database is cleared. Used by app to run nuclear local clear and assign first registrant as Architect.';

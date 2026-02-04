-- =====================================================
-- ADMIN ROLE & AUTHORIZATION SYSTEM
-- Role hierarchy: CITIZEN (default), GOVERNMENT_ADMIN, SENTINEL_OFFICER, MASTER_ARCHITECT
-- Audit: admin_action_logs for role changes and treasury view access
-- =====================================================

-- Add role column to user_profiles (Identity Anchor = phone_number)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'CITIZEN'
  CHECK (role IN ('CITIZEN', 'GOVERNMENT_ADMIN', 'SENTINEL_OFFICER', 'MASTER_ARCHITECT'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

COMMENT ON COLUMN user_profiles.role IS 'CITIZEN (default), GOVERNMENT_ADMIN, SENTINEL_OFFICER, MASTER_ARCHITECT (Isreal)';

-- Ensure MASTER_ARCHITECT for Isreal (optional: set by app or manually)
-- UPDATE user_profiles SET role = 'MASTER_ARCHITECT' WHERE phone_number = '+234...' AND full_name ILIKE '%Isreal%';

-- =====================================================
-- TABLE: admin_action_logs
-- Tracks role changes and treasury view access for accountability
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_identity_anchor TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('ROLE_CHANGE', 'TREASURY_VIEW', 'SENTINEL_VIEW', 'MASTER_VIEW')),
  target_identity_anchor TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_actor ON admin_action_logs(actor_identity_anchor);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_action_type ON admin_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON admin_action_logs(created_at DESC);

COMMENT ON TABLE admin_action_logs IS 'Audit log for role changes and admin view access (treasury, sentinel, master).';

-- RPC: Only MASTER_ARCHITECT can change roles. Updates user_profiles and logs to admin_action_logs.
CREATE OR REPLACE FUNCTION admin_set_user_role(
  actor_phone text,
  target_phone text,
  new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role text;
  actor_is_master boolean;
BEGIN
  IF new_role NOT IN ('CITIZEN', 'GOVERNMENT_ADMIN', 'SENTINEL_OFFICER', 'MASTER_ARCHITECT') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE phone_number = actor_phone AND role = 'MASTER_ARCHITECT') INTO actor_is_master;
  IF NOT actor_is_master THEN
    RAISE EXCEPTION 'Only MASTER_ARCHITECT can set role';
  END IF;

  SELECT role INTO old_role FROM user_profiles WHERE phone_number = target_phone;
  IF old_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE user_profiles SET role = new_role, updated_at = NOW() WHERE phone_number = target_phone;

  INSERT INTO admin_action_logs (actor_identity_anchor, action_type, target_identity_anchor, old_value, new_value)
  VALUES (actor_phone, 'ROLE_CHANGE', target_phone, old_role, new_role);

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION admin_set_user_role IS 'Only MASTER_ARCHITECT can change user roles. Logs to admin_action_logs.';

-- RPC: MASTER_ARCHITECT can fetch any user by phone (for search in master dashboard)
CREATE OR REPLACE FUNCTION admin_get_user_by_phone(actor_phone text, search_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_is_master boolean;
  rec record;
BEGIN
  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE phone_number = actor_phone AND role = 'MASTER_ARCHITECT') INTO actor_is_master;
  IF NOT actor_is_master THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only MASTER_ARCHITECT can search users');
  END IF;

  SELECT phone_number, full_name, role INTO rec
  FROM user_profiles WHERE phone_number = search_phone;

  IF rec IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'found', false);
  END IF;

  RETURN jsonb_build_object('ok', true, 'found', true, 'phone_number', rec.phone_number, 'full_name', rec.full_name, 'role', rec.role);
END;
$$;

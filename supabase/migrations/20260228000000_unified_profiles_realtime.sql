-- =============================================================================
-- UNIFIED MIGRATION: Missing user_profiles columns, device_session_terminate,
-- and Realtime for device_session_terminate + login_requests.
-- Run this single block in Supabase SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) user_profiles: add missing columns (idempotent)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'vitalization_streak') THEN
    ALTER TABLE user_profiles ADD COLUMN vitalization_streak INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'vitalization_last_scan_date') THEN
    ALTER TABLE user_profiles ADD COLUMN vitalization_last_scan_date DATE DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'trust_level') THEN
    ALTER TABLE user_profiles ADD COLUMN trust_level INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'palm_hash') THEN
    ALTER TABLE user_profiles ADD COLUMN palm_hash TEXT DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'locked_vida') THEN
    ALTER TABLE user_profiles ADD COLUMN locked_vida NUMERIC(20, 8) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'biometric_strictness') THEN
    ALTER TABLE user_profiles ADD COLUMN biometric_strictness TEXT DEFAULT 'low' NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.user_profiles.vitalization_streak IS '9-Day Ritual: consecutive days of Face+Fingerprint scan. Reaches 9 to unlock 0.9 VIDA from locked to spendable.';
COMMENT ON COLUMN public.user_profiles.vitalization_last_scan_date IS 'Last calendar day (YYYY-MM-DD) a daily scan was recorded. Used for consecutive-day logic.';
COMMENT ON COLUMN public.user_profiles.trust_level IS 'Increments on each successful login. When > 10, suggest Sovereign Shield (High Security). Soft Start: first 10 logins use LOW sensitivity.';
COMMENT ON COLUMN public.user_profiles.palm_hash IS 'SHA-256 hash of palm geometry. Used for Palm Pulse (second pillar).';
COMMENT ON COLUMN public.user_profiles.locked_vida IS 'Locked VIDA (e.g. 4 for Master Architect 5 VIDA grant).';
COMMENT ON COLUMN public.user_profiles.biometric_strictness IS 'low = High Speed (0.4 confidence, no brightness); high = Maximum Security (0.8 confidence, Increase Lighting).';

CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_level ON user_profiles(trust_level) WHERE trust_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_palm_hash ON user_profiles(palm_hash) WHERE palm_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_biometric_strictness ON user_profiles(biometric_strictness) WHERE biometric_strictness IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2) device_session_terminate table (if not exists)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_session_terminate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_session_terminate_device_id ON device_session_terminate(device_id);
CREATE INDEX IF NOT EXISTS idx_device_session_terminate_requested_at ON device_session_terminate(requested_at DESC);

ALTER TABLE device_session_terminate ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_session_terminate' AND policyname = 'device_session_terminate_insert') THEN
    CREATE POLICY device_session_terminate_insert ON device_session_terminate FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_session_terminate' AND policyname = 'device_session_terminate_select') THEN
    CREATE POLICY device_session_terminate_select ON device_session_terminate FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

ALTER TABLE device_session_terminate REPLICA IDENTITY FULL;
COMMENT ON TABLE device_session_terminate IS 'Insert a row to signal a device to terminate session. Laptops subscribe via Realtime and reload when their device_id appears.';

-- -----------------------------------------------------------------------------
-- 3) Realtime: add device_session_terminate and login_requests to publication
--    (safe to run if already added)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'device_session_terminate') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE device_session_terminate;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'login_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE login_requests;
  END IF;
END $$;

-- Ensure login_requests has full row for Realtime UPDATE events (no-op if already set)
ALTER TABLE login_requests REPLICA IDENTITY FULL;

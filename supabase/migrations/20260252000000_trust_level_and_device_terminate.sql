-- DNA Learning Curve: trust_level increments on each successful login.
-- When trust_level > 10, app suggests Sovereign Shield (High Security) mode.
-- Soft Start: first 10 logins use LOW sensitivity regardless of stored preference.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS trust_level INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN user_profiles.trust_level IS 'Increments on each successful login. When > 10, suggest Sovereign Shield (High Security). Soft Start: first 10 logins use LOW sensitivity.';

-- Remote logout: when "Terminate Session" is clicked for a laptop, broadcast triggers location.reload() on that device.
CREATE TABLE IF NOT EXISTS device_session_terminate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_session_terminate_device_id ON device_session_terminate(device_id);
CREATE INDEX IF NOT EXISTS idx_device_session_terminate_requested_at ON device_session_terminate(requested_at DESC);

ALTER TABLE device_session_terminate ENABLE ROW LEVEL SECURITY;

CREATE POLICY device_session_terminate_insert ON device_session_terminate FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY device_session_terminate_select ON device_session_terminate FOR SELECT TO anon, authenticated USING (true);

COMMENT ON TABLE device_session_terminate IS 'Insert a row to signal a device to terminate session (location.reload). Laptops subscribe via Realtime and reload when their device_id appears.';

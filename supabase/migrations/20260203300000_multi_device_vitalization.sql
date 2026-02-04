-- =====================================================
-- MULTI-DEVICE VITALIZATION CONFIRMATION SYSTEM
-- Architect: Isreal Okoro (mrfundzman)
-- Date: 2026-02-03
-- =====================================================

-- =====================================================
-- TABLE: vitalization_requests
-- Stores pending device authorization requests
-- =====================================================
CREATE TABLE IF NOT EXISTS vitalization_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_name TEXT NOT NULL,
  hardware_hash TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  geolocation JSONB,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DENIED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  primary_device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: authorized_devices
-- Stores all authorized devices for each user
-- =====================================================
CREATE TABLE IF NOT EXISTS authorized_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  hardware_hash TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED', 'SUSPENDED')),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  authorized_by_device TEXT,
  last_used_at TIMESTAMPTZ,
  device_nickname TEXT,
  user_agent TEXT,
  platform TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  ip_address TEXT,
  geolocation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_profiles
-- Stores user profile data including PRIMARY_SENTINEL
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  primary_sentinel_device_id TEXT,
  primary_sentinel_assigned_at TIMESTAMPTZ,
  guardian_recovery_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: guardian_recovery_requests
-- Stores guardian recovery requests for lost primary devices
-- =====================================================
CREATE TABLE IF NOT EXISTS guardian_recovery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  old_primary_device_id TEXT,
  new_device_id TEXT NOT NULL,
  new_device_name TEXT NOT NULL,
  new_device_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED')),
  required_approvals INT NOT NULL DEFAULT 3,
  current_approvals INT NOT NULL DEFAULT 0,
  approved_by_guardians JSONB DEFAULT '[]'::jsonb,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: guardian_approvals
-- Stores individual guardian approvals for recovery requests
-- =====================================================
CREATE TABLE IF NOT EXISTS guardian_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_request_id UUID NOT NULL REFERENCES guardian_recovery_requests(id) ON DELETE CASCADE,
  guardian_phone_number TEXT NOT NULL,
  guardian_full_name TEXT NOT NULL,
  biometric_hash TEXT NOT NULL,
  face_scan_variance DECIMAL(5, 2),
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  geolocation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_vitalization_requests_phone_number ON vitalization_requests(phone_number);
CREATE INDEX IF NOT EXISTS idx_vitalization_requests_status ON vitalization_requests(status);
CREATE INDEX IF NOT EXISTS idx_vitalization_requests_requested_at ON vitalization_requests(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_authorized_devices_phone_number ON authorized_devices(phone_number);
CREATE INDEX IF NOT EXISTS idx_authorized_devices_device_id ON authorized_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_authorized_devices_status ON authorized_devices(status);
CREATE INDEX IF NOT EXISTS idx_authorized_devices_is_primary ON authorized_devices(is_primary);

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_number ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_sentinel ON user_profiles(primary_sentinel_device_id);

CREATE INDEX IF NOT EXISTS idx_guardian_recovery_requests_phone_number ON guardian_recovery_requests(phone_number);
CREATE INDEX IF NOT EXISTS idx_guardian_recovery_requests_status ON guardian_recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_guardian_recovery_requests_expires_at ON guardian_recovery_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_guardian_approvals_recovery_request_id ON guardian_approvals(recovery_request_id);
CREATE INDEX IF NOT EXISTS idx_guardian_approvals_guardian_phone ON guardian_approvals(guardian_phone_number);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE vitalization_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_recovery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own vitalization requests
CREATE POLICY vitalization_requests_select_policy ON vitalization_requests
  FOR SELECT
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can insert their own vitalization requests
CREATE POLICY vitalization_requests_insert_policy ON vitalization_requests
  FOR INSERT
  WITH CHECK (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can update their own vitalization requests
CREATE POLICY vitalization_requests_update_policy ON vitalization_requests
  FOR UPDATE
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can view their own authorized devices
CREATE POLICY authorized_devices_select_policy ON authorized_devices
  FOR SELECT
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can insert their own authorized devices
CREATE POLICY authorized_devices_insert_policy ON authorized_devices
  FOR INSERT
  WITH CHECK (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can update their own authorized devices
CREATE POLICY authorized_devices_update_policy ON authorized_devices
  FOR UPDATE
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can view their own profile
CREATE POLICY user_profiles_select_policy ON user_profiles
  FOR SELECT
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can insert their own profile
CREATE POLICY user_profiles_insert_policy ON user_profiles
  FOR INSERT
  WITH CHECK (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can update their own profile
CREATE POLICY user_profiles_update_policy ON user_profiles
  FOR UPDATE
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can view their own guardian recovery requests
CREATE POLICY guardian_recovery_requests_select_policy ON guardian_recovery_requests
  FOR SELECT
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can insert their own guardian recovery requests
CREATE POLICY guardian_recovery_requests_insert_policy ON guardian_recovery_requests
  FOR INSERT
  WITH CHECK (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Users can update their own guardian recovery requests
CREATE POLICY guardian_recovery_requests_update_policy ON guardian_recovery_requests
  FOR UPDATE
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Policy: Guardians can view recovery requests they need to approve
CREATE POLICY guardian_approvals_select_policy ON guardian_approvals
  FOR SELECT
  USING (guardian_phone_number = current_setting('app.current_user_phone', true));

-- Policy: Guardians can insert their approvals
CREATE POLICY guardian_approvals_insert_policy ON guardian_approvals
  FOR INSERT
  WITH CHECK (guardian_phone_number = current_setting('app.current_user_phone', true));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update updated_at timestamp on vitalization_requests
CREATE OR REPLACE FUNCTION update_vitalization_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vitalization_requests_updated_at_trigger
  BEFORE UPDATE ON vitalization_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_vitalization_requests_updated_at();

-- Trigger: Update updated_at timestamp on authorized_devices
CREATE OR REPLACE FUNCTION update_authorized_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER authorized_devices_updated_at_trigger
  BEFORE UPDATE ON authorized_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_authorized_devices_updated_at();

-- Trigger: Update updated_at timestamp on user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Trigger: Update updated_at timestamp on guardian_recovery_requests
CREATE OR REPLACE FUNCTION update_guardian_recovery_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guardian_recovery_requests_updated_at_trigger
  BEFORE UPDATE ON guardian_recovery_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_guardian_recovery_requests_updated_at();

-- Trigger: Auto-approve guardian recovery request when 3 approvals reached
CREATE OR REPLACE FUNCTION check_guardian_recovery_approval()
RETURNS TRIGGER AS $$
DECLARE
  approval_count INT;
  recovery_request guardian_recovery_requests%ROWTYPE;
BEGIN
  -- Get current approval count
  SELECT COUNT(*) INTO approval_count
  FROM guardian_approvals
  WHERE recovery_request_id = NEW.recovery_request_id;

  -- Get recovery request
  SELECT * INTO recovery_request
  FROM guardian_recovery_requests
  WHERE id = NEW.recovery_request_id;

  -- If we have 3 or more approvals, approve the request
  IF approval_count >= recovery_request.required_approvals THEN
    UPDATE guardian_recovery_requests
    SET
      status = 'APPROVED',
      current_approvals = approval_count,
      completed_at = NOW()
    WHERE id = NEW.recovery_request_id;

    -- Update user profile with new primary sentinel
    UPDATE user_profiles
    SET
      primary_sentinel_device_id = recovery_request.new_device_id,
      primary_sentinel_assigned_at = NOW()
    WHERE phone_number = recovery_request.phone_number;

    -- Add new device to authorized_devices as primary
    INSERT INTO authorized_devices (
      phone_number,
      device_id,
      device_name,
      device_type,
      hardware_hash,
      is_primary,
      status,
      authorized_at,
      authorized_by_device
    ) VALUES (
      recovery_request.phone_number,
      recovery_request.new_device_id,
      recovery_request.new_device_name,
      recovery_request.new_device_type,
      'guardian_recovery',
      true,
      'ACTIVE',
      NOW(),
      'GUARDIAN_RECOVERY'
    );

    -- Revoke old primary device if it exists
    IF recovery_request.old_primary_device_id IS NOT NULL THEN
      UPDATE authorized_devices
      SET
        status = 'REVOKED',
        is_primary = false
      WHERE device_id = recovery_request.old_primary_device_id;
    END IF;
  ELSE
    -- Update current approval count
    UPDATE guardian_recovery_requests
    SET current_approvals = approval_count
    WHERE id = NEW.recovery_request_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guardian_approval_check_trigger
  AFTER INSERT ON guardian_approvals
  FOR EACH ROW
  EXECUTE FUNCTION check_guardian_recovery_approval();

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Active vitalization requests
CREATE OR REPLACE VIEW active_vitalization_requests AS
SELECT
  id,
  phone_number,
  device_id,
  device_type,
  device_name,
  geolocation,
  requested_at,
  EXTRACT(EPOCH FROM (NOW() - requested_at)) AS seconds_pending
FROM vitalization_requests
WHERE status = 'PENDING'
ORDER BY requested_at DESC;

-- View: Device authorization analytics
CREATE OR REPLACE VIEW device_authorization_analytics AS
SELECT
  phone_number,
  COUNT(*) AS total_devices,
  COUNT(*) FILTER (WHERE is_primary = true) AS primary_devices,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_devices,
  COUNT(*) FILTER (WHERE status = 'REVOKED') AS revoked_devices,
  MAX(authorized_at) AS last_device_authorized,
  MAX(last_used_at) AS last_device_used
FROM authorized_devices
GROUP BY phone_number;

-- View: Guardian recovery requests with approval status
CREATE OR REPLACE VIEW guardian_recovery_status AS
SELECT
  grr.id,
  grr.phone_number,
  grr.new_device_name,
  grr.new_device_type,
  grr.status,
  grr.required_approvals,
  grr.current_approvals,
  grr.requested_at,
  grr.expires_at,
  grr.completed_at,
  EXTRACT(EPOCH FROM (grr.expires_at - NOW())) AS seconds_until_expiry,
  CASE
    WHEN grr.status = 'PENDING' AND NOW() > grr.expires_at THEN true
    ELSE false
  END AS is_expired
FROM guardian_recovery_requests grr
ORDER BY grr.requested_at DESC;

-- View: User sentinel devices summary
CREATE OR REPLACE VIEW user_sentinel_devices AS
SELECT
  up.phone_number,
  up.full_name,
  up.primary_sentinel_device_id,
  up.primary_sentinel_assigned_at,
  up.guardian_recovery_enabled,
  ad.device_name AS primary_device_name,
  ad.device_type AS primary_device_type,
  ad.last_used_at AS primary_last_used,
  (SELECT COUNT(*) FROM authorized_devices WHERE phone_number = up.phone_number AND status = 'ACTIVE') AS total_active_devices,
  (SELECT COUNT(*) FROM authorized_devices WHERE phone_number = up.phone_number AND status = 'REVOKED') AS total_revoked_devices
FROM user_profiles up
LEFT JOIN authorized_devices ad ON up.primary_sentinel_device_id = ad.device_id
ORDER BY up.created_at DESC;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE vitalization_requests IS 'Stores pending device authorization requests from secondary devices';
COMMENT ON TABLE authorized_devices IS 'Stores all authorized devices for each user with primary device designation';
COMMENT ON TABLE user_profiles IS 'Stores user profile data including PRIMARY_SENTINEL device assignment';
COMMENT ON TABLE guardian_recovery_requests IS 'Stores guardian recovery requests for lost primary devices';
COMMENT ON TABLE guardian_approvals IS 'Stores individual guardian approvals for recovery requests';
COMMENT ON VIEW active_vitalization_requests IS 'Shows all pending vitalization requests with time elapsed';
COMMENT ON VIEW device_authorization_analytics IS 'Provides analytics on device authorization per user';
COMMENT ON VIEW guardian_recovery_status IS 'Shows guardian recovery requests with approval status and expiry';
COMMENT ON VIEW user_sentinel_devices IS 'Shows user sentinel devices summary with primary device info';


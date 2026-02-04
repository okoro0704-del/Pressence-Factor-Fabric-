-- ============================================================================
-- SENTINEL LICENSING & TIERED REVENUE ENGINE
-- sentinel_licenses: owner_id (IdentityAnchor phone), tier_type, max_devices, expiry_date
-- sentinel_license_devices: device UUID linked to license (device fingerprinting)
-- sentinel_business_ledger: payments recorded in USD/DLLR
-- ============================================================================

-- sentinel_licenses: license status per IdentityAnchor (phone)
CREATE TABLE IF NOT EXISTS sentinel_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  tier_type TEXT NOT NULL CHECK (tier_type IN ('TIER_20', 'TIER_50', 'TIER_400', 'TIER_1000')),
  max_devices INTEGER NOT NULL,
  expiry_date TIMESTAMPTZ,
  pff_api_key TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_licenses_owner_id ON sentinel_licenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_sentinel_licenses_tier_type ON sentinel_licenses(tier_type);
CREATE INDEX IF NOT EXISTS idx_sentinel_licenses_status ON sentinel_licenses(status);

-- sentinel_license_devices: device UUID bound to a license (device fingerprinting)
CREATE TABLE IF NOT EXISTS sentinel_license_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES sentinel_licenses(id) ON DELETE CASCADE,
  device_uuid TEXT NOT NULL,
  bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(license_id, device_uuid)
);

CREATE INDEX IF NOT EXISTS idx_sentinel_license_devices_license_id ON sentinel_license_devices(license_id);
CREATE INDEX IF NOT EXISTS idx_sentinel_license_devices_device_uuid ON sentinel_license_devices(device_uuid);

-- sentinel_business_ledger: payments (USD/DLLR) for Sentinel tiers
CREATE TABLE IF NOT EXISTS sentinel_business_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  tier_type TEXT NOT NULL,
  amount_usd NUMERIC(20, 2) NOT NULL,
  amount_dllr NUMERIC(20, 8),
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentinel_business_ledger_owner_id ON sentinel_business_ledger(owner_id);
CREATE INDEX IF NOT EXISTS idx_sentinel_business_ledger_created_at ON sentinel_business_ledger(created_at);

COMMENT ON TABLE sentinel_licenses IS 'PFF Sentinel license per IdentityAnchor. Tier: $20=1 device, $50=3, $400=5+business API, $1000=15+business API.';
COMMENT ON TABLE sentinel_license_devices IS 'Device UUIDs linked to a license (device fingerprinting).';
COMMENT ON TABLE sentinel_business_ledger IS 'Sentinel tier payments recorded in USD/DLLR.';

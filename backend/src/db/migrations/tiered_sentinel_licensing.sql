/**
 * PFF Database Migration — Tiered Sentinel Licensing
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-01
 *
 * Purpose:
 * - Create tables for tiered Sentinel licensing (Tier 1, Tier 2, Tier 3)
 * - Track license purchases with tier, pricing, and device limits
 * - Manage seat bindings for multi-device tiers (Tier 2 & 3)
 * - Audit trail for seat revocations
 *
 * Tier 1 (Citizen): $10.00 for 1 device
 * Tier 2 (Personal Multi): $30.00 for up to 5 devices
 * Tier 3 (Enterprise): $1,000.00 for up to 20 devices
 */

-- ============================================================================
-- TABLE: sentinel_licenses
-- Tracks Sentinel license purchases with tier information
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  pff_id TEXT NOT NULL,
  tier VARCHAR(50) NOT NULL, -- TIER_1_CITIZEN, TIER_2_PERSONAL_MULTI, TIER_3_ENTERPRISE
  tier_name VARCHAR(100) NOT NULL, -- Citizen, Personal Multi, Enterprise
  price_usd NUMERIC(10, 2) NOT NULL, -- $10.00, $30.00, $1000.00
  price_vida NUMERIC(20, 8) NOT NULL, -- Converted price in VIDA
  max_devices INTEGER NOT NULL, -- 1, 5, 20
  payment_transaction_hash VARCHAR(255) NOT NULL,
  oracle_price NUMERIC(20, 8) NOT NULL, -- VIDA/USD price at time of purchase
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL for lifetime licenses
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, REVOKED
  metadata JSONB, -- Additional tier-specific metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(citizen_id, tier) -- One license per tier per citizen
);

CREATE INDEX idx_sentinel_licenses_citizen_id ON sentinel_licenses(citizen_id);
CREATE INDEX idx_sentinel_licenses_tier ON sentinel_licenses(tier);
CREATE INDEX idx_sentinel_licenses_status ON sentinel_licenses(status);
CREATE INDEX idx_sentinel_licenses_purchased_at ON sentinel_licenses(purchased_at);

-- ============================================================================
-- TABLE: sentinel_license_seats
-- Tracks device bindings for multi-device licenses (Tier 2 & 3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_license_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES sentinel_licenses(id) ON DELETE CASCADE,
  hardware_tpm_hash VARCHAR(255) NOT NULL, -- Unique hardware TPM hash
  device_id VARCHAR(255) NOT NULL, -- Device UUID
  device_fingerprint TEXT NOT NULL, -- SHA-256 hash of device info
  device_platform VARCHAR(100), -- iOS, Android, Windows, macOS, Linux
  device_model VARCHAR(255), -- Device model/name
  master_security_token TEXT, -- Hardware-bound security token
  bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ, -- Last time device was active
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, REVOKED
  revoked_at TIMESTAMPTZ, -- When seat was revoked
  revoked_by VARCHAR(255), -- PFF ID of user who revoked
  revocation_reason TEXT, -- Reason for revocation
  metadata JSONB, -- Additional device metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(license_id, hardware_tpm_hash) -- One seat per hardware TPM hash per license
);

CREATE INDEX idx_sentinel_license_seats_license_id ON sentinel_license_seats(license_id);
CREATE INDEX idx_sentinel_license_seats_hardware_tpm_hash ON sentinel_license_seats(hardware_tpm_hash);
CREATE INDEX idx_sentinel_license_seats_status ON sentinel_license_seats(status);
CREATE INDEX idx_sentinel_license_seats_bound_at ON sentinel_license_seats(bound_at);

-- ============================================================================
-- TABLE: sentinel_seat_revocations
-- Audit trail for seat unbindings (for compliance and security)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_seat_revocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id UUID NOT NULL REFERENCES sentinel_license_seats(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES sentinel_licenses(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  pff_id TEXT NOT NULL,
  hardware_tpm_hash VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  revoked_by VARCHAR(255) NOT NULL, -- PFF ID of user who revoked
  revocation_reason TEXT,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB, -- Additional revocation metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sentinel_seat_revocations_seat_id ON sentinel_seat_revocations(seat_id);
CREATE INDEX idx_sentinel_seat_revocations_license_id ON sentinel_seat_revocations(license_id);
CREATE INDEX idx_sentinel_seat_revocations_citizen_id ON sentinel_seat_revocations(citizen_id);
CREATE INDEX idx_sentinel_seat_revocations_revoked_at ON sentinel_seat_revocations(revoked_at);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
SELECT 
  table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('sentinel_licenses', 'sentinel_license_seats', 'sentinel_seat_revocations')
ORDER BY table_name;

-- ============================================================================
-- MONITORING QUERIES
-- ============================================================================

-- Get license distribution by tier
-- SELECT tier, tier_name, COUNT(*) as license_count, SUM(price_usd) as total_revenue_usd
-- FROM sentinel_licenses
-- WHERE status = 'ACTIVE'
-- GROUP BY tier, tier_name
-- ORDER BY tier;

-- Get seat usage by license
-- SELECT 
--   l.id as license_id,
--   l.pff_id,
--   l.tier_name,
--   l.max_devices,
--   COUNT(s.id) as seats_used,
--   (l.max_devices - COUNT(s.id)) as seats_available
-- FROM sentinel_licenses l
-- LEFT JOIN sentinel_license_seats s ON l.id = s.license_id AND s.status = 'ACTIVE'
-- WHERE l.status = 'ACTIVE'
-- GROUP BY l.id, l.pff_id, l.tier_name, l.max_devices
-- ORDER BY l.tier, l.purchased_at DESC;

-- Get revocation history
-- SELECT 
--   r.revoked_at,
--   r.pff_id,
--   l.tier_name,
--   r.device_id,
--   r.revoked_by,
--   r.revocation_reason
-- FROM sentinel_seat_revocations r
-- JOIN sentinel_licenses l ON r.license_id = l.id
-- ORDER BY r.revoked_at DESC
-- LIMIT 100;


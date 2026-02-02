/**
 * PFF Database Schema — Complete Update
 * Combines Mobile Binding Bridge + Genesis Hash Seal
 * Run this in Supabase SQL Editor
 * Date: 2026-02-02
 * Architect: Isreal Okoro (mrfundzman)
 */

-- ============================================================================
-- 1. CREATE sentinel_auth_tokens TABLE (Mobile Binding Bridge)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_pin TEXT NOT NULL UNIQUE,
  device_uuid TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('LAPTOP', 'MOBILE')),
  architect_alias TEXT NOT NULL DEFAULT 'mrfundzman',
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sentinel_auth_tokens_pin 
ON sentinel_auth_tokens(token_pin);

CREATE INDEX IF NOT EXISTS idx_sentinel_auth_tokens_device 
ON sentinel_auth_tokens(device_uuid);

CREATE INDEX IF NOT EXISTS idx_sentinel_auth_tokens_expires 
ON sentinel_auth_tokens(expires_at);

-- ============================================================================
-- 2. ADD is_live COLUMN to root_sovereign_devices
-- ============================================================================

ALTER TABLE root_sovereign_devices 
ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for is_live queries
CREATE INDEX IF NOT EXISTS idx_root_sovereign_devices_is_live 
ON root_sovereign_devices(is_live);

-- ============================================================================
-- 3. ADD genesis_hash COLUMN to sentinel_telemetry (Genesis Hash Seal)
-- ============================================================================

ALTER TABLE sentinel_telemetry 
ADD COLUMN IF NOT EXISTS genesis_hash TEXT;

-- Create index for genesis_hash queries
CREATE INDEX IF NOT EXISTS idx_sentinel_telemetry_genesis_hash 
ON sentinel_telemetry(genesis_hash);

-- ============================================================================
-- 4. OPTIONAL: ADD is_live COLUMN to sentinel_telemetry (for future use)
-- ============================================================================

ALTER TABLE sentinel_telemetry 
ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for is_live queries
CREATE INDEX IF NOT EXISTS idx_sentinel_telemetry_is_live 
ON sentinel_telemetry(is_live);

-- Update existing record to set is_live = TRUE
UPDATE sentinel_telemetry
SET is_live = TRUE
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Check if sentinel_auth_tokens table was created
SELECT COUNT(*) as token_table_exists 
FROM information_schema.tables 
WHERE table_name = 'sentinel_auth_tokens';

-- Check if is_live column was added to root_sovereign_devices
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'root_sovereign_devices' 
AND column_name = 'is_live';

-- Check if genesis_hash column was added to sentinel_telemetry
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sentinel_telemetry' 
AND column_name = 'genesis_hash';

-- Check if is_live column was added to sentinel_telemetry
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sentinel_telemetry' 
AND column_name = 'is_live';

-- View current sentinel_telemetry record
SELECT id, genesis_hash, is_live, last_updated 
FROM sentinel_telemetry 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- View current root_sovereign_devices records
SELECT device_uuid, device_type, is_root_pair, is_live, activation_timestamp 
FROM root_sovereign_devices 
ORDER BY activation_timestamp DESC;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

-- After running this SQL, you should see:
-- ✅ sentinel_auth_tokens table created
-- ✅ is_live column added to root_sovereign_devices
-- ✅ genesis_hash column added to sentinel_telemetry
-- ✅ is_live column added to sentinel_telemetry
-- ✅ All indexes created successfully

-- After running Genesis Hash Seal ceremony in UI:
-- ✅ genesis_hash will be populated with 0x... hash (64 chars)
-- ✅ UI will show "SEALED" with gold/amber glow
-- ✅ First 12 characters displayed in badge


/**
 * PFF Database Schema Update — Genesis Hash Seal
 * Adds genesis_hash column to sentinel_telemetry for eternal verification
 * Date: 2026-02-02
 * Architect: Isreal Okoro (mrfundzman)
 */

-- ============================================================================
-- Add genesis_hash column to sentinel_telemetry
-- ============================================================================

ALTER TABLE sentinel_telemetry 
ADD COLUMN IF NOT EXISTS genesis_hash TEXT;

-- ============================================================================
-- Create index for genesis_hash queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sentinel_telemetry_genesis_hash 
ON sentinel_telemetry(genesis_hash);

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Run this to verify the column was added:
SELECT id, genesis_hash, last_updated 
FROM sentinel_telemetry 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- Expected Result After Genesis Hash Seal Ceremony
-- ============================================================================

-- After running the Genesis Hash Seal ceremony in the UI, you should see:
-- genesis_hash: 0x7f3a... (64 character hex string with 0x prefix)
-- last_updated: 2026-02-02T...


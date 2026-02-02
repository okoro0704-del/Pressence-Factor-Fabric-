/**
 * PFF Database Schema Update — Security Override & Presence Injection
 * Adds is_live column to sentinel_telemetry for session presence tracking
 * Date: 2026-02-02
 * Architect: Isreal Okoro (mrfundzman)
 */

-- ============================================================================
-- Add is_live column to sentinel_telemetry
-- ============================================================================

ALTER TABLE sentinel_telemetry 
ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================================
-- Create index for is_live queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sentinel_telemetry_is_live 
ON sentinel_telemetry(is_live);

-- ============================================================================
-- Update existing record to set is_live = TRUE
-- ============================================================================

UPDATE sentinel_telemetry
SET is_live = TRUE
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Run this to verify the column was added:
-- SELECT id, is_live, last_updated FROM sentinel_telemetry LIMIT 5;


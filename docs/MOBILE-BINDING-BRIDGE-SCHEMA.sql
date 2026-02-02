/**
 * PFF Supabase Setup — Mobile Binding Bridge
 * Run this in Supabase SQL Editor to create mobile auth tokens table
 * Architect: Isreal Okoro (mrfundzman)
 * Date: 2026-02-02
 */

-- ============================================================================
-- SENTINEL AUTH TOKENS (Mobile Binding Bridge)
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

CREATE INDEX IF NOT EXISTS idx_auth_tokens_pin ON sentinel_auth_tokens(token_pin);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expiry ON sentinel_auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_used ON sentinel_auth_tokens(is_used);

-- ============================================================================
-- UPDATE ROOT SOVEREIGN DEVICES TABLE (Add is_live column)
-- ============================================================================

ALTER TABLE root_sovereign_devices 
ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_root_devices_live ON root_sovereign_devices(is_live);

-- ============================================================================
-- SAMPLE DATA (For Testing)
-- ============================================================================

-- Insert a test token (expires in 15 minutes)
INSERT INTO sentinel_auth_tokens (
  token_pin,
  device_uuid,
  device_type,
  architect_alias,
  expires_at
) VALUES (
  '123456',
  'HP-LAPTOP-ROOT-SOVEREIGN-001',
  'LAPTOP',
  'mrfundzman',
  NOW() + INTERVAL '15 minutes'
) ON CONFLICT (token_pin) DO NOTHING;

COMMENT ON TABLE sentinel_auth_tokens IS 'Mobile binding bridge - short-lived PINs for device pairing';
COMMENT ON COLUMN sentinel_auth_tokens.token_pin IS '6-digit PIN for mobile device binding';
COMMENT ON COLUMN sentinel_auth_tokens.expires_at IS 'Token expiry timestamp (15 minutes from creation)';
COMMENT ON COLUMN sentinel_auth_tokens.is_used IS 'Whether token has been consumed by mobile device';


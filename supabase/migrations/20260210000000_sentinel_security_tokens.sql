-- ============================================================================
-- SENTINEL SECURITY TOKENS
-- Generated on activation (Sentinel Vault); user enters token in Main PFF App to unlock funds.
-- Cross-app handshake: Supabase as shared source of truth.
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentinel_security_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sentinel_security_tokens_owner_id ON sentinel_security_tokens(owner_id);
CREATE INDEX IF NOT EXISTS idx_sentinel_security_tokens_token ON sentinel_security_tokens(token);
CREATE INDEX IF NOT EXISTS idx_sentinel_security_tokens_expires_at ON sentinel_security_tokens(expires_at);

COMMENT ON TABLE sentinel_security_tokens IS 'Sentinel Security Token: user copies from Sentinel Vault into Main PFF App to unlock funds.';

-- Sovereign Ledger: add transaction_label for swap history (Personal Asset Conversion vs National Distribution).
-- Architect: PFF Sovereign Swap refinement.

-- Ensure sovereign_ledger exists with required columns (idempotent for projects that create it elsewhere).
CREATE TABLE IF NOT EXISTS sovereign_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  from_vault TEXT NOT NULL,
  to_vault TEXT NOT NULL,
  vida_cap_deducted NUMERIC(20, 8) NOT NULL,
  dllr_credited NUMERIC(20, 8) NOT NULL,
  exchange_rate NUMERIC(20, 8) NOT NULL,
  wallet_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add transaction_label if missing (for existing sovereign_ledger tables).
ALTER TABLE sovereign_ledger
ADD COLUMN IF NOT EXISTS transaction_label TEXT;

COMMENT ON COLUMN sovereign_ledger.transaction_label IS 'Display label in history: e.g. Personal Asset Conversion, National Distribution.';
COMMENT ON COLUMN sovereign_ledger.from_vault IS 'Source: PERSONAL_VAULT for personal swaps; NATIONAL_BLOCK only for INITIAL_MINT/NATIONAL_CONVERSION.';
COMMENT ON COLUMN sovereign_ledger.to_vault IS 'Destination: LIQUIDITY_POOL for personal swaps (VIDA in, DLLR out).';

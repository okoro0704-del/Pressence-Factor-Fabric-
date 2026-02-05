-- Sovereign Ledger: ensure table exists (if 20260244 not run) and add phone_number for Recent Activity.
-- Safe to run even when sovereign_ledger does not exist yet.

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

ALTER TABLE sovereign_ledger ADD COLUMN IF NOT EXISTS transaction_label TEXT;
ALTER TABLE sovereign_ledger ADD COLUMN IF NOT EXISTS phone_number TEXT;

COMMENT ON COLUMN sovereign_ledger.transaction_label IS 'Display label in history: e.g. Personal Asset Conversion, National Distribution.';
COMMENT ON COLUMN sovereign_ledger.phone_number IS 'Identity anchor for filtering ledger by user in Recent Activity.';

CREATE INDEX IF NOT EXISTS idx_sovereign_ledger_phone_number ON sovereign_ledger(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sovereign_ledger_timestamp_desc ON sovereign_ledger(timestamp DESC);

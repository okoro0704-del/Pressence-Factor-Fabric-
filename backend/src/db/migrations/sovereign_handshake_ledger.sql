-- Sovereign Handshake — Three-Way Mint Ledger
-- All three legs (government_treasury_vault, user_wallet, sentinel_business_ledger) recorded
-- with a single batch_id so the 50% government split is never bypassed.

-- Ledger: one row per destination per mint; same batch_id for all three
CREATE TABLE IF NOT EXISTS sovereign_mint_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id              UUID NOT NULL,
  citizen_id            UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  pff_id                TEXT NOT NULL,
  destination           TEXT NOT NULL CHECK (destination IN ('government_treasury_vault', 'user_wallet', 'sentinel_business_ledger')),
  amount_vida           NUMERIC(20, 8) NOT NULL,
  transaction_hash      TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sovereign_mint_batch ON sovereign_mint_ledger(batch_id);
CREATE INDEX IF NOT EXISTS idx_sovereign_mint_citizen ON sovereign_mint_ledger(citizen_id);
CREATE INDEX IF NOT EXISTS idx_sovereign_mint_destination ON sovereign_mint_ledger(destination);
CREATE INDEX IF NOT EXISTS idx_sovereign_mint_created ON sovereign_mint_ledger(created_at DESC);

COMMENT ON TABLE sovereign_mint_ledger IS 'Sovereign Handshake: all three mint legs per batch (government 5, user 4.98, sentinel 0.02 VIDA).';
COMMENT ON COLUMN sovereign_mint_ledger.batch_id IS 'Single batch_id ties all three transactions; ensures 50%% government split is atomic.';

-- vida_cap_allocations: add batch_id and sentinel_share for Sovereign Handshake
ALTER TABLE vida_cap_allocations ADD COLUMN IF NOT EXISTS batch_id UUID;
ALTER TABLE vida_cap_allocations ADD COLUMN IF NOT EXISTS sentinel_share NUMERIC(20, 8) DEFAULT 0;

-- Drop UNIQUE(citizen_id) if we want multiple allocations per citizen (e.g. re-vitalization); for now keep one allocation per citizen.
-- No change to UNIQUE(citizen_id) — first vitalization only.

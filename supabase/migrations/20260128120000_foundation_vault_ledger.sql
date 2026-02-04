-- Foundation Seigniorage Protocol: PFF_FOUNDATION_VAULT ledger.
-- Each new identity verified: 1 VIDA recorded here (tagged with citizen_id for audit).

CREATE TABLE IF NOT EXISTS foundation_vault_ledger (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id TEXT NOT NULL,
  vida_amount NUMERIC(20, 8) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foundation_vault_ledger_citizen ON foundation_vault_ledger(citizen_id);
CREATE INDEX IF NOT EXISTS idx_foundation_vault_ledger_created ON foundation_vault_ledger(created_at);

COMMENT ON TABLE foundation_vault_ledger IS 'PFF Foundation Vault: 1 VIDA per verified identity (audit). Funds locked for Infrastructure & Future Mesh Projects.';

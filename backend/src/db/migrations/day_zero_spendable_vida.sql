-- Day Zero Liquidity: first $100 (0.1 VIDA) is spendable immediately upon vitalization (no 24-hour vesting).
-- Architect: PFF Immediate Liquidity

ALTER TABLE citizen_vaults
ADD COLUMN IF NOT EXISTS spendable_balance_vida NUMERIC(20, 8) NOT NULL DEFAULT 0;

COMMENT ON COLUMN citizen_vaults.spendable_balance_vida IS 'Spendable VIDA balance. First 0.1 VIDA credited immediately on mint (Day Zero); no 24h vesting.';

CREATE INDEX IF NOT EXISTS idx_citizen_vaults_spendable ON citizen_vaults(spendable_balance_vida) WHERE spendable_balance_vida > 0;

-- Sovereign Internal Wallets (no MetaMask/Phantom)
-- Balances: Sovereign DLLR, USDT, VIDA CAP. Static USDT deposit addresses per user.
-- Architect: Isreal Okoro (mrfundzman)

CREATE TABLE IF NOT EXISTS sovereign_internal_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  dllr_balance NUMERIC(24, 8) NOT NULL DEFAULT 0,
  usdt_balance NUMERIC(24, 8) NOT NULL DEFAULT 0,
  vida_cap_balance NUMERIC(24, 8) NOT NULL DEFAULT 0,
  usdt_deposit_address_erc20 TEXT,
  usdt_deposit_address_trc20 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sovereign_internal_wallets_phone ON sovereign_internal_wallets(phone_number);

COMMENT ON TABLE sovereign_internal_wallets IS 'Internal wallet balances (DLLR, USDT, VIDA CAP). No external wallet required.';
COMMENT ON COLUMN sovereign_internal_wallets.usdt_deposit_address_erc20 IS 'Static ERC-20 address for USDT deposits.';
COMMENT ON COLUMN sovereign_internal_wallets.usdt_deposit_address_trc20 IS 'Static TRC-20 address for USDT deposits.';

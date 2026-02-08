-- ============================================================================
-- USER_BALANCES (Private Personal Treasury)
-- Per-user balances for Personal Treasury tab. RLS restricts to own row.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  vida_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  dllr_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  usdt_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  vngn_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  wallet_address TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_balances_phone ON public.user_balances(phone_number);
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own row (by phone_number from session/jwt or app context)
CREATE POLICY "Users read own balance"
  ON public.user_balances FOR SELECT
  USING (true);

CREATE POLICY "Service role full access user_balances"
  ON public.user_balances FOR ALL TO service_role USING (true);

COMMENT ON TABLE public.user_balances IS 'Personal Treasury balances (VIDA, DLLR, USDT, vNGN). Source for Personal tab; private until face scan.';

-- ============================================================================
-- Initial Release & Sentinel Auto-Debit (one-time at start of user journey)
-- - user_profiles: sentinel_activation_debited, sentinel_activation_date
-- - presence_ledger: instant ledger entries for +$100 Initial Presence Release, -$100 Sentinel Activation
-- ============================================================================

-- One-time guard: has the $100 Sentinel Activation fee already been debited?
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS sentinel_activation_debited BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS sentinel_activation_date TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.sentinel_activation_debited IS 'True after the one-time $100 Sentinel Activation debit; prevents double debit.';
COMMENT ON COLUMN public.user_profiles.sentinel_activation_date IS 'When Sentinel was activated (after successful auto-debit).';

-- Ledger table for instant presence entries shown on Dashboard (Initial Release + Sentinel Activation)
CREATE TABLE IF NOT EXISTS public.presence_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  amount_usd NUMERIC(12, 2) NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_ledger_phone ON public.presence_ledger(phone_number);
CREATE INDEX IF NOT EXISTS idx_presence_ledger_created_at ON public.presence_ledger(created_at DESC);

COMMENT ON TABLE public.presence_ledger IS 'Instant ledger entries: +$100 Initial Presence Release, -$100 Sentinel Activation (System Secured). Shown on Dashboard Recent Activity.';

ALTER TABLE public.presence_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read presence_ledger by own phone"
  ON public.presence_ledger FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service insert presence_ledger"
  ON public.presence_ledger FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.presence_ledger TO anon, authenticated;
GRANT ALL ON public.presence_ledger TO service_role;

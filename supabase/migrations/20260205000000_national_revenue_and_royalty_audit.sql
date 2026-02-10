-- ============================================================================
-- NATIONAL REVENUE LEDGER
-- Maps royalty collection per National Block: Gross Revenue, 5% Foundation Deduction, Net Distributable.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.national_revenue_ledger (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id          TEXT NOT NULL,
  gross_revenue     NUMERIC(20, 8) NOT NULL,
  foundation_deduction_5 NUMERIC(20, 8) NOT NULL,
  net_distributable NUMERIC(20, 8) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'VIDA',
  reference         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_national_revenue_ledger_block ON public.national_revenue_ledger(block_id);
CREATE INDEX IF NOT EXISTS idx_national_revenue_ledger_created ON public.national_revenue_ledger(created_at);

COMMENT ON TABLE public.national_revenue_ledger IS 'National Block revenue: Gross, 5% Foundation Deduction, Net Distributable. Transparency view.';

-- ============================================================================
-- FOUNDATION ROYALTY AUDIT (secure, immutable log)
-- Proves 5% was taken BEFORE 10 VIDA/1 VIDA minting or any other splits.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.foundation_royalty_audit (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id                TEXT NOT NULL,
  gross_revenue           NUMERIC(20, 8) NOT NULL,
  foundation_deduction_5  NUMERIC(20, 8) NOT NULL,
  net_distributable       NUMERIC(20, 8) NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'VIDA',
  reference               TEXT,
  step                    TEXT NOT NULL DEFAULT 'royalty_5_deducted_before_splits',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable: no UPDATE/DELETE (append-only). Enforce via RLS or application.
CREATE INDEX IF NOT EXISTS idx_foundation_royalty_audit_block ON public.foundation_royalty_audit(block_id);
CREATE INDEX IF NOT EXISTS idx_foundation_royalty_audit_created ON public.foundation_royalty_audit(created_at);

COMMENT ON TABLE public.foundation_royalty_audit IS 'Audit trail: proves 5% Corporate Royalty was deducted before any mint or splits. Append-only.';

-- ============================================================================
-- EXTEND FOUNDATION VAULT LEDGER (source_type for royalty vs seigniorage)
-- 5% royalty and 2% conversion levy are routed to PFF_FOUNDATION_VAULT.
-- ============================================================================

ALTER TABLE public.foundation_vault_ledger
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'seigniorage',
  ADD COLUMN IF NOT EXISTS reference   TEXT;

COMMENT ON COLUMN public.foundation_vault_ledger.source_type IS 'seigniorage | corporate_royalty_5 | conversion_levy_2';

-- RLS / policies (read for anon/authenticated, insert via service or authenticated)
ALTER TABLE public.national_revenue_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_royalty_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read national_revenue_ledger" ON public.national_revenue_ledger;
CREATE POLICY "Allow public read national_revenue_ledger"
  ON public.national_revenue_ledger FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read foundation_royalty_audit" ON public.foundation_royalty_audit;
CREATE POLICY "Allow public read foundation_royalty_audit"
  ON public.foundation_royalty_audit FOR SELECT TO public USING (true);

-- Insert restricted to authenticated/service (application uses service or backend)
DROP POLICY IF EXISTS "Allow authenticated insert national_revenue_ledger" ON public.national_revenue_ledger;
CREATE POLICY "Allow authenticated insert national_revenue_ledger"
  ON public.national_revenue_ledger FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert foundation_royalty_audit" ON public.foundation_royalty_audit;
CREATE POLICY "Allow authenticated insert foundation_royalty_audit"
  ON public.foundation_royalty_audit FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT ON public.national_revenue_ledger TO anon, authenticated;
GRANT INSERT ON public.national_revenue_ledger TO authenticated;
GRANT SELECT ON public.foundation_royalty_audit TO anon, authenticated;
GRANT INSERT ON public.foundation_royalty_audit TO authenticated;
GRANT ALL ON public.national_revenue_ledger TO service_role;
GRANT ALL ON public.foundation_royalty_audit TO service_role;

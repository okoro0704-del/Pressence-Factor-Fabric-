-- ============================================================================
-- GLOBAL LEDGER_STATS (Public National Ledger)
-- Single row: Total Reserve, Total Vitalized, Minted VIDA for Commander's Dashboard.
-- National Treasury tab and Global Pulse Bar read from here.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ledger_stats (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  total_reserve_vida NUMERIC(20, 2) NOT NULL DEFAULT 5.0,
  total_vitalized_count INTEGER NOT NULL DEFAULT 1,
  total_minted_vida NUMERIC(20, 2) NOT NULL DEFAULT 5.0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_ledger_stats CHECK (id = '00000000-0000-0000-0000-000000000001')
);

CREATE INDEX IF NOT EXISTS idx_ledger_stats_id ON public.ledger_stats(id);
ALTER TABLE public.ledger_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ledger_stats"
  ON public.ledger_stats FOR SELECT TO public USING (true);

INSERT INTO public.ledger_stats (id, total_reserve_vida, total_vitalized_count, total_minted_vida)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  5.0,
  1,
  5.0
) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.ledger_stats IS 'Global national ledger: Total Reserve (VIDA), Total Vitalized (citizens), Minted VIDA. Public view for National Treasury and Pulse Bar.';

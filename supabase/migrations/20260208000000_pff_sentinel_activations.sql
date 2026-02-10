-- ============================================================================
-- PFF SENTINEL ACTIVATIONS
-- Links Identity Anchor (phone) to a unique SentinelID after Device Handshake.
-- Used for Mandatory Sentinel Activation Protocol (fund access).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pff_sentinel_activations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_anchor_phone TEXT NOT NULL,
  sentinel_id           TEXT NOT NULL UNIQUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pff_sentinel_activations_phone ON public.pff_sentinel_activations(identity_anchor_phone);
CREATE INDEX IF NOT EXISTS idx_pff_sentinel_activations_sentinel_id ON public.pff_sentinel_activations(sentinel_id);

COMMENT ON TABLE public.pff_sentinel_activations IS 'Mandatory Sentinel Activation: SentinelID linked to Identity Anchor for fund access.';

ALTER TABLE public.pff_sentinel_activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read pff_sentinel_activations" ON public.pff_sentinel_activations;
CREATE POLICY "Allow public read pff_sentinel_activations"
  ON public.pff_sentinel_activations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert pff_sentinel_activations" ON public.pff_sentinel_activations;
CREATE POLICY "Allow authenticated insert pff_sentinel_activations"
  ON public.pff_sentinel_activations FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.pff_sentinel_activations TO anon, authenticated;
GRANT ALL ON public.pff_sentinel_activations TO service_role;

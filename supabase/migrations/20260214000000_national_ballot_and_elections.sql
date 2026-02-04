-- ============================================================================
-- PFF BALLOT ENGINE — national_ballot_box + elections (National Referendum)
-- One-person-one-vote per election_id; vote choice hashed (anonymous); IdentityAnchor + device linked.
-- ============================================================================

-- Elections / National Referendums (state launches via government/elections)
CREATE TABLE IF NOT EXISTS public.pff_elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pff_elections_status ON public.pff_elections(status);
CREATE INDEX IF NOT EXISTS idx_pff_elections_created_at ON public.pff_elections(created_at DESC);

COMMENT ON TABLE public.pff_elections IS 'National Referendum / Election; state launches via Government Elections Dashboard.';

-- Ballot box: one row per vote; choice hashed (anonymous); one vote per (election_id, identity_anchor)
CREATE TABLE IF NOT EXISTS public.national_ballot_box (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.pff_elections(id) ON DELETE CASCADE,
  identity_anchor TEXT NOT NULL,
  vote_choice_hash TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  hardware_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(election_id, identity_anchor)
);

CREATE INDEX IF NOT EXISTS idx_national_ballot_box_election ON public.national_ballot_box(election_id);
CREATE INDEX IF NOT EXISTS idx_national_ballot_box_identity ON public.national_ballot_box(identity_anchor);
CREATE INDEX IF NOT EXISTS idx_national_ballot_box_created ON public.national_ballot_box(created_at DESC);

COMMENT ON TABLE public.national_ballot_box IS 'PFF Ballot Engine: one vote per election per IdentityAnchor; choice stored as hash (anonymous); device/hardware for anti-ghost.';

ALTER TABLE public.pff_elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.national_ballot_box ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read pff_elections"
  ON public.pff_elections FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert/update pff_elections"
  ON public.pff_elections FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read pff_elections"
  ON public.pff_elections FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read national_ballot_box"
  ON public.national_ballot_box FOR SELECT TO public USING (true);

CREATE POLICY "Allow insert national_ballot_box"
  ON public.national_ballot_box FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT SELECT ON public.pff_elections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pff_elections TO authenticated;
GRANT SELECT, INSERT ON public.national_ballot_box TO anon, authenticated;
GRANT ALL ON public.pff_elections, public.national_ballot_box TO service_role;

-- ============================================================================
-- LEGAL APPROVALS — Sovereign Constitution signature (constitution_version, signature_timestamp)
-- 10 VIDA minting only begins AFTER the Constitution is signed and recorded here.
-- If the Constitution is updated, the user must re-sign on next login.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.legal_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_anchor TEXT NOT NULL,
  constitution_version TEXT NOT NULL,
  signature_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identity_anchor, constitution_version)
);

CREATE INDEX IF NOT EXISTS idx_legal_approvals_identity ON public.legal_approvals(identity_anchor);
CREATE INDEX IF NOT EXISTS idx_legal_approvals_version ON public.legal_approvals(constitution_version);
CREATE INDEX IF NOT EXISTS idx_legal_approvals_signature_timestamp ON public.legal_approvals(signature_timestamp DESC);

COMMENT ON TABLE public.legal_approvals IS 'Sovereign Constitution acceptance: one row per identity per constitution version. 10 VIDA mint only after signature.';

ALTER TABLE public.legal_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read legal_approvals"
  ON public.legal_approvals FOR SELECT TO public USING (true);

CREATE POLICY "Allow insert legal_approvals"
  ON public.legal_approvals FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.legal_approvals TO anon, authenticated;
GRANT ALL ON public.legal_approvals TO service_role;

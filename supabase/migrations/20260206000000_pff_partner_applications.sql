-- ============================================================================
-- PFF PARTNER APPLICATIONS
-- Companies applying to join the PFF Network. Status: PENDING_REVIEW | APPROVED | REJECTED.
-- Approving generates PFF_API_KEY for the partner.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pff_partner_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        TEXT NOT NULL,
  industry            TEXT NOT NULL,
  integration_intent  TEXT NOT NULL,
  consent_royalty     BOOLEAN NOT NULL DEFAULT false,
  consent_privacy     BOOLEAN NOT NULL DEFAULT false,
  status              TEXT NOT NULL DEFAULT 'PENDING_REVIEW'
    CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  pff_api_key         TEXT,
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         TEXT,
  rejection_reason    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pff_partner_applications_status ON public.pff_partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_pff_partner_applications_created ON public.pff_partner_applications(created_at DESC);

COMMENT ON TABLE public.pff_partner_applications IS 'Partner Application Portal: companies applying to join the PFF Network. Approving generates PFF_API_KEY.';
COMMENT ON COLUMN public.pff_partner_applications.pff_api_key IS 'Generated when status is set to APPROVED.';

ALTER TABLE public.pff_partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert pff_partner_applications"
  ON public.pff_partner_applications FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow public read own or all for foundation"
  ON public.pff_partner_applications FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated update pff_partner_applications"
  ON public.pff_partner_applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON public.pff_partner_applications TO anon, authenticated;
GRANT UPDATE ON public.pff_partner_applications TO authenticated;
GRANT ALL ON public.pff_partner_applications TO service_role;

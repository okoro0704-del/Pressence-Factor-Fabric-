-- ============================================================================
-- ENTERPRISE VERIFICATION GATEWAY (EVG)
-- OAuth-style "Connect with Sovereign" for third-party humanity verification.
-- ZKP: Partners receive only YES/NO (Verified Human). No fingerprint or face hash.
-- Revenue Share: Data Integrity Fee split between Sentinel Business and User.
-- ============================================================================

-- Authorized partners (Transparency Log: who can verify humans)
CREATE TABLE IF NOT EXISTS public.evg_authorized_partners (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           TEXT NOT NULL UNIQUE,
  client_secret_hash  TEXT NOT NULL,
  name                TEXT NOT NULL,
  redirect_uris        JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_integrity_fee_cents INTEGER NOT NULL DEFAULT 0,
  revenue_share_user_pct   NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (revenue_share_user_pct >= 0 AND revenue_share_user_pct <= 100),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evg_authorized_partners_client_id ON public.evg_authorized_partners(client_id);
CREATE INDEX IF NOT EXISTS idx_evg_authorized_partners_status ON public.evg_authorized_partners(status);

COMMENT ON TABLE public.evg_authorized_partners IS 'EVG: Partners allowed to verify humanity (Transparency Log).';
COMMENT ON COLUMN public.evg_authorized_partners.redirect_uris IS 'Allowed redirect_uri values (JSON array of strings).';
COMMENT ON COLUMN public.evg_authorized_partners.data_integrity_fee_cents IS 'Fee in cents charged per verification; split with user per revenue_share_user_pct.';

-- One-time authorization codes and access tokens (short-lived)
CREATE TABLE IF NOT EXISTS public.evg_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_key       TEXT NOT NULL UNIQUE,
  grant_type      TEXT NOT NULL CHECK (grant_type IN ('authorization_code', 'access_token')),
  partner_client_id TEXT NOT NULL,
  phone_number    TEXT NOT NULL,
  scope           TEXT NOT NULL DEFAULT 'humanity',
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evg_grants_grant_key ON public.evg_grants(grant_key);
CREATE INDEX IF NOT EXISTS idx_evg_grants_expires_at ON public.evg_grants(expires_at);

COMMENT ON TABLE public.evg_grants IS 'EVG: Authorization codes and access tokens. Codes single-use; tokens used for /verify.';

-- Revenue share ledger (Data Integrity Fee split)
CREATE TABLE IF NOT EXISTS public.evg_verification_ledger (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id          UUID NOT NULL REFERENCES public.evg_authorized_partners(id),
  user_phone_hash     TEXT,
  fee_cents           INTEGER NOT NULL,
  sentinel_share_cents INTEGER NOT NULL,
  user_share_cents    INTEGER NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evg_verification_ledger_partner ON public.evg_verification_ledger(partner_id);
CREATE INDEX IF NOT EXISTS idx_evg_verification_ledger_created ON public.evg_verification_ledger(created_at DESC);

COMMENT ON TABLE public.evg_verification_ledger IS 'EVG: Data Integrity Fee per verification; split Sentinel vs User. user_phone_hash for anonymity.';

ALTER TABLE public.evg_authorized_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evg_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evg_verification_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service read evg_authorized_partners" ON public.evg_authorized_partners FOR SELECT USING (true);
CREATE POLICY "Allow service read evg_grants" ON public.evg_grants FOR SELECT USING (true);
CREATE POLICY "Allow service insert evg_grants" ON public.evg_grants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update evg_grants" ON public.evg_grants FOR UPDATE USING (true);
CREATE POLICY "Allow service read evg_verification_ledger" ON public.evg_verification_ledger FOR SELECT USING (true);
CREATE POLICY "Allow service insert evg_verification_ledger" ON public.evg_verification_ledger FOR INSERT WITH CHECK (true);

GRANT SELECT ON public.evg_authorized_partners TO anon, authenticated;
GRANT ALL ON public.evg_authorized_partners TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.evg_grants TO anon, authenticated;
GRANT ALL ON public.evg_grants TO service_role;
GRANT SELECT, INSERT ON public.evg_verification_ledger TO authenticated;
GRANT ALL ON public.evg_verification_ledger TO service_role;

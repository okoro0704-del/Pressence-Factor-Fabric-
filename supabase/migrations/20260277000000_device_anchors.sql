-- Device Anchors: map WebAuthn credential_id (hashed) to citizen_hash for sovereign link.
-- Used when user registers a Passkey: credentialId is hashed and stored with citizen_hash/phone.
-- On login, assertion credential.id is hashed and looked up to resolve identity.

CREATE TABLE IF NOT EXISTS public.device_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  citizen_hash TEXT NOT NULL,
  credential_id_hash TEXT NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(credential_id_hash)
);

CREATE INDEX IF NOT EXISTS idx_device_anchors_phone ON public.device_anchors(phone_number);
CREATE INDEX IF NOT EXISTS idx_device_anchors_citizen ON public.device_anchors(citizen_hash);
CREATE INDEX IF NOT EXISTS idx_device_anchors_cred_hash ON public.device_anchors(credential_id_hash);

COMMENT ON TABLE public.device_anchors IS 'Sovereign link: WebAuthn credential_id (SHA-256) mapped to citizen_hash and phone. Used for native device auth login.';

ALTER TABLE public.device_anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read device_anchors for anon and authenticated"
  ON public.device_anchors FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert device_anchors for anon and authenticated"
  ON public.device_anchors FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update device_anchors for anon and authenticated"
  ON public.device_anchors FOR UPDATE TO anon, authenticated USING (true);

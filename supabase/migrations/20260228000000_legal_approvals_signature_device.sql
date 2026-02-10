-- Add signature_device_id to legal_approvals (captured only after successful biometric).
ALTER TABLE public.legal_approvals
  ADD COLUMN IF NOT EXISTS signature_device_id TEXT;

COMMENT ON COLUMN public.legal_approvals.signature_device_id IS 'Device fingerprint or external scanner serial at time of constitution signature.';

ALTER TABLE public.legal_approvals ADD COLUMN IF NOT EXISTS external_fingerprint_hash TEXT;
COMMENT ON COLUMN public.legal_approvals.external_fingerprint_hash IS 'Legal Digital Thumbprint: hash from external USB/Bluetooth scanner (industrial constitution sign).';

-- Allow upsert (INSERT or UPDATE) for constitution re-sign.
DROP POLICY IF EXISTS "Allow update legal_approvals" ON public.legal_approvals;
CREATE POLICY "Allow update legal_approvals"
  ON public.legal_approvals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

GRANT UPDATE ON public.legal_approvals TO anon, authenticated;

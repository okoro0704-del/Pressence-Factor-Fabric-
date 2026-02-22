-- Vitalization Log: Audit trail for all Sovereign Pulse events
-- Tracks VIDA distribution and vitalization status changes

CREATE TABLE IF NOT EXISTS public.vitalization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  sovereign_id TEXT NOT NULL,
  face_hash TEXT,
  tx_hash TEXT,
  citizen_vida NUMERIC(18, 2) NOT NULL DEFAULT 5.00,
  treasury_vida NUMERIC(18, 2) NOT NULL DEFAULT 5.00,
  foundation_vida NUMERIC(18, 2) NOT NULL DEFAULT 1.00,
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE public.vitalization_log IS 'Audit trail for all Sovereign Pulse vitalization events';

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_vitalization_log_phone_number
  ON public.vitalization_log(phone_number);

CREATE INDEX IF NOT EXISTS idx_vitalization_log_sovereign_id
  ON public.vitalization_log(sovereign_id);

CREATE INDEX IF NOT EXISTS idx_vitalization_log_timestamp
  ON public.vitalization_log(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vitalization_log_status
  ON public.vitalization_log(status)
  WHERE status != 'SUCCESS';

-- Enable Row Level Security
ALTER TABLE public.vitalization_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own vitalization logs
CREATE POLICY vitalization_log_select_own
  ON public.vitalization_log
  FOR SELECT
  USING (
    phone_number = current_setting('request.jwt.claims', true)::json->>'phone_number'
  );

-- Policy: Service role can insert vitalization logs
CREATE POLICY vitalization_log_insert_service
  ON public.vitalization_log
  FOR INSERT
  WITH CHECK (true);


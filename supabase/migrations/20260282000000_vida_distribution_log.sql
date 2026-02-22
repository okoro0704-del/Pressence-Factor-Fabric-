-- VIDA Distribution Log: Audit trail for all VIDA distributions during vitalization
-- Tracks the triple-split: 5 to Citizen, 5 to Treasury, 1 to Foundation

CREATE TABLE IF NOT EXISTS public.vida_distribution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  sovereign_id TEXT NOT NULL,
  citizen_vida NUMERIC(18, 2) NOT NULL DEFAULT 5.00,
  treasury_vida NUMERIC(18, 2) NOT NULL DEFAULT 5.00,
  foundation_vida NUMERIC(18, 2) NOT NULL DEFAULT 1.00,
  total_vida NUMERIC(18, 2) NOT NULL DEFAULT 11.00,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE public.vida_distribution_log IS 'Audit trail for VIDA distributions during vitalization (5+5+1 split)';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vida_distribution_log_phone_number
  ON public.vida_distribution_log(phone_number);

CREATE INDEX IF NOT EXISTS idx_vida_distribution_log_sovereign_id
  ON public.vida_distribution_log(sovereign_id);

CREATE INDEX IF NOT EXISTS idx_vida_distribution_log_timestamp
  ON public.vida_distribution_log(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vida_distribution_log_status
  ON public.vida_distribution_log(status)
  WHERE status != 'SUCCESS';

-- Enable Row Level Security
ALTER TABLE public.vida_distribution_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own distribution logs
CREATE POLICY vida_distribution_log_select_own
  ON public.vida_distribution_log
  FOR SELECT
  USING (
    phone_number = current_setting('request.jwt.claims', true)::json->>'phone_number'
  );

-- Policy: Service role can insert distribution logs
CREATE POLICY vida_distribution_log_insert_service
  ON public.vida_distribution_log
  FOR INSERT
  WITH CHECK (true);


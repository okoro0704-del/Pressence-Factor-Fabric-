-- Relayer Gas Alerts: when the Sovryn Minting Relayer has low RBTC, the Edge Function inserts here so Admin can monitor.
-- Optional: also set ADMIN_ALERT_WEBHOOK_URL to POST to Slack/email when gas is low.

CREATE TABLE IF NOT EXISTS public.relayer_gas_alerts (
  id BIGSERIAL PRIMARY KEY,
  relayer_address TEXT NOT NULL,
  balance_rbtc TEXT NOT NULL,
  threshold_rbtc TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relayer_gas_alerts_created_at ON public.relayer_gas_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_relayer_gas_alerts_relayer ON public.relayer_gas_alerts(relayer_address);

COMMENT ON TABLE public.relayer_gas_alerts IS 'Alerts when gasless-mint relayer wallet has insufficient RBTC; Admin can query and top up.';

-- Only service_role (Edge Function) inserts; Admin reads via dashboard or API.
ALTER TABLE public.relayer_gas_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can insert relayer_gas_alerts" ON public.relayer_gas_alerts;
CREATE POLICY "Service role can insert relayer_gas_alerts"
  ON public.relayer_gas_alerts FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read relayer_gas_alerts" ON public.relayer_gas_alerts;
CREATE POLICY "Authenticated can read relayer_gas_alerts"
  ON public.relayer_gas_alerts FOR SELECT TO authenticated USING (true);

GRANT INSERT ON public.relayer_gas_alerts TO service_role;
GRANT SELECT ON public.relayer_gas_alerts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.relayer_gas_alerts_id_seq TO service_role;

-- Device Registry — unique device identity per user (Oppo, iPhone, Redmi from User-Agent).
-- Architect: Isreal Okoro (mrfundzman)

CREATE TABLE IF NOT EXISTS device_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  device_unique_id TEXT NOT NULL,
  device_vendor TEXT NOT NULL CHECK (device_vendor IN ('Oppo', 'iPhone', 'Redmi', 'Unknown')),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phone_number, device_unique_id)
);

CREATE INDEX IF NOT EXISTS idx_device_registry_phone ON device_registry(phone_number);
CREATE INDEX IF NOT EXISTS idx_device_registry_device_unique_id ON device_registry(device_unique_id);

ALTER TABLE device_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY device_registry_select ON device_registry FOR SELECT
  USING (phone_number = current_setting('app.current_user_phone', true));
CREATE POLICY device_registry_insert ON device_registry FOR INSERT
  WITH CHECK (phone_number = current_setting('app.current_user_phone', true));
CREATE POLICY device_registry_update ON device_registry FOR UPDATE
  USING (phone_number = current_setting('app.current_user_phone', true));

CREATE OR REPLACE FUNCTION update_device_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_registry_updated_at
  BEFORE UPDATE ON device_registry
  FOR EACH ROW EXECUTE FUNCTION update_device_registry_updated_at();

COMMENT ON TABLE device_registry IS 'Per-user device identity from User-Agent (Oppo, iPhone, Redmi). No hardcoded device names.';

-- RPC for API route to upsert device_registry (SECURITY DEFINER so server can insert by phone).
CREATE OR REPLACE FUNCTION upsert_device_registry(
  p_phone_number TEXT,
  p_device_unique_id TEXT,
  p_device_vendor TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF NULLIF(TRIM(p_phone_number), '') IS NULL OR NULLIF(TRIM(p_device_unique_id), '') IS NULL OR NULLIF(TRIM(p_device_vendor), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'phone_number, device_unique_id, device_vendor required');
  END IF;
  INSERT INTO device_registry (phone_number, device_unique_id, device_vendor, user_agent, updated_at)
  VALUES (TRIM(p_phone_number), TRIM(p_device_unique_id), TRIM(p_device_vendor), NULLIF(TRIM(p_user_agent), ''), v_now)
  ON CONFLICT (phone_number, device_unique_id)
  DO UPDATE SET device_vendor = EXCLUDED.device_vendor, user_agent = EXCLUDED.user_agent, updated_at = v_now
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION upsert_device_registry(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION upsert_device_registry(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_device_registry(TEXT, TEXT, TEXT, TEXT) TO service_role;

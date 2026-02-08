-- Sovereign Device Handshake — temporary channel for phone→laptop anchor + token.
-- When phone scans laptop QR and approves, it writes citizen_hash and device_anchor_token here.
-- Laptop reads on APPROVED, applies anchor locally, then deletes row.

CREATE TABLE IF NOT EXISTS sovereign_device_handshake (
  request_id UUID PRIMARY KEY REFERENCES login_requests(id) ON DELETE CASCADE,
  citizen_hash TEXT NOT NULL,
  device_anchor_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sovereign_device_handshake_created_at ON sovereign_device_handshake(created_at);

ALTER TABLE sovereign_device_handshake ENABLE ROW LEVEL SECURITY;

CREATE POLICY sovereign_device_handshake_insert ON sovereign_device_handshake
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY sovereign_device_handshake_select ON sovereign_device_handshake
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY sovereign_device_handshake_delete ON sovereign_device_handshake
  FOR DELETE TO anon, authenticated USING (true);

COMMENT ON TABLE sovereign_device_handshake IS 'Temporary payload: citizen_hash + device_anchor_token for cross-device anchoring. Phone writes after approve; laptop reads then deletes.';

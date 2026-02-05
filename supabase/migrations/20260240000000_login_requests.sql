-- =====================================================
-- LOGIN REQUESTS — Computer enters phone → PENDING;
-- Phone approves → APPROVED; Computer (Realtime) logs into Vault.
-- =====================================================

CREATE TABLE IF NOT EXISTS login_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  requested_display_name TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DENIED')),
  device_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_login_requests_phone_number ON login_requests(phone_number);
CREATE INDEX IF NOT EXISTS idx_login_requests_status ON login_requests(status);
CREATE INDEX IF NOT EXISTS idx_login_requests_created_at ON login_requests(created_at DESC);

ALTER TABLE login_requests ENABLE ROW LEVEL SECURITY;

-- Allow insert from anon/authenticated (computer creates request with phone only)
CREATE POLICY login_requests_insert_policy ON login_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow select by phone_number so phone can see PENDING for own number
CREATE POLICY login_requests_select_policy ON login_requests
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow update so phone can set status to APPROVED/DENIED
CREATE POLICY login_requests_update_policy ON login_requests
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Realtime: send full row on UPDATE so computer sees status change
ALTER TABLE login_requests REPLICA IDENTITY FULL;

COMMENT ON TABLE login_requests IS 'Computer creates PENDING; phone approves → APPROVED; computer (Realtime) logs into Vault.';

-- Enable Realtime: In Supabase Dashboard go to Database → Replication → enable "login_requests" so the computer client receives UPDATE events when phone sets status to APPROVED.

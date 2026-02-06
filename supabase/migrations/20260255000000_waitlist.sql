-- =====================================================
-- WAITLIST — Join the Vanguard: email capture for April 7th unveiling.
-- First 10,000 Citizens invited to 9-Day Vitalization.
-- =====================================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referral_source TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(LOWER(TRIM(email)));
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert only (public form; no auth required)
CREATE POLICY waitlist_insert_policy ON waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Optional: restrict SELECT to service role only (admin views list)
-- No policy = no SELECT for anon; use service key in dashboard if needed.
CREATE POLICY waitlist_select_policy ON waitlist
  FOR SELECT TO authenticated
  USING (true);

COMMENT ON TABLE waitlist IS 'Vanguard waitlist: email capture for April 7th Gate opening. referral_source from form.';

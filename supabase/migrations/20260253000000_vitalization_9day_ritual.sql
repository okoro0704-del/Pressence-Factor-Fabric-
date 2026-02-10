-- 9-Day Vitalization Unlock Ritual
-- Starting balance: 0.1 VIDA Spendable ($100) + 4.9 VIDA Locked.
-- vitalization_streak: increments each day user completes Face + Fingerprint scan (consecutive).
-- vitalization_last_scan_date: last calendar day a scan was recorded.
-- vitalization_daily_scans: Training Sample per day (one row per phone per date).

-- 1) vitalization_streak and vitalization_last_scan_date on user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'vitalization_streak') THEN
    ALTER TABLE user_profiles ADD COLUMN vitalization_streak INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'vitalization_last_scan_date') THEN
    ALTER TABLE user_profiles ADD COLUMN vitalization_last_scan_date DATE DEFAULT NULL;
  END IF;
END $$;
COMMENT ON COLUMN public.user_profiles.vitalization_streak IS '9-Day Ritual: consecutive days of Face+Fingerprint scan. Reaches 9 to unlock 0.9 VIDA from locked to spendable.';
COMMENT ON COLUMN public.user_profiles.vitalization_last_scan_date IS 'Last calendar day (YYYY-MM-DD) a daily scan was recorded. Used for consecutive-day logic.';

-- 2) Training Sample table: one row per phone per scan date (idempotent per day)
CREATE TABLE IF NOT EXISTS vitalization_daily_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  scan_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phone_number, scan_date)
);
CREATE INDEX IF NOT EXISTS idx_vitalization_daily_scans_phone_date ON vitalization_daily_scans(phone_number, scan_date);
COMMENT ON TABLE vitalization_daily_scans IS 'Training Sample: one row per user per day when Face+Fingerprint scan completed. Lowers future biometric friction.';

ALTER TABLE vitalization_daily_scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vitalization_daily_scans_insert ON vitalization_daily_scans;
CREATE POLICY vitalization_daily_scans_insert ON vitalization_daily_scans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS vitalization_daily_scans_select ON vitalization_daily_scans;
CREATE POLICY vitalization_daily_scans_select ON vitalization_daily_scans FOR SELECT TO anon, authenticated USING (true);

-- Master Architect Initialization: 5 VIDA grant (1 spendable + 4 locked) and device anchor.
-- locked_vida: 4 VIDA locked for first registrant; device_model: device name locked to Architect profile.

-- 1) locked_vida on user_profiles for 5 VIDA grant (1 spendable + 4 locked)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'locked_vida'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN locked_vida NUMERIC(20, 8) DEFAULT 0;
  END IF;
END $$;
COMMENT ON COLUMN public.user_profiles.locked_vida IS 'Locked VIDA (e.g. 4 for Master Architect 5 VIDA grant).';

-- 2) device_model: device name/model locked to first profile (Architect device anchor)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'device_model'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN device_model TEXT DEFAULT NULL;
  END IF;
END $$;
COMMENT ON COLUMN public.user_profiles.device_model IS 'Device model/name anchored to this profile (Master Architect first device).';

-- Globalize: store country_code (ISO 3166-1 alpha-2) for VIDA token distribution tracking.
-- Safe to run even if user_profiles does not exist yet (no-op until table is created).
-- Architect: PFF Global Phone & Country Input.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS country_code TEXT;

    COMMENT ON COLUMN public.user_profiles.country_code IS 'ISO 3166-1 alpha-2 (e.g. NG, US, GB). Set from phone country picker at verification for global distribution analytics.';

    CREATE INDEX IF NOT EXISTS idx_user_profiles_country_code
    ON public.user_profiles(country_code)
    WHERE country_code IS NOT NULL;
  END IF;
END $$;

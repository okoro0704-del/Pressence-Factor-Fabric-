-- Sentinel Hub: device_limit and plan type on user_profiles for Plan Selector and Add Device enforcement.
-- device_limit is set when user selects/upgrades a plan (Standard/Family/Small Business/Enterprise).

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS device_limit INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS sentinel_plan_type TEXT;

COMMENT ON COLUMN public.user_profiles.device_limit IS 'Max devices allowed for this user; set from Sentinel Hub plan (Standard=1, Family=4, Small Business=5, Enterprise=15).';
COMMENT ON COLUMN public.user_profiles.sentinel_plan_type IS 'Last selected Sentinel Hub plan: STANDARD, FAMILY, SMALL_BUSINESS, ENTERPRISE.';

-- Allow new tier types for sentinel_licenses (Hub plans)
ALTER TABLE public.sentinel_licenses DROP CONSTRAINT IF EXISTS sentinel_licenses_tier_type_check;
ALTER TABLE public.sentinel_licenses ADD CONSTRAINT sentinel_licenses_tier_type_check
  CHECK (tier_type IN (
    'TIER_20', 'TIER_50', 'TIER_400', 'TIER_1000',
    'STANDARD', 'FAMILY', 'SMALL_BUSINESS', 'ENTERPRISE'
  ));

CREATE INDEX IF NOT EXISTS idx_user_profiles_device_limit ON public.user_profiles(device_limit);
CREATE INDEX IF NOT EXISTS idx_user_profiles_sentinel_plan_type ON public.user_profiles(sentinel_plan_type) WHERE sentinel_plan_type IS NOT NULL;

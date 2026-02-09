-- Add anchor_device_id and anchor_geolocation to user_profiles if missing (e.g. migration 20260267 not applied).
-- Run this in Supabase SQL Editor if you get "column anchor_device_id does not exist".

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS anchor_device_id TEXT,
  ADD COLUMN IF NOT EXISTS anchor_geolocation JSONB;

COMMENT ON COLUMN public.user_profiles.anchor_device_id IS 'Device ID (Pillar 3) at vitalization; tied to this phone.';
COMMENT ON COLUMN public.user_profiles.anchor_geolocation IS 'GPS at vitalization (Pillar 4): { latitude, longitude, accuracy }.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_anchor_device ON public.user_profiles(anchor_device_id) WHERE anchor_device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_anchor_geolocation ON public.user_profiles((anchor_geolocation IS NOT NULL)) WHERE anchor_geolocation IS NOT NULL;

-- =====================================================
-- Quad-Pillar Shield (Ghost Economy Protocol)
-- Work-site geofencing: presence_handshakes.work_site_coords,
-- user_profiles registered work location for 100m radius check.
-- =====================================================

-- presence_handshakes: work site coords at clock-in (denormalized for this handshake)
ALTER TABLE presence_handshakes
  ADD COLUMN IF NOT EXISTS work_site_coords JSONB;

COMMENT ON COLUMN presence_handshakes.work_site_coords IS 'Work site { lat, lng } at clock-in; used for Quad-Pillar Ghost Economy audit.';

-- user_profiles: registered work location (100m radius for GPS pillar)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS work_site_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS work_site_lng NUMERIC(10, 7);

COMMENT ON COLUMN user_profiles.work_site_lat IS 'Registered work site latitude for Quad-Pillar geofence (100m).';
COMMENT ON COLUMN user_profiles.work_site_lng IS 'Registered work site longitude for Quad-Pillar geofence (100m).';

CREATE INDEX IF NOT EXISTS idx_presence_handshakes_work_site ON presence_handshakes ((work_site_coords IS NOT NULL)) WHERE work_site_coords IS NOT NULL;

-- IDENTITY MISMATCH ALERTS & TWIN-PROOF LOGIC
-- Database schema for lockdown protocol, intruder capture, and push notifications
-- Architect: Isreal Okoro (mrfundzman)

-- Sovereign Audit Log (Intruder Capture & Mismatch Events)
CREATE TABLE IF NOT EXISTS sovereign_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  event_type TEXT NOT NULL, -- TWIN_DETECTED, FAMILY_MEMBER_DETECTED, BIOLOGICAL_HASH_MISMATCH, etc.
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  message TEXT NOT NULL,
  intruder_snapshot TEXT, -- Base64 encrypted image
  device_hash TEXT,
  ip_address TEXT,
  geolocation JSONB, -- { latitude, longitude, accuracy }
  variance_percentage DECIMAL(5, 3),
  similarity_score DECIMAL(5, 3),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If sovereign_audit_log already existed without these columns, add them (idempotent)
ALTER TABLE sovereign_audit_log ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '';
ALTER TABLE sovereign_audit_log ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE sovereign_audit_log ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE;
ALTER TABLE sovereign_audit_log ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE sovereign_audit_log ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE sovereign_audit_log ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'LOW';

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_phone ON sovereign_audit_log(phone_number);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON sovereign_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_reviewed ON sovereign_audit_log(reviewed);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON sovereign_audit_log(severity);

-- Push Notifications (Supabase Realtime)
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If push_notifications already existed without these columns, add them (idempotent)
ALTER TABLE push_notifications ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '';
ALTER TABLE push_notifications ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_push_notifications_phone ON push_notifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_push_notifications_read ON push_notifications(read);
CREATE INDEX IF NOT EXISTS idx_push_notifications_timestamp ON push_notifications(timestamp DESC);

-- Unique Harmonic Peaks (Vocal Signature Storage)
CREATE TABLE IF NOT EXISTS unique_harmonic_peaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  fundamental_frequency DECIMAL(8, 3),
  harmonic_ratios DECIMAL(8, 6)[],
  formant_bandwidth DECIMAL(8, 3)[],
  spectral_centroid DECIMAL(8, 3),
  spectral_rolloff DECIMAL(8, 3),
  zero_crossing_rate DECIMAL(8, 6),
  mel_frequency_peaks DECIMAL(8, 3)[],
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If unique_harmonic_peaks already existed without phone_number, add it (idempotent)
ALTER TABLE unique_harmonic_peaks ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '';

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_harmonic_peaks_phone ON unique_harmonic_peaks(phone_number);

-- Identity Mismatch Statistics (Analytics)
CREATE TABLE IF NOT EXISTS identity_mismatch_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  twin_detections INTEGER DEFAULT 0,
  family_member_detections INTEGER DEFAULT 0,
  biological_hash_mismatches INTEGER DEFAULT 0,
  vocal_harmonic_mismatches INTEGER DEFAULT 0,
  high_similarity_mismatches INTEGER DEFAULT 0,
  avg_variance_percentage DECIMAL(5, 3),
  avg_similarity_score DECIMAL(5, 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mismatch_stats_date ON identity_mismatch_stats(date DESC);

-- Enable Row Level Security
ALTER TABLE sovereign_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE unique_harmonic_peaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_mismatch_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can view their own audit logs"
  ON sovereign_audit_log FOR SELECT
  USING (phone_number = current_setting('app.current_user_phone', true));

CREATE POLICY "Users can view their own notifications"
  ON push_notifications FOR SELECT
  USING (phone_number = current_setting('app.current_user_phone', true));

CREATE POLICY "Users can update their own notifications"
  ON push_notifications FOR UPDATE
  USING (phone_number = current_setting('app.current_user_phone', true));

CREATE POLICY "Users can view their own harmonic peaks"
  ON unique_harmonic_peaks FOR SELECT
  USING (phone_number = current_setting('app.current_user_phone', true));

-- System can insert audit logs and notifications
CREATE POLICY "System can insert audit logs"
  ON sovereign_audit_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can insert notifications"
  ON push_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can insert harmonic peaks"
  ON unique_harmonic_peaks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update harmonic peaks"
  ON unique_harmonic_peaks FOR UPDATE
  WITH CHECK (true);

-- Architect (mrfundzman) can view all data
CREATE POLICY "Architect can view all audit logs"
  ON sovereign_audit_log FOR ALL
  USING (current_setting('app.current_user_phone', true) = '+2348012345678');

CREATE POLICY "Architect can view all notifications"
  ON push_notifications FOR ALL
  USING (current_setting('app.current_user_phone', true) = '+2348012345678');

CREATE POLICY "Architect can view all stats"
  ON identity_mismatch_stats FOR ALL
  USING (current_setting('app.current_user_phone', true) = '+2348012345678');

-- Function to update mismatch statistics
CREATE OR REPLACE FUNCTION update_mismatch_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO identity_mismatch_stats (
    date,
    total_attempts,
    twin_detections,
    family_member_detections,
    biological_hash_mismatches,
    vocal_harmonic_mismatches,
    high_similarity_mismatches,
    avg_variance_percentage,
    avg_similarity_score
  )
  VALUES (
    CURRENT_DATE,
    1,
    CASE WHEN NEW.event_type = 'TWIN_DETECTED' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'FAMILY_MEMBER_DETECTED' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'BIOLOGICAL_HASH_MISMATCH' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'VOCAL_HARMONIC_MISMATCH' THEN 1 ELSE 0 END,
    CASE WHEN NEW.event_type = 'HIGH_SIMILARITY_MISMATCH' THEN 1 ELSE 0 END,
    NEW.variance_percentage,
    NEW.similarity_score
  )
  ON CONFLICT (date) DO UPDATE SET
    total_attempts = identity_mismatch_stats.total_attempts + 1,
    twin_detections = identity_mismatch_stats.twin_detections + CASE WHEN NEW.event_type = 'TWIN_DETECTED' THEN 1 ELSE 0 END,
    family_member_detections = identity_mismatch_stats.family_member_detections + CASE WHEN NEW.event_type = 'FAMILY_MEMBER_DETECTED' THEN 1 ELSE 0 END,
    biological_hash_mismatches = identity_mismatch_stats.biological_hash_mismatches + CASE WHEN NEW.event_type = 'BIOLOGICAL_HASH_MISMATCH' THEN 1 ELSE 0 END,
    vocal_harmonic_mismatches = identity_mismatch_stats.vocal_harmonic_mismatches + CASE WHEN NEW.event_type = 'VOCAL_HARMONIC_MISMATCH' THEN 1 ELSE 0 END,
    high_similarity_mismatches = identity_mismatch_stats.high_similarity_mismatches + CASE WHEN NEW.event_type = 'HIGH_SIMILARITY_MISMATCH' THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update statistics
CREATE TRIGGER update_mismatch_stats_trigger
  AFTER INSERT ON sovereign_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION update_mismatch_stats();


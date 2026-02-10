-- ============================================================================
-- SYSTEM SETTINGS — Master Architect controls (e.g. partner applications enabled)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);

COMMENT ON TABLE public.system_settings IS 'Global system flags; MASTER_ARCHITECT can toggle partner_applications_enabled for maintenance.';

-- Default: partner applications enabled
INSERT INTO public.system_settings (key, value, updated_by)
VALUES ('partner_applications_enabled', 'true'::jsonb, 'system')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read system_settings" ON public.system_settings;
CREATE POLICY "Allow public read system_settings"
  ON public.system_settings FOR SELECT TO public USING (true);

-- Update: API (server-side anon key) enforces MASTER_ARCHITECT via cookie before calling update
DROP POLICY IF EXISTS "Allow authenticated update system_settings" ON public.system_settings;
CREATE POLICY "Allow authenticated update system_settings"
  ON public.system_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update system_settings" ON public.system_settings;
CREATE POLICY "Allow anon update system_settings"
  ON public.system_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);

GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT UPDATE ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.system_settings TO service_role;

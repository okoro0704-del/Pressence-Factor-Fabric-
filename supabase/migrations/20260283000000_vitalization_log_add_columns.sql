-- Add missing columns to vitalization_log for DOORKEEPER PROTOCOL
-- Adds: pff_id, device_id, total_vida

-- Add pff_id column
ALTER TABLE public.vitalization_log
  ADD COLUMN IF NOT EXISTS pff_id TEXT;

COMMENT ON COLUMN public.vitalization_log.pff_id IS 'PFF ID assigned during vitalization (e.g., PFF-A1B2C3D4)';

-- Add device_id column
ALTER TABLE public.vitalization_log
  ADD COLUMN IF NOT EXISTS device_id TEXT;

COMMENT ON COLUMN public.vitalization_log.device_id IS 'Device ID used during vitalization (from biometric data)';

-- Add total_vida column
ALTER TABLE public.vitalization_log
  ADD COLUMN IF NOT EXISTS total_vida NUMERIC(18, 2) NOT NULL DEFAULT 11.00;

COMMENT ON COLUMN public.vitalization_log.total_vida IS 'Total VIDA distributed (5 + 5 + 1 = 11)';

-- Create index on pff_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_vitalization_log_pff_id
  ON public.vitalization_log(pff_id);

-- Create index on device_id for device tracking
CREATE INDEX IF NOT EXISTS idx_vitalization_log_device_id
  ON public.vitalization_log(device_id);


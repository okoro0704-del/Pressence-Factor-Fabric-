-- Industrial-Only Enrollment: tag every registration with external scanner (Sentinel ID).
-- Which piece of hardware minted the VIDA.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS external_scanner_serial_number TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS external_fingerprint_hash TEXT;

COMMENT ON COLUMN public.user_profiles.external_scanner_serial_number IS 'Serial number of the USB/Bluetooth scanner that performed the fingerprint scan (industrial enrollment).';
COMMENT ON COLUMN public.user_profiles.external_fingerprint_hash IS 'Hash from external scanner at time of enrollment (dual-biometric with Face).';

ALTER TABLE public.vitalization_requests ADD COLUMN IF NOT EXISTS external_scanner_serial_number TEXT;
ALTER TABLE public.vitalization_requests ADD COLUMN IF NOT EXISTS external_fingerprint_hash TEXT;

COMMENT ON COLUMN public.vitalization_requests.external_scanner_serial_number IS 'Serial of external scanner used for this vitalization request.';
COMMENT ON COLUMN public.vitalization_requests.external_fingerprint_hash IS 'External fingerprint hash at time of request.';

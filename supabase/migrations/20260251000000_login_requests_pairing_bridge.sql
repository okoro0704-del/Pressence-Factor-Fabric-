-- Laptop-Mobile Pairing Bridge: phone sends Device ID + Fingerprint-Signed Token when approving via QR scan.
-- Laptop is stored as Trusted Device (authorized_devices) on success.

ALTER TABLE login_requests
  ADD COLUMN IF NOT EXISTS approver_device_id TEXT,
  ADD COLUMN IF NOT EXISTS fingerprint_token TEXT;

COMMENT ON COLUMN login_requests.approver_device_id IS 'Phone device ID when approval was done via Link Device (QR scan).';
COMMENT ON COLUMN login_requests.fingerprint_token IS 'Fingerprint-signed token from phone (WebAuthn assertion) when approving via QR.';

-- Make non-essential presence_handshakes columns optional for basic chat.
-- If handshake_code or anchor_phone exist (e.g. from an older schema), make them nullable to avoid NOT NULL errors.
-- Essential for presence: citizen_id, nonce_used, payload_hash, verified_at, liveness_score. Rest are optional.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'presence_handshakes' AND column_name = 'handshake_code'
  ) THEN
    ALTER TABLE presence_handshakes ALTER COLUMN handshake_code DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'presence_handshakes' AND column_name = 'anchor_phone'
  ) THEN
    ALTER TABLE presence_handshakes ALTER COLUMN anchor_phone DROP NOT NULL;
  END IF;
END $$;

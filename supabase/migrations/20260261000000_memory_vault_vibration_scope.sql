-- Add 'vibration' scope to sovereign_memory_vault for Linguistic Vibration Matching (banter memory).
-- Content format: "register|lang" e.g. "simple|yo" or "intellectual|en". Persisted so we don't switch to Queen's English after 3 days of Pidgin.

ALTER TABLE sovereign_memory_vault
  DROP CONSTRAINT IF EXISTS sovereign_memory_vault_scope_check;

ALTER TABLE sovereign_memory_vault
  ADD CONSTRAINT sovereign_memory_vault_scope_check
  CHECK (scope IN ('family', 'health', 'goals', 'other', 'vibration'));

COMMENT ON COLUMN sovereign_memory_vault.scope IS 'family|health|goals|other|vibration. vibration = linguistic register + lang for banter memory.';

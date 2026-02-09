-- Update master password to numeric-only: 202604070001 (for DBs that already had the previous alphanumeric password)
UPDATE public.master_access
SET password_hash = encode(digest('202604070001', 'sha256'), 'hex')
WHERE id = 1;

-- =====================================================
-- SOVEREIGN VAULT DOCUMENTS TABLE
-- Stores encrypted document metadata for Partner Ping Logic
-- Actual encrypted files stored in Supabase Storage
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sovereign_vault_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('nin_result', 'drivers_license', 'utility_bill', 'international_passport')),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  encrypted_url TEXT NOT NULL,
  iv TEXT NOT NULL, -- Initialization Vector for AES-GCM decryption
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one document of each type per user
  UNIQUE(phone_number, document_type)
);

-- Index for fast lookups by phone number
CREATE INDEX IF NOT EXISTS idx_sovereign_vault_phone ON public.sovereign_vault_documents(phone_number);

-- Index for document type queries
CREATE INDEX IF NOT EXISTS idx_sovereign_vault_type ON public.sovereign_vault_documents(document_type);

-- =====================================================
-- PARTNER DOCUMENT AUTHORIZATIONS TABLE
-- Tracks which partners are authorized to access which documents
-- =====================================================

CREATE TABLE IF NOT EXISTS public.partner_document_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  partner_id TEXT NOT NULL, -- Partner identifier (e.g., 'UBA', 'ACCESS_BANK')
  document_type TEXT NOT NULL CHECK (document_type IN ('nin_result', 'drivers_license', 'utility_bill', 'international_passport')),
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration
  revoked_at TIMESTAMPTZ, -- If user revokes access
  
  -- Unique constraint: one authorization per partner per document per user
  UNIQUE(phone_number, partner_id, document_type)
);

-- Index for fast partner lookups
CREATE INDEX IF NOT EXISTS idx_partner_auth_partner ON public.partner_document_authorizations(partner_id);

-- Index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_partner_auth_phone ON public.partner_document_authorizations(phone_number);

-- =====================================================
-- PARTNER PING AUDIT LOG
-- Tracks all partner requests for documents (for compliance)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.partner_ping_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  partner_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  authorized BOOLEAN NOT NULL, -- Was the request authorized?
  document_provided BOOLEAN NOT NULL DEFAULT FALSE, -- Was document actually provided?
  ip_address TEXT,
  user_agent TEXT,
  request_metadata JSONB -- Additional request details
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_partner_ping_audit_phone ON public.partner_ping_audit_log(phone_number);
CREATE INDEX IF NOT EXISTS idx_partner_ping_audit_partner ON public.partner_ping_audit_log(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_ping_audit_timestamp ON public.partner_ping_audit_log(request_timestamp DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.sovereign_vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_document_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_ping_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own documents
CREATE POLICY "Users can view own documents"
  ON public.sovereign_vault_documents
  FOR SELECT
  USING (phone_number = current_setting('request.jwt.claims', true)::json->>'phone');

-- Users can insert their own documents
CREATE POLICY "Users can insert own documents"
  ON public.sovereign_vault_documents
  FOR INSERT
  WITH CHECK (phone_number = current_setting('request.jwt.claims', true)::json->>'phone');

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON public.sovereign_vault_documents
  FOR UPDATE
  USING (phone_number = current_setting('request.jwt.claims', true)::json->>'phone');

-- Users can view their own authorizations
CREATE POLICY "Users can view own authorizations"
  ON public.partner_document_authorizations
  FOR SELECT
  USING (phone_number = current_setting('request.jwt.claims', true)::json->>'phone');

-- Users can manage their own authorizations
CREATE POLICY "Users can manage own authorizations"
  ON public.partner_document_authorizations
  FOR ALL
  USING (phone_number = current_setting('request.jwt.claims', true)::json->>'phone');

-- Users can view their own audit log
CREATE POLICY "Users can view own audit log"
  ON public.partner_ping_audit_log
  FOR SELECT
  USING (phone_number = current_setting('request.jwt.claims', true)::json->>'phone');

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.sovereign_vault_documents IS 'Encrypted document metadata for Sovereign Vault';
COMMENT ON TABLE public.partner_document_authorizations IS 'Partner access authorizations for document sharing';
COMMENT ON TABLE public.partner_ping_audit_log IS 'Audit log for all partner document requests';


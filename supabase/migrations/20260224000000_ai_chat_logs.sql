-- =====================================================
-- AI CHAT LOGS TABLE
-- Stores SOVRYN AI chat interactions for analytics
-- Architect: Isreal Okoro (mrfundzman)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  user_wallet TEXT,
  phone_number TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_phone_number ON ai_chat_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user_wallet ON ai_chat_logs(user_wallet);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_timestamp ON ai_chat_logs(timestamp DESC);

-- Comment
COMMENT ON TABLE ai_chat_logs IS 'SOVRYN AI chat interaction logs for analytics and improvement';
COMMENT ON COLUMN ai_chat_logs.message IS 'User message sent to SOVRYN AI';
COMMENT ON COLUMN ai_chat_logs.response IS 'AI-generated response';
COMMENT ON COLUMN ai_chat_logs.user_wallet IS 'User wallet address (if available)';
COMMENT ON COLUMN ai_chat_logs.phone_number IS 'User phone number (if available)';


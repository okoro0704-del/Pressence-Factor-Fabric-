-- =====================================================
-- FAMILY TREE & INHERITANCE SYSTEM
-- Age-Sensitive Auto-Promotion & Legacy Transfer
-- =====================================================

-- =====================================================
-- TABLE: family_members
-- Core family tree structure with recursive relationships
-- =====================================================
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL, -- MANDATORY: For age-based auto-promotion
  account_type TEXT NOT NULL CHECK (account_type IN ('SOVEREIGN_OPERATOR', 'DEPENDENT', 'PROMOTED_SOVEREIGN')),
  
  -- Relationship Mapping
  guardian_phone TEXT, -- Parent/Guardian for dependents
  spouse_phone TEXT, -- Husband ↔ Wife link
  ancestral_root_phone TEXT, -- Link to family tree root
  
  -- VIDA Balance
  vida_balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
  spendable_vida DECIMAL(18, 8) NOT NULL DEFAULT 0,
  locked_vida DECIMAL(18, 8) NOT NULL DEFAULT 0,
  
  -- Status & Activity
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE', 'DECEASED')),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_4layer_scan_at TIMESTAMPTZ, -- For inactivity detection
  
  -- Auto-Promotion Tracking
  promoted_at TIMESTAMPTZ, -- When dependent became sovereign
  promotion_triggered_by TEXT, -- 'AUTO_AGE_18' or 'MANUAL'
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLE: family_relationships
-- Explicit relationship mapping for complex family trees
-- =====================================================
CREATE TABLE IF NOT EXISTS family_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_phone TEXT NOT NULL REFERENCES family_members(phone_number),
  to_phone TEXT NOT NULL REFERENCES family_members(phone_number),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'PARENT_CHILD',
    'SPOUSE',
    'SIBLING',
    'GRANDPARENT_GRANDCHILD',
    'GUARDIAN_DEPENDENT'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_phone, to_phone, relationship_type)
);

-- =====================================================
-- TABLE: legacy_transfer_rules
-- Inheritance rules for wealth redistribution
-- =====================================================
CREATE TABLE IF NOT EXISTS legacy_transfer_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_phone TEXT NOT NULL REFERENCES family_members(phone_number),
  
  -- Inactivity Threshold
  inactivity_months INT NOT NULL DEFAULT 6, -- Months without 4-layer scan
  
  -- Beneficiary Distribution (percentages must sum to 100)
  spouse_percentage DECIMAL(5, 2) DEFAULT 50.00,
  children_percentage DECIMAL(5, 2) DEFAULT 50.00,
  custom_beneficiaries JSONB DEFAULT '[]'::jsonb, -- [{phone, percentage, name}]
  
  -- Verification Requirements
  requires_death_certificate BOOLEAN DEFAULT TRUE,
  requires_guardian_consensus BOOLEAN DEFAULT TRUE,
  min_guardian_approvals INT DEFAULT 3,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TABLE: legacy_transfer_requests
-- Pending wealth redistribution requests
-- =====================================================
CREATE TABLE IF NOT EXISTS legacy_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deceased_phone TEXT NOT NULL REFERENCES family_members(phone_number),
  deceased_name TEXT NOT NULL,
  
  -- Trigger Information
  trigger_reason TEXT NOT NULL CHECK (trigger_reason IN (
    'INACTIVITY_THRESHOLD',
    'DEATH_CERTIFICATE_VERIFIED',
    'GUARDIAN_CONSENSUS',
    'MANUAL_REQUEST'
  )),
  inactivity_days INT,
  last_scan_date TIMESTAMPTZ,
  
  -- Verification
  death_certificate_url TEXT,
  death_certificate_verified BOOLEAN DEFAULT FALSE,
  guardian_approvals JSONB DEFAULT '[]'::jsonb, -- [{phone, name, approved_at}]
  current_approvals INT DEFAULT 0,
  required_approvals INT DEFAULT 3,
  
  -- Distribution Plan
  total_vida_to_distribute DECIMAL(18, 8) NOT NULL,
  distribution_plan JSONB NOT NULL, -- [{beneficiary_phone, beneficiary_name, amount, percentage}]
  
  -- Status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'EXECUTED', 'DENIED', 'EXPIRED')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- TABLE: auto_promotion_queue
-- Tracks dependents eligible for auto-promotion to sovereign
-- =====================================================
CREATE TABLE IF NOT EXISTS auto_promotion_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_phone TEXT NOT NULL REFERENCES family_members(phone_number),
  dependent_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age_years INT NOT NULL,
  guardian_phone TEXT NOT NULL,
  
  -- Promotion Status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'NOTIFIED', 'COMPLETED', 'DECLINED')),
  notified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_family_members_phone_number ON family_members(phone_number);
CREATE INDEX IF NOT EXISTS idx_family_members_guardian_phone ON family_members(guardian_phone);
CREATE INDEX IF NOT EXISTS idx_family_members_spouse_phone ON family_members(spouse_phone);
CREATE INDEX IF NOT EXISTS idx_family_members_ancestral_root ON family_members(ancestral_root_phone);
CREATE INDEX IF NOT EXISTS idx_family_members_account_type ON family_members(account_type);
CREATE INDEX IF NOT EXISTS idx_family_members_status ON family_members(status);
CREATE INDEX IF NOT EXISTS idx_family_members_dob ON family_members(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_family_members_last_active ON family_members(last_active_at);

CREATE INDEX IF NOT EXISTS idx_family_relationships_from_phone ON family_relationships(from_phone);
CREATE INDEX IF NOT EXISTS idx_family_relationships_to_phone ON family_relationships(to_phone);
CREATE INDEX IF NOT EXISTS idx_family_relationships_type ON family_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_legacy_transfer_rules_owner ON legacy_transfer_rules(owner_phone);
CREATE INDEX IF NOT EXISTS idx_legacy_transfer_requests_deceased ON legacy_transfer_requests(deceased_phone);
CREATE INDEX IF NOT EXISTS idx_legacy_transfer_requests_status ON legacy_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_legacy_transfer_requests_expires ON legacy_transfer_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_auto_promotion_queue_dependent ON auto_promotion_queue(dependent_phone);
CREATE INDEX IF NOT EXISTS idx_auto_promotion_queue_status ON auto_promotion_queue(status);
CREATE INDEX IF NOT EXISTS idx_auto_promotion_queue_dob ON auto_promotion_queue(date_of_birth);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(dob DATE)
RETURNS INT AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob))::INT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamps
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legacy_transfer_rules_updated_at
  BEFORE UPDATE ON legacy_transfer_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_transfer_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_promotion_queue ENABLE ROW LEVEL SECURITY;

-- Family Members: Users can view their own record and their family tree
CREATE POLICY family_members_select_policy ON family_members
  FOR SELECT
  USING (
    phone_number = current_setting('app.current_user_phone', true)
    OR guardian_phone = current_setting('app.current_user_phone', true)
    OR spouse_phone = current_setting('app.current_user_phone', true)
    OR ancestral_root_phone = current_setting('app.current_user_phone', true)
  );

-- Family Members: Users can update their own record
CREATE POLICY family_members_update_policy ON family_members
  FOR UPDATE
  USING (phone_number = current_setting('app.current_user_phone', true));

-- Family Members: Guardians can insert dependents
CREATE POLICY family_members_insert_policy ON family_members
  FOR INSERT
  WITH CHECK (
    account_type = 'SOVEREIGN_OPERATOR'
    OR guardian_phone = current_setting('app.current_user_phone', true)
  );

-- Family Relationships: Users can view relationships involving them
CREATE POLICY family_relationships_select_policy ON family_relationships
  FOR SELECT
  USING (
    from_phone = current_setting('app.current_user_phone', true)
    OR to_phone = current_setting('app.current_user_phone', true)
  );

-- Legacy Transfer Rules: Users can manage their own rules
CREATE POLICY legacy_transfer_rules_select_policy ON legacy_transfer_rules
  FOR SELECT
  USING (owner_phone = current_setting('app.current_user_phone', true));

CREATE POLICY legacy_transfer_rules_insert_policy ON legacy_transfer_rules
  FOR INSERT
  WITH CHECK (owner_phone = current_setting('app.current_user_phone', true));

CREATE POLICY legacy_transfer_rules_update_policy ON legacy_transfer_rules
  FOR UPDATE
  USING (owner_phone = current_setting('app.current_user_phone', true));

-- Legacy Transfer Requests: Beneficiaries can view requests
CREATE POLICY legacy_transfer_requests_select_policy ON legacy_transfer_requests
  FOR SELECT
  USING (
    deceased_phone = current_setting('app.current_user_phone', true)
    OR distribution_plan::jsonb @> jsonb_build_array(
      jsonb_build_object('beneficiary_phone', current_setting('app.current_user_phone', true))
    )
  );

-- Auto Promotion Queue: Users can view their own promotion status
CREATE POLICY auto_promotion_queue_select_policy ON auto_promotion_queue
  FOR SELECT
  USING (
    dependent_phone = current_setting('app.current_user_phone', true)
    OR guardian_phone = current_setting('app.current_user_phone', true)
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Family Tree with Age Calculation
CREATE OR REPLACE VIEW family_tree_with_age AS
SELECT
  fm.*,
  calculate_age(fm.date_of_birth) AS age_years,
  CASE
    WHEN fm.account_type = 'DEPENDENT' AND calculate_age(fm.date_of_birth) >= 18 THEN true
    ELSE false
  END AS eligible_for_promotion,
  CASE
    WHEN fm.last_4layer_scan_at IS NULL THEN NULL
    ELSE EXTRACT(EPOCH FROM (NOW() - fm.last_4layer_scan_at)) / 86400
  END AS days_since_last_scan
FROM family_members fm;

-- View: Pending Auto-Promotions
CREATE OR REPLACE VIEW pending_auto_promotions AS
SELECT
  fm.phone_number,
  fm.full_name,
  fm.date_of_birth,
  calculate_age(fm.date_of_birth) AS age_years,
  fm.guardian_phone,
  fm.vida_balance,
  fm.created_at
FROM family_members fm
WHERE
  fm.account_type = 'DEPENDENT'
  AND calculate_age(fm.date_of_birth) >= 18
  AND fm.status = 'ACTIVE'
  AND fm.promoted_at IS NULL;

-- View: Inactive Accounts (Potential Legacy Transfers)
CREATE OR REPLACE VIEW inactive_accounts_for_legacy AS
SELECT
  fm.phone_number,
  fm.full_name,
  fm.vida_balance,
  fm.last_4layer_scan_at,
  EXTRACT(EPOCH FROM (NOW() - fm.last_4layer_scan_at)) / 2592000 AS months_inactive,
  ltr.inactivity_months AS threshold_months,
  ltr.spouse_percentage,
  ltr.children_percentage
FROM family_members fm
LEFT JOIN legacy_transfer_rules ltr ON fm.phone_number = ltr.owner_phone
WHERE
  fm.status = 'ACTIVE'
  AND fm.last_4layer_scan_at IS NOT NULL
  AND ltr.is_active = true
  AND EXTRACT(EPOCH FROM (NOW() - fm.last_4layer_scan_at)) / 2592000 >= ltr.inactivity_months;


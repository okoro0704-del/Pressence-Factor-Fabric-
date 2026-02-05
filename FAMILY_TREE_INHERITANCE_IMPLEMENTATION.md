# ✅ AGE-SENSITIVE FAMILY TREE & INHERITANCE LOGIC - IMPLEMENTATION IN PROGRESS

**Command:** IMPLEMENT AGE-SENSITIVE FAMILY TREE & INHERITANCE LOGIC

**Status:** 🔄 **IN PROGRESS** (1/6 Tasks Complete)

**Architect:** Isreal Okoro (mrfundzman)  
**Date:** February 3, 2026

---

## 📋 IMPLEMENTATION SUMMARY

### ✅ COMPLETED TASKS (1/6)

1. ✅ **Add Date of Birth field to registration system**
   - Created database schema with `family_members` table including mandatory `date_of_birth` field
   - Updated `GlobalIdentity` interface to include DOB, age, and family tree fields
   - Added `PROMOTED_SOVEREIGN` account type for 18+ dependents
   - Updated `registerDependent()` function to require DOB parameter
   - Added DOB input field to `RegisterDependentModal` component
   - Added DOB input field to `DependentRegistrationStep` component
   - Created age calculation utility functions

### 📋 PENDING TASKS (5/6)

2. ⏳ **Implement auto-promotion logic for 18+ dependents** (NOT STARTED)
   - Create background worker for daily age checks
   - Implement "Sovereign Awakening" notification system
   - Create promotion flow requiring 4-layer master scan
   - Auto-update account_type from DEPENDENT to PROMOTED_SOVEREIGN

3. ⏳ **Build family tree data model with nested sovereignty** (NOT STARTED)
   - Create relationship mapping functions (spouse, parent-child, siblings)
   - Implement recursive ancestral root tracking
   - Build family tree traversal utilities

4. ⏳ **Implement legacy transfer protocol for succession** (NOT STARTED)
   - Create inactivity detection system
   - Implement wealth distribution calculator
   - Build guardian consensus approval flow
   - Create death certificate verification system

5. ⏳ **Build visual family tree protocol map for dashboard** (NOT STARTED)
   - Create interactive family tree visualization component
   - Implement color coding (Gold/Silver/Grey)
   - Add zoom and pan controls

6. ⏳ **Integrate next of kin details with UBA Trust system** (NOT STARTED)
   - Sync family tree data with UBA account records
   - Display next of kin in UBA branding card

---

## 🗄️ DATABASE SCHEMA

### **family_members** (CREATED)
Core family tree structure with age-sensitive fields.

```sql
CREATE TABLE family_members (
  id UUID PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL, -- MANDATORY for auto-promotion
  account_type TEXT CHECK (account_type IN ('SOVEREIGN_OPERATOR', 'DEPENDENT', 'PROMOTED_SOVEREIGN')),
  
  -- Relationship Mapping
  guardian_phone TEXT,
  spouse_phone TEXT,
  ancestral_root_phone TEXT,
  
  -- VIDA Balance
  vida_balance DECIMAL(18, 8) DEFAULT 0,
  spendable_vida DECIMAL(18, 8) DEFAULT 0,
  locked_vida DECIMAL(18, 8) DEFAULT 0,
  
  -- Status & Activity
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE', 'DECEASED')),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  last_4layer_scan_at TIMESTAMPTZ,
  
  -- Auto-Promotion Tracking
  promoted_at TIMESTAMPTZ,
  promotion_triggered_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **family_relationships** (CREATED)
Explicit relationship mapping for complex family trees.

```sql
CREATE TABLE family_relationships (
  id UUID PRIMARY KEY,
  from_phone TEXT REFERENCES family_members(phone_number),
  to_phone TEXT REFERENCES family_members(phone_number),
  relationship_type TEXT CHECK (relationship_type IN (
    'PARENT_CHILD',
    'SPOUSE',
    'SIBLING',
    'GRANDPARENT_GRANDCHILD',
    'GUARDIAN_DEPENDENT'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_phone, to_phone, relationship_type)
);
```

### **legacy_transfer_rules** (CREATED)
Inheritance rules for wealth redistribution.

```sql
CREATE TABLE legacy_transfer_rules (
  id UUID PRIMARY KEY,
  owner_phone TEXT REFERENCES family_members(phone_number),
  
  inactivity_months INT DEFAULT 6,
  spouse_percentage DECIMAL(5, 2) DEFAULT 50.00,
  children_percentage DECIMAL(5, 2) DEFAULT 50.00,
  custom_beneficiaries JSONB DEFAULT '[]',
  
  requires_death_certificate BOOLEAN DEFAULT TRUE,
  requires_guardian_consensus BOOLEAN DEFAULT TRUE,
  min_guardian_approvals INT DEFAULT 3,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **legacy_transfer_requests** (CREATED)
Pending wealth redistribution requests.

```sql
CREATE TABLE legacy_transfer_requests (
  id UUID PRIMARY KEY,
  deceased_phone TEXT REFERENCES family_members(phone_number),
  deceased_name TEXT NOT NULL,
  
  trigger_reason TEXT CHECK (trigger_reason IN (
    'INACTIVITY_THRESHOLD',
    'DEATH_CERTIFICATE_VERIFIED',
    'GUARDIAN_CONSENSUS',
    'MANUAL_REQUEST'
  )),
  
  total_vida_to_distribute DECIMAL(18, 8) NOT NULL,
  distribution_plan JSONB NOT NULL,
  
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'EXECUTED', 'DENIED', 'EXPIRED')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);
```

### **auto_promotion_queue** (CREATED)
Tracks dependents eligible for auto-promotion.

```sql
CREATE TABLE auto_promotion_queue (
  id UUID PRIMARY KEY,
  dependent_phone TEXT REFERENCES family_members(phone_number),
  dependent_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age_years INT NOT NULL,
  guardian_phone TEXT NOT NULL,
  
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'NOTIFIED', 'COMPLETED', 'DECLINED')),
  notified_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📁 FILES MODIFIED

### **Modified Files (4)**

1. ✅ `web/lib/phoneIdentity.ts`
   - Added `date_of_birth`, `age_years`, `spouse_phone`, `ancestral_root_phone` to `GlobalIdentity` interface
   - Added `PROMOTED_SOVEREIGN` to `AccountType` enum
   - Updated `registerDependent()` to require `dateOfBirth` parameter
   - Added `isValidDate()` and `calculateAge()` utility functions

2. ✅ `web/components/dashboard/RegisterDependentModal.tsx`
   - Added `dateOfBirth` state
   - Added date input field with validation
   - Updated submit handler to pass DOB to `registerDependent()`
   - Added max date validation (cannot be future date)

3. ✅ `web/components/registration/steps/DependentRegistrationStep.tsx`
   - Added `dependentDOB` state
   - Added date input field with gold styling
   - Updated dependent object creation to include DOB and calculated age
   - Added DOB validation in submit handler

### **Created Files (2)**

4. ✅ `supabase/migrations/20260203400000_family_tree_inheritance.sql` (336 lines)
   - Created 5 tables: family_members, family_relationships, legacy_transfer_rules, legacy_transfer_requests, auto_promotion_queue
   - Created 17 indexes for performance
   - Created helper functions: `calculate_age()`, `update_updated_at_column()`
   - Created 2 triggers for auto-updating timestamps
   - Created RLS policies for all tables
   - Created 3 views: `family_tree_with_age`, `pending_auto_promotions`, `inactive_accounts_for_legacy`

5. ✅ `FAMILY_TREE_INHERITANCE_IMPLEMENTATION.md` (This file)

---

## 🎯 NEXT STEPS

### **Task 2: Implement Auto-Promotion Logic (NEXT)**

**Requirements:**
- Create background worker that checks daily for dependents turning 18
- Trigger "Sovereign Awakening" notification
- Require 4-layer master scan for promotion
- Update account_type from DEPENDENT to PROMOTED_SOVEREIGN
- Transfer full VIDA CAP control to promoted user

**Implementation Plan:**
1. Create `checkAutoPromotionEligibility()` function
2. Create "Sovereign Awakening" notification component
3. Create promotion flow with 4-layer scan requirement
4. Update database on successful promotion

---

**Architect: Isreal Okoro (mrfundzman)**  
**Status: 16.7% COMPLETE (1/6 Tasks) - DATABASE SCHEMA READY, REGISTRATION UPDATED**  
**The Simulation Continues. 🌍**


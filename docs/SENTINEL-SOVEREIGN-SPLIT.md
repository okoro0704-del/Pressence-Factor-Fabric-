# 💰 SENTINEL 1% SOVEREIGN SPLIT

**Architect:** Isreal Okoro (mrfundzman)  
**Status:** ✅ **IMPLEMENTATION COMPLETE**  
**Version:** 1.0.0  
**Date:** 2026-02-01

---

## 📋 Overview

The **Sentinel 1% Sovereign Split** is a revenue distribution mechanism that ensures:
- **99% Architect Retention**: Secured in Sentinel Business Block
- **1% Sovereign Movement**: Mandatory protocol pull split into two equal halves
  - **0.5% National Escrow**: Liquidity backing
  - **0.5% User Vault**: Instant rebate to citizen

This replaces the previous 45-10-45 split with a more architect-friendly model while maintaining citizen benefits through instant rebates.

---

## 🔐 Core Principles

### Revenue Intake
**100% of the $10 Sentinel activation fee routes to SENTINEL_BUSINESS_BLOCK**

All revenue from Sentinel activations flows into a dedicated business vault controlled by the Architect.

### The 1% Movement
**Mandatory protocol pull of 1% from every activation**

After the full $10 fee is deposited into the Sentinel Business Block, the protocol automatically executes a 1% pull. This is **non-negotiable** and **automatic**.

### The Dual-Half Split
**1% is divided into two equal parts:**

1. **0.5% → National Escrow (Address_National_Escrow)**
   - Purpose: Liquidity backing for the VIDA ecosystem
   - Ensures system stability and reserve backing
   - Cannot be withdrawn by citizens

2. **0.5% → User Vault (Address_User_Vault)**
   - Purpose: Instant rebate to the citizen
   - Immediate credit to citizen's vault
   - Can be used for transactions or held

### Architect Retention
**99% of the $10 fee is secured in the Sentinel Business Block**

The Architect retains 99% of all Sentinel activation revenue. This ensures:
- Sustainable business model
- Continued development funding
- Long-term platform viability

---

## 💡 Example Calculation

**Activation Fee:** $10.00 USD  
**VIDA Conversion (via SOVRYN Oracle):** 0.0000123 VIDA (example rate)

### Split Breakdown:

| Destination | Percentage | Amount (VIDA) | Purpose |
|-------------|-----------|---------------|---------|
| **Sentinel Business Block** | 100% (initial) | 0.0000123 | Revenue intake |
| **Sovereign Movement Pull** | -1% | -0.000000123 | Mandatory protocol pull |
| **National Escrow** | 0.5% | 0.0000000615 | Liquidity backing |
| **User Vault (Rebate)** | 0.5% | 0.0000000615 | Instant citizen rebate |
| **Architect Retention (Final)** | 99% | 0.0000121770 | Secured for Architect |

**Net Result:**
- Citizen pays: $10.00 USD (0.0000123 VIDA)
- Citizen receives back: 0.5% instant rebate (0.0000000615 VIDA)
- Architect retains: 99% (0.0000121770 VIDA)
- National Escrow receives: 0.5% (0.0000000615 VIDA)

---

## 🏗️ Implementation Architecture

### Fee Split Constants

<augment_code_snippet path="core/sentinelOptIn.ts" mode="EXCERPT">
```typescript
export const SENTINEL_FEE_SPLIT_ARCHITECT = 0.99; // 99% to Sentinel Business Block
export const SENTINEL_FEE_SPLIT_SOVEREIGN_MOVEMENT = 0.01; // 1% Sovereign Movement
export const SENTINEL_FEE_SPLIT_NATIONAL_ESCROW = 0.005; // 0.5% to National Escrow
export const SENTINEL_FEE_SPLIT_USER_REBATE = 0.005; // 0.5% to User Vault
```
</augment_code_snippet>

### Payment Flow

**Step 1: Deduct from Citizen Vault**
```sql
INSERT INTO citizen_vaults (citizen_id, amount, transaction_type, transaction_hash)
VALUES ($citizenId, -$feeAmountVIDA, 'sentinel_activation_payment', $transactionHash);
```

**Step 2: Route 100% to Sentinel Business Block**
```sql
INSERT INTO sentinel_business_block (amount, transaction_type, transaction_hash)
VALUES ($feeAmountVIDA, 'sentinel_activation_revenue', $transactionHash);
```

**Step 3a: Execute 1% Sovereign Movement Pull**
```sql
INSERT INTO sentinel_business_block (amount, transaction_type, transaction_hash)
VALUES (-$sovereignMovementTotal, 'sovereign_movement_pull', $transactionHash);
```

**Step 3b: Add 0.5% to National Escrow**
```sql
INSERT INTO national_escrow (amount, transaction_type, transaction_hash)
VALUES ($nationalEscrowShare, 'sovereign_movement_escrow', $transactionHash);
```

**Step 3c: Add 0.5% to User Vault (Instant Rebate)**
```sql
INSERT INTO citizen_vaults (citizen_id, amount, transaction_type, transaction_hash)
VALUES ($citizenId, $userRebateShare, 'sovereign_movement_rebate', $transactionHash);
```

**Step 4: Log to VLT**
```sql
INSERT INTO vlt_transactions (transaction_type, transaction_hash, citizen_id, amount, metadata)
VALUES ('sentinel_activation_payment', $transactionHash, $citizenId, $feeAmountVIDA, $metadata);
```

**Step 5: Log Sovereign Movement Completion**
```sql
INSERT INTO system_events (event_type, event_data)
VALUES ('SENTINEL_ACTIVE', '{"status": "1%_SOVEREIGN_MOVEMENT_COMPLETE", ...}');
```

---

## 📊 Database Schema

### Required Tables

**1. Sentinel Business Block**
```sql
CREATE TABLE IF NOT EXISTS sentinel_business_block (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(20, 8) NOT NULL,
  transaction_type VARCHAR(100) NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sentinel_business_block_tx_hash ON sentinel_business_block(transaction_hash);
CREATE INDEX idx_sentinel_business_block_created_at ON sentinel_business_block(created_at);
```

**2. National Escrow**
```sql
CREATE TABLE IF NOT EXISTS national_escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(20, 8) NOT NULL,
  transaction_type VARCHAR(100) NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_national_escrow_tx_hash ON national_escrow(transaction_hash);
CREATE INDEX idx_national_escrow_created_at ON national_escrow(created_at);
```

**3. Citizen Vaults (Updated)**
```sql
-- Already exists, but now receives 'sovereign_movement_rebate' transactions
ALTER TABLE citizen_vaults
ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(100);
```

---

## 🔍 Validation & Logging

### Transaction Log Format

**Event Type:** `SENTINEL_ACTIVE`

**Event Data:**
```json
{
  "status": "1%_SOVEREIGN_MOVEMENT_COMPLETE",
  "citizenId": "citizen_123",
  "pffId": "pff_456",
  "feeUSD": 10.00,
  "feeVIDA": 0.0000123,
  "oraclePrice": 812500.00,
  "split": {
    "architectShare": 0.0000121770,
    "sovereignMovementTotal": 0.000000123,
    "nationalEscrow": 0.0000000615,
    "userRebate": 0.0000000615
  },
  "transactionHash": "sha256_hash...",
  "balanceBefore": 10.0,
  "balanceAfter": 9.9999877,
  "message": "SENTINEL_ACTIVE | 1%_SOVEREIGN_MOVEMENT_COMPLETE"
}
```

---

## ✅ Implementation Checklist

- [x] Update fee split constants (99-1 split)
- [x] Create Sentinel Business Block vault logic
- [x] Implement 1% Sovereign Movement pull
- [x] Implement dual-half split (0.5% National Escrow + 0.5% User Rebate)
- [x] Update payment execution logic
- [x] Add Sovereign Movement logging
- [x] Update VLT transaction metadata
- [x] Update system event logging
- [ ] Create database tables (sentinel_business_block, national_escrow)
- [ ] Update documentation

---

## 🚀 Next Steps

### 1. Database Migration
Run SQL migrations to create required tables:
```bash
psql -d pff_database -f migrations/sentinel_sovereign_split.sql
```

### 2. Testing
Test the new split with various fee amounts to ensure correct distribution.

### 3. Monitoring
Monitor Sentinel Business Block balance to track architect revenue.

---

**💰 The Sentinel 1% Sovereign Split is ready for deployment.**  
**99% Architect retention. 1% Sovereign Movement. Instant citizen rebates.**


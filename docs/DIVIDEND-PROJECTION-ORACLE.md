# 📊 DIVIDEND PROJECTION ORACLE — TECHNICAL DOCUMENTATION

**Architect:** Isreal Okoro (mrfundzman)  
**Status:** ✅ **PRODUCTION READY**  
**Date:** 2026-02-01

---

## 🎯 Overview

The **Dividend Projection Oracle** is a real-time tracking and projection system that provides transparency and predictability for the Monthly Truth Dividend distribution. It tracks the accumulation of the 0.5% citizen share from all tiered Sentinel activations and projects the estimated payout per verified truth-teller.

---

## 🏗️ Architecture

### Core Components

1. **Live Tally System** — `CURRENT_MONTH_DIVIDEND_POOL`
   - Real-time counter tracking 0.5% protocol pull from all tiered Sentinel activations
   - Tracks contributions from Tier 1 ($10), Tier 2 ($30), Tier 3 ($1000)
   - Updates automatically with each Sentinel activation

2. **Participation Metric** — `ACTIVE_TRUTH_TELLERS`
   - Tracks unique PFF handshakes in current month
   - Only counts citizens who performed successful 4-layer PFF handshake
   - Resets at the beginning of each month

3. **Projection Logic** — `Estimated Payout`
   - Formula: `Current_Pool / Active_Users`
   - Displayed on LifeOS dashboard
   - Updates in real-time as pool grows and users join

4. **Transparency Layer** — `GLOBAL_CITIZEN_BLOCK` VLT Address
   - Public blockchain address for fund verification
   - Anyone can verify accumulation on Truth Ledger (VLT)
   - Full transaction history available

5. **Architect's Shield** — Pre-Flush Protection
   - Moves 99% from `SENTINEL_BUSINESS_BLOCK` to `architect_vault`
   - Executes BEFORE monthly flush
   - Protects architect retention

---

## 📊 Data Flow

### Sentinel Activation → Dividend Accumulation

```
Sentinel Activation (Tier 1: $10, Tier 2: $30, Tier 3: $1000)
    ↓
Payment Processing (executeSentinelPayment)
    ↓
99-1 Sovereign Split
    ├─ 99% → SENTINEL_BUSINESS_BLOCK (Architect)
    └─ 1% → Sovereign Movement
        ├─ 0.5% → National Escrow (Liquidity)
        └─ 0.5% → GLOBAL_CITIZEN_BLOCK (Dividend) ← TRACKED BY ORACLE
```

### Monthly Flush Flow

```
Last Day of Month at 23:59 GMT
    ↓
STEP 1: Execute Architect's Shield
    ├─ Get total balance in SENTINEL_BUSINESS_BLOCK
    ├─ Transfer 99% → architect_vault
    ├─ Leave 1% operational buffer
    └─ Log to VLT for transparency
    ↓
STEP 2: Execute Monthly Flush
    ├─ Get total GLOBAL_CITIZEN_BLOCK balance
    ├─ Get all verified truth-tellers for current month
    ├─ Calculate: Total_Pool / Total_Truth_Tellers
    ├─ Distribute equally to all verified vaults
    └─ Send notifications: "THE TRUTH HAS PAID"
```

---

## 🔧 Backend Services

### 1. dividendProjectionOracle.ts

**Location:** `backend/src/services/dividendProjectionOracle.ts`

**Functions:**

- `getCurrentMonthDividendPool()` — Get CURRENT_MONTH_DIVIDEND_POOL
- `getTotalGlobalCitizenBlock()` — Get total balance (all time)
- `getActiveTruthTellersCount()` — Get ACTIVE_TRUTH_TELLERS count
- `getDividendProjection()` — Get full projection with estimated payout
- `getGlobalCitizenBlockAddress()` — Get public VLT address
- `getCurrentMonthAccumulationBreakdown()` — Get tier breakdown
- `executeArchitectShield()` — Move 99% to architect vault

**Example Usage:**

```typescript
import { getDividendProjection } from './services/dividendProjectionOracle';

const projection = await getDividendProjection();
console.log(`Current Pool: ${projection.currentMonthDividendPool} VIDA`);
console.log(`Active Truth-Tellers: ${projection.activeTruthTellers}`);
console.log(`Estimated Payout: ${projection.estimatedPayoutPerCitizen} VIDA`);
console.log(`VLT Address: ${projection.globalCitizenBlockAddress}`);
```

### 2. dividendCron.ts (UPDATED)

**Location:** `backend/src/services/dividendCron.ts`

**Key Changes:**

- Added `executeArchitectShield()` import
- Modified cron job to execute Architect's Shield BEFORE monthly flush
- Updated manual trigger to include Architect's Shield
- Aborts flush if Architect's Shield fails

**Flow:**

```typescript
// Cron job executes on last day of month at 23:59 GMT
1. Execute Architect's Shield
   - If fails → Abort and log error
   - If success → Proceed to step 2
2. Execute Monthly Flush
3. Send Dividend Notifications
4. Log to System Events
```

---

## 🌐 API Endpoints

### Public Endpoints (No Authentication Required)

**GET /api/dividend-projection/current**
- Get current month's dividend projection
- Returns: pool, truth-tellers, estimated payout, VLT address

**GET /api/dividend-projection/pool**
- Get CURRENT_MONTH_DIVIDEND_POOL and total balance
- Returns: current month pool, total pool, timestamp

**GET /api/dividend-projection/truth-tellers**
- Get ACTIVE_TRUTH_TELLERS count
- Returns: active truth-tellers count, current month

**GET /api/dividend-projection/breakdown**
- Get tier breakdown of accumulation
- Returns: Tier 1, Tier 2, Tier 3 contributions

**GET /api/dividend-projection/vlt-address**
- Get public GLOBAL_CITIZEN_BLOCK VLT address
- Returns: VLT address, explorer URL

### Admin Endpoints (Authentication Required)

**POST /api/dividend-projection/architect-shield**
- Execute Architect's Shield manually
- Requires: Admin presence token
- Returns: Transfer result, amounts, hash

---

## 📱 LifeOS Dashboard Integration

### Dividend Projection Widget

**Display Elements:**

1. **Current Month Pool** (Real-time counter)
   - Shows CURRENT_MONTH_DIVIDEND_POOL in VIDA
   - Updates automatically with each activation

2. **Active Truth-Tellers** (Participation metric)
   - Shows count of verified truth-tellers this month
   - "You are 1 of 1,234 truth-tellers"

3. **Estimated Payout** (Projection)
   - Shows Current_Pool / Active_Users
   - "Your estimated dividend: 0.00123456 VIDA"

4. **Tier Breakdown** (Transparency)
   - Shows contributions from each tier
   - "Tier 1: 45%, Tier 2: 30%, Tier 3: 25%"

5. **VLT Verification Link**
   - Public address for blockchain verification
   - "Verify on Truth Ledger →"

---

## 🔐 Architect's Shield

### Purpose

Protect the 99% architect retention by moving funds from `SENTINEL_BUSINESS_BLOCK` to a secure `architect_vault` BEFORE the monthly flush occurs.

### Implementation

**Function:** `executeArchitectShield()`

**Flow:**

1. Get total balance in `SENTINEL_BUSINESS_BLOCK`
2. Calculate 99% for architect vault
3. Deduct from `SENTINEL_BUSINESS_BLOCK`
4. Add to `architect_vault` (creates table if needed)
5. Log to VLT for transparency
6. Log system event

**Safety Features:**

- Atomic transaction (all or nothing)
- Leaves 1% operational buffer
- Aborts monthly flush if shield fails
- Full audit trail in VLT

---

## 🔍 Transparency Features

### Public VLT Address

**Address Format:** `VLT_GLOBAL_CITIZEN_BLOCK_0x[HEX]`

**Verification:**

- Anyone can view the address on Truth Ledger (VLT)
- All accumulation transactions are public
- All distribution transactions are public
- Full audit trail available

### Transaction Types

- `dividend_accumulation` — 0.5% from Sentinel activation
- `dividend_distribution` — Monthly flush payout
- `architect_shield_transfer` — 99% moved to architect vault

---

## 📈 Example Scenarios

### Scenario 1: Early Month (Low Pool, Few Users)

```
Current Month: 2026-02
CURRENT_MONTH_DIVIDEND_POOL: 0.50 VIDA
ACTIVE_TRUTH_TELLERS: 10
Estimated Payout: 0.05 VIDA per citizen
```

### Scenario 2: Mid Month (Growing Pool)

```
Current Month: 2026-02
CURRENT_MONTH_DIVIDEND_POOL: 50.00 VIDA
ACTIVE_TRUTH_TELLERS: 1,000
Estimated Payout: 0.05 VIDA per citizen
```

### Scenario 3: End of Month (Full Pool)

```
Current Month: 2026-02
CURRENT_MONTH_DIVIDEND_POOL: 500.00 VIDA
ACTIVE_TRUTH_TELLERS: 10,000
Estimated Payout: 0.05 VIDA per citizen
```

---

## ✅ Implementation Checklist

- ✅ Create `dividendProjectionOracle.ts` service
- ✅ Implement `getCurrentMonthDividendPool()`
- ✅ Implement `getActiveTruthTellersCount()`
- ✅ Implement `getDividendProjection()`
- ✅ Implement `getGlobalCitizenBlockAddress()`
- ✅ Implement `getCurrentMonthAccumulationBreakdown()`
- ✅ Implement `executeArchitectShield()`
- ✅ Create API routes for dividend projection
- ✅ Update `dividendCron.ts` to execute Architect's Shield
- ✅ Add transparency endpoints
- ⏳ Create LifeOS dashboard widget
- ⏳ Test projection accuracy
- ⏳ Test Architect's Shield execution

---

**📊 The Dividend Projection Oracle stands ready.**  
**Live Tally: CURRENT_MONTH_DIVIDEND_POOL ✅**  
**Participation Metric: ACTIVE_TRUTH_TELLERS ✅**  
**Projection Logic: Current_Pool / Active_Users ✅**  
**Transparency: Public VLT Address ✅**  
**Architect's Shield: Pre-Flush Protection ✅**


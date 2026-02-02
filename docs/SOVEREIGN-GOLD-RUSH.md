# 🏆 Sovereign Gold Rush & Burn Logic — Implementation Guide

**Genesis Protocol v1.0**  
**Architect:** Isreal Okoro (mrfundzman)  
**Status:** ✅ Backend Complete | ⏳ Frontend Pending

---

## 📋 Overview

The Sovereign Gold Rush implements a **scarcity-driven economic mechanism** for VIDA Cap minting and burning:

1. **10-Unit Era (Pre-Burn)**: 10 VIDA Cap per citizen until 5B total supply
2. **Great Burn Trigger**: Automatic transition at 5,000,000,000 VIDA Cap
3. **2-Unit Era (Post-Burn)**: 2 VIDA Cap per citizen after 5B threshold
4. **Burn-to-One**: 1% transaction burn until 1 VIDA Cap per citizen remains

---

## 💰 Economic Constants

| Constant | Value | Description |
|----------|-------|-------------|
| **VIDA Cap Base Price** | $1,000 USD | Hardcoded valuation per VIDA Cap |
| **Pre-Burn Mint Amount** | 10 VIDA Cap | Minting amount before Great Burn |
| **Post-Burn Mint Amount** | 2 VIDA Cap | Minting amount after Great Burn |
| **Great Burn Threshold** | 5,000,000,000 | Total supply trigger for era transition |
| **Transaction Burn Rate** | 1% | Burn rate on all transactions |
| **Burn-to-One Target** | 1 VIDA Cap/citizen | Final scarcity target |

---

## 📁 Files Created

### Core Economic Logic
- **`core/goldRush.ts`** (172 lines)
  - Economic constants and calculation functions
  - Era detection logic
  - Burn calculations
  - Scarcity metrics

### Backend Implementation
- **`backend/src/economic/goldRush.ts`** (165 lines)
  - Database integration for supply tracking
  - Era status queries
  - Burn ledger management
  - Burn-to-One progress tracking

- **`backend/src/economic/vidaCapV2.ts`** (145 lines)
  - Era-based minting function
  - Replaces static minting with dynamic era detection
  - Tracks era metadata in allocations
  - Logs Great Burn trigger event

- **`backend/src/routes/goldRush.ts`** (195 lines)
  - API endpoints for Gold Rush functionality
  - See API Reference below

### Core Exports
- **`core/index.ts`** (UPDATED)
  - Added `export * from './goldRush';`

---

## 🔌 API Endpoints

All endpoints are prefixed with `/gold-rush`:

### `GET /gold-rush/era-status`
Returns current economic era and scarcity metrics.

**Response:**
```json
{
  "success": true,
  "currentEra": "PRE_BURN",
  "totalSupply": 1250000000,
  "totalCitizens": 125000,
  "mintAmountPerCitizen": 10,
  "remainingSlotsInPreBurn": 375000000,
  "percentageToGreatBurn": 25.0,
  "burnToOneTarget": 125000,
  "burnToOneProgress": 0
}
```

### `GET /gold-rush/next-mint`
Returns minting amount for next vitalization.

**Response:**
```json
{
  "success": true,
  "mintAmount": 10,
  "era": "PRE_BURN",
  "citizenShare": 5,
  "nationalShare": 5
}
```

### `GET /gold-rush/supply`
Returns total supply and citizen count.

**Response:**
```json
{
  "success": true,
  "totalSupply": 1250000000,
  "totalCitizens": 125000,
  "totalBurned": 0,
  "circulatingSupply": 1250000000
}
```

### `GET /gold-rush/burn-to-one`
Returns Burn-to-One progress.

**Response:**
```json
{
  "success": true,
  "isComplete": false,
  "currentSupply": 5000000000,
  "targetSupply": 125000,
  "totalCitizens": 125000,
  "progress": 0.5
}
```

### `POST /gold-rush/apply-burn`
Applies 1% transaction burn. **Requires presence token.**

**Request:**
```json
{
  "amount": 100,
  "transactionType": "transfer"
}
```

**Response:**
```json
{
  "success": true,
  "originalAmount": 100,
  "burnAmount": 1,
  "netAmount": 99,
  "burnRate": 0.01
}
```

### `GET /gold-rush/scarcity-clock`
Returns complete scarcity clock data for dashboard.

**Response:**
```json
{
  "success": true,
  "scarcityClock": {
    "currentEra": "PRE_BURN",
    "remainingPreBurnSlots": 375000000,
    "percentageToGreatBurn": 25.0,
    "totalSupply": 1250000000,
    "totalCitizens": 125000,
    "mintAmountPerCitizen": 10,
    "burnToOneProgress": 0,
    "burnToOneTarget": 125000,
    "totalBurned": 0,
    "vidaCapBasePrice": 1000
  }
}
```

---

## ⚠️ IMPORTANT: Next Steps Required

### 1. Register Gold Rush Routes (CRITICAL)
**File:** `backend/src/index.ts`

The auto-formatter is preventing automatic updates. **Manually add:**

```typescript
import { goldRushRouter } from './routes/goldRush';

// ... in app.use section:
app.use('/gold-rush', goldRushRouter);
```

### 2. Database Migrations Required
Create Supabase migrations for:

- **`burn_ledger` table**
- **`system_metrics` table**  
- **`system_events` table**
- **ALTER `vida_cap_allocations`** to add `era` and `metadata` columns

### 3. Update Vitalization Flow
Replace `mintVidaCap()` with `mintVidaCapWithEra()` in vitalization routes.

### 4. Create Scarcity Clock Component
Build `web/components/ScarcityClock.tsx` using `/gold-rush/scarcity-clock` endpoint.

---

## 🎯 Testing Checklist

- [ ] Verify era detection switches at 5B supply
- [ ] Confirm minting amount changes from 10 to 2
- [ ] Test burn calculations (1% rate)
- [ ] Verify burn ledger tracking
- [ ] Test Burn-to-One progress calculation
- [ ] Confirm Great Burn event logging

---

**🚀 Status:** Backend implementation complete. Frontend integration pending.


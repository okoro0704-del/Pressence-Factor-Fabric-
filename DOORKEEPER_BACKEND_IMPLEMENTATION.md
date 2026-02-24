# 🚪 DOORKEEPER PROTOCOL - Backend Implementation

**Status:** ✅ **PHASE 1 COMPLETE**  
**Date:** 2026-02-23  
**Architect:** Isreal Okoro (mrfundzman)

---

## 📋 OVERVIEW

The **DOORKEEPER PROTOCOL** backend implementation establishes the Sentinel as the **SINGLE SOURCE OF TRUTH** for all vitalization logic. The frontend is now a "stateless doorkeeper" that only collects and forwards data.

---

## ✅ COMPLETED TASKS

### **1. Created New Vitalization Endpoint** ✅

**File:** `backend/src/routes/vitalize.ts`

**Endpoint:** `POST /vitalize/register` (DOORKEEPER PROTOCOL)

**Purpose:** THE SINGLE SOURCE OF TRUTH for vitalization

**Flow:**
1. Receive 4-pillar biometric data from frontend
2. Validate biometric data (face hash, device ID, geolocation)
3. Check if user exists in `user_profiles`
4. Check if already vitalized
5. Generate PFF ID (e.g., `PFF-A1B2C3D4`)
6. Execute 5-5-1 VIDA distribution:
   - 5 VIDA to Citizen (spendable)
   - 5 VIDA to National Treasury (locked)
   - 1 VIDA to PFF Foundation (locked)
7. Update `user_profiles` with vitalization data
8. Update treasury and foundation balances in `sovereign_internal_wallets`
9. Log vitalization event in `vitalization_log`
10. Return success response to frontend

**Request Body:**
```json
{
  "phoneNumber": "+2348012345678",
  "sovereignId": "SOV-12345678",
  "biometricData": {
    "faceHash": "sha256_hash_of_face_data",
    "palmHash": "sha256_hash_of_palm_data",
    "deviceId": "device_uuid",
    "geolocation": {
      "latitude": 6.5244,
      "longitude": 3.3792,
      "accuracy": 10
    }
  },
  "walletAddress": "0x1234..."
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "vitalizationStatus": "VITALIZED",
    "vitalizedAt": "2026-02-23T12:00:00Z",
    "pffId": "PFF-A1B2C3D4",
    "vidaDistribution": {
      "citizen": 5.0,
      "treasury": 5.0,
      "foundation": 1.0,
      "total": 11.0
    },
    "transactionHash": "sha256_hash"
  }
}
```

**Error Responses:**
- `400 MISSING_FIELDS` - Missing required fields
- `400 MISSING_BIOMETRIC_DATA` - Missing biometric data
- `404 USER_NOT_FOUND` - User profile not found
- `400 ALREADY_VITALIZED` - User already vitalized
- `500 VITALIZATION_FAILED` - Internal error

---

### **2. Renamed Legacy Endpoint** ✅

**Old:** `POST /vitalize/register` (hardware anchor approach)  
**New:** `POST /vitalize/legacy-register` (deprecated)

This preserves backward compatibility while establishing the new DOORKEEPER PROTOCOL endpoint.

---

### **3. Created Helper Functions** ✅

**`updateTreasuryBalance(amount: number)`**
- Updates National Treasury VIDA balance in `sovereign_internal_wallets`
- Creates wallet if doesn't exist
- Increments balance atomically

**`updateFoundationBalance(amount: number)`**
- Updates PFF Foundation VIDA balance in `sovereign_internal_wallets`
- Creates wallet if doesn't exist
- Increments balance atomically

**`logVitalizationEvent(...)`**
- Logs complete vitalization event to `vitalization_log` table
- Includes: phone number, sovereign ID, PFF ID, biometric hashes, VIDA distribution, transaction hash
- Status: SUCCESS (errors logged separately)

---

### **4. Created Database Migration** ✅

**File:** `supabase/migrations/20260283000000_vitalization_log_add_columns.sql`

**Changes:**
- Added `pff_id TEXT` column
- Added `device_id TEXT` column
- Added `total_vida NUMERIC(18, 2)` column (default 11.00)
- Created indexes on `pff_id` and `device_id` for fast lookups

---

## 🗄️ DATABASE TABLES USED

### **`user_profiles`** (Modified)
- `vitalization_status` - Set to 'VITALIZED'
- `vitalized_at` - Timestamp of vitalization
- `vitalization_tx_hash` - Transaction hash
- `face_hash` - Biometric face hash
- `device_id` - Device ID
- `spendable_vida` - Set to 5.0 (citizen share)
- `pff_id` - Generated PFF ID
- `is_minted` - Set to true
- `humanity_score` - Set to 1.0

### **`sovereign_internal_wallets`** (Updated)
- `phone_number: 'NATIONAL_TREASURY'` - Treasury balance
- `phone_number: 'PFF_FOUNDATION'` - Foundation balance
- `vida_cap_balance` - Incremented by respective amounts

### **`vitalization_log`** (Inserted)
- Complete audit trail of vitalization event
- Includes all biometric data, VIDA distribution, and transaction hash

---

## 🔐 SECURITY & VALIDATION

1. **Input Validation:** All required fields checked
2. **Duplicate Prevention:** Checks if user already vitalized
3. **User Existence:** Verifies user profile exists before vitalization
4. **Atomic Updates:** Database transactions ensure consistency
5. **Audit Trail:** Complete logging of all vitalization events
6. **Error Handling:** Comprehensive error responses with codes

---

## 📊 ECONOMIC CONFIGURATION

Uses `backend/src/config.ts` economic configuration:

```typescript
economic: {
  citizenVaultVida: 5.0,
  nationalTreasuryVida: 5.0,
  foundationVaultVida: 1.0,
  totalVidaPerVitalization: 11.0
}
```

---

## 🚀 NEXT STEPS

### **Pending Tasks:**

1. **Create Pillar Save Endpoints** ⏳
   - `POST /pillars/save-at-75` - Save pillars at 75% completion
   - `POST /pillars/save-all` - Save complete 4-pillar data

2. **Update Frontend UI Components** ⏳
   - Update Welcome flow to use `sentinelClient.executeVitalization()`
   - Update Badge components to read from Sentinel responses
   - Remove any remaining business logic from UI

3. **Test End-to-End Flow** ⏳
   - Test vitalization flow from frontend to backend
   - Verify VIDA distribution
   - Verify database updates
   - Verify audit logging

4. **Deploy Backend** ⏳
   - Deploy Sentinel backend with new endpoints
   - Update frontend `NEXT_PUBLIC_PFF_BACKEND_URL` to point to deployed backend
   - Run database migrations

---

## 📝 IMPLEMENTATION NOTES

- **Database-Driven:** Phase 1 uses database for VIDA tracking (no blockchain transactions yet)
- **Transaction Hash:** Generated using SHA-256 hash (mock for Phase 1)
- **Blockchain Integration:** Deferred to Phase 2
- **Backward Compatibility:** Legacy endpoint preserved as `/vitalize/legacy-register`

---

**✅ DOORKEEPER PROTOCOL BACKEND - PHASE 1 COMPLETE**

The Sentinel is now the SINGLE SOURCE OF TRUTH for vitalization logic. Frontend is a stateless doorkeeper. 🚪🔐


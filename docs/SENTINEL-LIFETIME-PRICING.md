# 🛡️ SENTINEL LIFETIME PRICING & HANDSHAKE PROTOCOL

**Lifetime Price Fix: $10.00 USD**  
**Architect:** Isreal Okoro (mrfundzman)  
**Status:** ✅ **IMPLEMENTATION COMPLETE**

---

## 📋 Overview

The Sentinel Lifetime Pricing Protocol implements a **one-time $10 USD payment** for lifetime Sentinel access with hardware-bound security tokens. The payment is **gated by handshake success** - no payment can be taken if the liveness check or any handshake layer fails.

### The Five Pillars

1. **Lifetime Price Fix** — $10.00 USD (converted to VIDA using SOVRYN Oracle)
2. **No Subscription Logic** — Lifetime/Infinite access (expiryDate = NULL)
3. **Hardware-Bound Token** — MASTER_SECURITY_TOKEN bound to specific device
4. **45-10-45 Split** — Fee distribution (45% Citizen, 10% Nation, 45% Sentinel Reserve)
5. **Payment Gating** — Payment ONLY triggers after 100% successful 4-layer handshake

---

## 💰 Pricing Structure

### Fixed Price
- **Activation Fee:** $10.00 USD (Fixed)
- **Converted to VIDA:** Real-time conversion using SOVRYN Oracle
- **No Subscription:** One-time payment, lifetime access
- **No Expiration:** Token validity = NULL (Infinite)

### 45-10-45 Fee Split

| Recipient | Percentage | Purpose |
|-----------|------------|---------|
| **Citizen Vault** | 45% ($4.50) | Refundable security deposit |
| **National Reserve** | 10% ($1.00) | Network fee |
| **Sentinel Reserve** | 45% ($4.50) | System-level security fund |

**Example:**
- $10 USD = 0.01 VIDA (at $1,000 VIDA/USD)
- Citizen Vault: 0.0045 VIDA ($4.50)
- National Reserve: 0.001 VIDA ($1.00)
- Sentinel Reserve: 0.0045 VIDA ($4.50)

---

## 🔗 SOVRYN Oracle Integration

### Real-Time Price Conversion

The system uses SOVRYN Oracle to convert $10 USD to VIDA at the moment of handshake:

```typescript
// Get real-time VIDA/USD price from SOVRYN Oracle
const feeConversion = await getSentinelActivationFeeInVIDA(10.0);

// Returns:
{
  usdAmount: 10.0,
  vidaAmount: 0.01,           // Converted amount
  vidaAmountNano: 10000000,   // ngVIDA
  vidaAmountGiga: 0.00000001, // ghVIDA
  oraclePrice: 1000.0,        // VIDA/USD price
  timestamp: 1706745600000
}
```

### Oracle Fallback

If SOVRYN Oracle is unavailable, the system falls back to VIDA Cap base price ($1,000 USD):

```typescript
// Fallback to VIDA Cap base price
vidaUsdPrice: 1000.0  // $1,000 USD per VIDA
```

---

## 🔐 Hardware-Bound Token

### MASTER_SECURITY_TOKEN Structure

```typescript
{
  tokenId: string;              // 64-char hex
  citizenId: string;
  pffId: string;
  sentinelDaemonId: string;
  deviceId: string;             // Hardware-bound to specific device
  deviceFingerprint: string;    // Unique hardware fingerprint
  issuedAt: Date;
  expiresAt: null,              // NULL = Lifetime/Infinite
  encryptedPayload: string;     // Hardware security keys
  signature: string;
  hardwareBound: true           // Always true
}
```

### Device Fingerprint Generation

The device fingerprint is generated from:
- Device ID
- Platform OS (iOS, Android, etc.)
- Platform version
- Architecture (arm64, x86_64, etc.)
- Secure enclave attestation

```typescript
const fingerprintData = `${deviceId}-${os}-${version}-${architecture}-${attestation}`;
const deviceFingerprint = SHA256(fingerprintData);
```

**This prevents the token from being moved to another device.**

---

## ⚡ Payment Gating Logic

### Critical Rule: Payment ONLY After 100% Successful Handshake

The payment is **gated** by handshake success. The flow is:

1. **Execute 4-Layer Handshake**
   - Layer 1: Identity Verification
   - Layer 2: Payment Verification (validates $10 USD amount)
   - Layer 3: Hardware Attestation
   - Layer 4: Daemon Handshake

2. **IF Handshake Succeeds (100%)**
   - ✅ Execute $10 USD payment
   - ✅ Apply 45-10-45 split
   - ✅ Generate hardware-bound token
   - ✅ Hand over to Sentinel Daemon

3. **IF Handshake Fails (Any Layer)**
   - ❌ NO payment taken
   - ❌ NO token generated
   - ❌ Gate returns to CLOSED
   - ❌ Citizen can retry

### Code Implementation

```typescript
// Execute 4-layer handshake FIRST
const handshakeResult = await executeSentinelBindingHandshake(...);

// If handshake fails, return immediately WITHOUT taking payment
if (!handshakeResult.success) {
  return {
    success: false,
    error: handshakeResult.error,
    // NO PAYMENT TAKEN
  };
}

// ONLY IF handshake succeeds: Execute payment
const paymentResult = await executeSentinelPayment(citizenId, pffId);
```

---

## 🔄 Sovereign Handoff Flow

### Complete Activation Flow

```
1. Citizen Requests Activation
   ↓
2. Gate Opens (REQUESTED)
   ↓
3. Execute 4-Layer Handshake
   ├─ Layer 1: Identity Verification ✓
   ├─ Layer 2: Payment Verification ✓
   ├─ Layer 3: Hardware Attestation ✓
   └─ Layer 4: Daemon Handshake ✓
   ↓
4. IF Handshake 100% Success:
   ├─ Execute $10 USD Payment
   ├─ Apply 45-10-45 Split
   ├─ Generate Hardware-Bound Token (Lifetime)
   ├─ Hand Over to Sentinel Daemon
   └─ Send LifeOS Callback
   ↓
5. Gate Status: ACTIVE (Lifetime)
```

### Failure Scenarios

| Failure Point | Payment Taken? | Token Generated? | Retry Allowed? |
|---------------|----------------|------------------|----------------|
| Layer 1 Fails | ❌ NO | ❌ NO | ✅ YES |
| Layer 2 Fails | ❌ NO | ❌ NO | ✅ YES |
| Layer 3 Fails | ❌ NO | ❌ NO | ✅ YES |
| Layer 4 Fails | ❌ NO | ❌ NO | ✅ YES |
| Payment Fails | ❌ NO | ❌ NO | ✅ YES |
| Handover Fails | ✅ YES | ⚠️ PARTIAL | ⚠️ CONTACT SUPPORT |

---

## 📁 Files Created/Updated (7 Total)

### Core Logic (2 files updated)
✅ **`core/sentinelOptIn.ts`** (UPDATED)
- Changed `SENTINEL_ACTIVATION_BURN_AMOUNT` to `SENTINEL_ACTIVATION_FEE_USD = 10.0`
- Added 45-10-45 split constants (`SENTINEL_FEE_SPLIT_CITIZEN`, `SENTINEL_FEE_SPLIT_NATIONAL`, `SENTINEL_FEE_SPLIT_SENTINEL_RESERVE`)
- Changed `MASTER_SECURITY_TOKEN_VALIDITY_MS` to `null` (Lifetime)
- Updated `MasterSecurityToken` interface with `deviceId`, `deviceFingerprint`, `hardwareBound`
- Updated `SentinelBindingLayer2` to `PAYMENT_VERIFICATION` with `feeAmountUSD`, `feeAmountVIDA`, `oraclePrice`

✅ **`core/sentinelBindingEngine.ts`** (UPDATED)
- Updated `validateLayer2()` to verify $10 USD payment instead of token burn
- Updated `generateMasterSecurityToken()` to include device binding parameters and lifetime validity

### Backend Implementation (4 files created/updated)
✅ **`backend/src/sentinel/sovrynOracle.ts`** (NEW - 150 lines)
- SOVRYN Oracle integration for real-time VIDA/USD price
- `getVIDAUSDPrice()` - Get current VIDA price from oracle
- `convertUSDToVIDA()` - Convert USD to VIDA with real-time price
- `getSentinelActivationFeeInVIDA()` - Get $10 fee in VIDA
- `verifyPaymentAmount()` - Verify payment with 1% tolerance
- Fallback to VIDA Cap base price ($1,000 USD) if oracle unavailable

✅ **`backend/src/sentinel/tokenBurn.ts`** (UPDATED - renamed to payment logic)
- Renamed `executeSentinelTokenBurn()` to `executeSentinelPayment()`
- Implements $10 USD payment with 45-10-45 split
- Uses SOVRYN Oracle for real-time conversion
- Logs to `citizen_vaults`, `national_reserve`, `sentinel_reserve`
- Returns payment details including oracle price

✅ **`backend/src/sentinel/hardwareHandover.ts`** (UPDATED)
- Added `generateHardwareFingerprint()` function (SHA-256 hash of device info)
- Updated `generateEncryptedPayload()` to include device binding
- Updated `executeHardwareHandover()` to accept `deviceId` and `secureEnclaveAttestation`
- Stores `device_id` and `device_fingerprint` in database

✅ **`backend/src/sentinel/sovereignHandoff.ts`** (NEW - 200 lines)
- `executeSovereignHandoff()` - Complete activation flow with payment gating
- **CRITICAL:** Executes handshake FIRST, payment ONLY if handshake succeeds
- Generates hardware-bound token with lifetime validity
- Hands over to Sentinel Daemon
- Sends LifeOS callback
- Returns comprehensive result with payment details

### Backend Routes (1 file updated)
✅ **`backend/src/routes/sentinel.ts`** (UPDATED)
- Updated `POST /sentinel/verify-binding` to use `executeSovereignHandoff()`
- Added `deviceId` and `secureEnclaveAttestation` parameters
- Returns payment details (`feeAmountUSD`, `feeAmountVIDA`, `oraclePrice`)
- Implements payment gating (no payment if handshake fails)

### Documentation (1 file created)
✅ **`docs/SENTINEL-LIFETIME-PRICING.md`** (NEW - 400+ lines)
- Complete technical documentation
- Pricing structure and 45-10-45 split explanation
- SOVRYN Oracle integration details
- Hardware-bound token specification
- Payment gating logic
- Sovereign handoff flow
- API reference
- Failure scenarios

---

## 🚀 API Reference

### POST /sentinel/verify-binding

**Description:** Execute Sovereign Handoff with payment gating

**Auth:** Presence Token required

**Request:**
```json
{
  "handshakePayload": {
    "sessionId": "sentinel-1234567890-abc12345",
    "layer1": { ... },
    "layer2": {
      "type": "PAYMENT_VERIFICATION",
      "feeAmountUSD": 10.0,
      "feeAmountVIDA": 0.01,
      "paymentTransactionHash": "0x...",
      "sovrynChainId": 30,
      "oraclePrice": 1000.0,
      "timestamp": 1706745600000
    },
    "layer3": { ... },
    "layer4": { ... },
    "totalDuration": 1850
  },
  "daemonInfo": {
    "daemonId": "...",
    "daemonPublicKey": "...",
    "encryptedChannel": "...",
    "platformInfo": {
      "os": "iOS",
      "version": "17.2",
      "architecture": "arm64"
    }
  },
  "deviceId": "...",
  "secureEnclaveAttestation": "..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "sessionId": "sentinel-1234567890-abc12345",
  "masterSecurityToken": "a1b2c3d4...",
  "sentinelDaemonId": "...",
  "paymentTransactionHash": "0x...",
  "feeAmountUSD": 10.0,
  "feeAmountVIDA": 0.01,
  "oraclePrice": 1000.0,
  "encryptedChannel": "...",
  "totalDuration": 1850
}
```

**Response (Handshake Failure - NO PAYMENT TAKEN):**
```json
{
  "success": false,
  "error": "Identity verification failed",
  "code": "IDENTITY_VERIFICATION_FAILED",
  "layer": "LAYER_1"
}
```

---

## 🎯 Summary

**Status:** ✅ **IMPLEMENTATION COMPLETE**

**What's Done:**
- ✅ $10 USD fixed price with SOVRYN Oracle conversion
- ✅ Lifetime access (expiryDate = NULL)
- ✅ Hardware-bound MASTER_SECURITY_TOKEN
- ✅ 45-10-45 fee split
- ✅ Payment gating (ONLY after 100% successful handshake)
- ✅ `executeSovereignHandoff()` function
- ✅ Complete documentation

**Key Features:**
- 💰 One-time $10 USD payment (no subscription)
- ♾️ Lifetime access (no expiration)
- 🔒 Hardware-bound token (cannot be moved to another device)
- ⚡ Payment gated by handshake success
- 🛡️ Zero payment if liveness check fails

---

**🛡️ The Sovereign Handoff Protocol is ready for deployment.**  
**$10 USD. Lifetime access. Hardware-bound. Payment gated by success.**



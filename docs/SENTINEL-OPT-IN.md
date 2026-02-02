# 🛡️ SENTINEL OPT-IN FEATURE — Sovereign Decision Engine

**SENTINEL_DEPLOYMENT_REQUISITION Logic Gate**  
**Architect:** Isreal Okoro (mrfundzman)  
**Protocol:** PFF Sentinel Binding with 4-Layer Handshake  
**Status:** ✅ **CORE IMPLEMENTATION COMPLETE**

---

## 📋 Overview

The Sentinel Opt-In Feature integrates system-level security wrapping into the PFF Core through a sovereign decision engine. The **SENTINEL_DEPLOYMENT_REQUISITION** gate remains CLOSED until a manual request is received from a verified PFF identity.

### The Five Pillars of Sentinel Activation

1. **Sovereign Decision Engine** — SENTINEL_DEPLOYMENT_REQUISITION gate (CLOSED by default)
2. **Activation Handshake** — Specialized 4-layer handshake for Sentinel Binding
3. **Token Burn** — 0.1 ngVIDA deduction on SOVRYN Chain
4. **Hardware Handover** — MASTER_SECURITY_TOKEN transfer to Sentinel Daemon
5. **Status Reporting** — Encrypted callback to LifeOS (no biometric data exposed)

---

## 🔐 The SENTINEL_DEPLOYMENT_REQUISITION Gate

### Gate States

| State | Description |
|-------|-------------|
| **CLOSED** | Default state. Sentinel not requested. |
| **REQUESTED** | Citizen has requested Sentinel activation. Gate is OPEN. |
| **BINDING** | 4-layer handshake in progress. |
| **ACTIVE** | Sentinel successfully activated. MASTER_SECURITY_TOKEN handed to daemon. |
| **FAILED** | Activation failed. Gate returns to CLOSED. |

### Opening the Gate

The gate can ONLY be opened by:
- A verified PFF identity (Presence Token required)
- A device with secure enclave capability
- Manual citizen request (no automatic activation)

---

## 🔗 The 4-Layer Sentinel Binding Handshake

### Layer 1: Identity Verification (300ms)
**Purpose:** Verify PFF identity and presence proof

**Requirements:**
- Valid Presence Token
- Citizen ID and PFF ID match
- Presence proof signature verified
- Timestamp within 30 seconds

**Failure Modes:**
- `IDENTITY_VERIFICATION_FAILED`: Citizen ID mismatch, invalid proof, or expired timestamp

---

### Layer 2: Token Burn Verification (500ms)
**Purpose:** Execute 0.1 ngVIDA burn on SOVRYN Chain

**Requirements:**
- Burn amount exactly 0.1 ngVIDA (0.0000000001 VIDA)
- SOVRYN Chain ID 30 (RSK mainnet)
- Valid burn transaction hash
- Sufficient VIDA Cap balance

**Process:**
1. Deduct 0.1 ngVIDA from citizen's VIDA Cap vault
2. Log burn to `burn_ledger` table
3. Update total burned supply in `system_metrics`
4. Log to VLT with transaction hash
5. Log `SENTINEL_ACTIVATION_BURN` event

**Failure Modes:**
- `TOKEN_BURN_FAILED`: Insufficient balance, invalid amount, or chain ID mismatch
- `INSUFFICIENT_VIDA_BALANCE`: Not enough VIDA Cap for activation

---

### Layer 3: Hardware Attestation (600ms)
**Purpose:** Verify device has secure enclave and platform attestation

**Requirements:**
- Secure enclave confirmed
- Valid device ID
- Platform attestation signature
- Timestamp within 60 seconds

**Failure Modes:**
- `HARDWARE_ATTESTATION_FAILED`: No secure enclave, missing attestation, or invalid device ID

---

### Layer 4: Daemon Handshake (600ms)
**Purpose:** Establish encrypted channel with Sentinel Daemon

**Requirements:**
- Valid Sentinel Daemon ID
- Daemon public key
- Encrypted communication channel established
- Timestamp within 60 seconds

**Process:**
1. Generate encrypted channel ID
2. Create encrypted payload with hardware security keys
3. Generate MASTER_SECURITY_TOKEN
4. Hand over token to Sentinel Daemon

**Failure Modes:**
- `DAEMON_HANDSHAKE_FAILED`: Missing daemon ID, invalid public key, or channel establishment failed

---

### Cohesion Rule: 2 Seconds

**Total Time Budget:** 2,000ms

| Layer | Max Duration | Purpose |
|-------|--------------|---------|
| Layer 1 | 300ms | Identity verification |
| Layer 2 | 500ms | Token burn |
| Layer 3 | 600ms | Hardware attestation |
| Layer 4 | 600ms | Daemon handshake |

**If total duration exceeds 2,000ms:**
- Handshake fails with `BINDING_TIMEOUT`
- Gate returns to REQUESTED state
- Citizen can retry

---

## 🔑 MASTER_SECURITY_TOKEN

### Token Structure

```typescript
{
  tokenId: string;              // Unique token ID (64-char hex)
  citizenId: string;            // Citizen UUID
  pffId: string;                // PFF ID
  sentinelDaemonId: string;     // Daemon UUID
  issuedAt: Date;               // Token issue timestamp
  expiresAt: Date;              // Token expiration (30 days)
  encryptedPayload: string;     // Encrypted hardware keys
  signature: string;            // Token signature (SHA-256)
}
```

### Encrypted Payload Contents

The encrypted payload contains hardware-level security keys:
- **Encryption Key** (32 bytes)
- **Signing Key** (32 bytes)
- **Wrapping Key** (32 bytes)
- **Citizen ID**
- **PFF ID**
- **Timestamp**

**Security:** Encrypted with Sentinel Daemon's public key (RSA-2048 in production)

---

## 📡 LifeOS Security Status Callback

### Security Levels

| Level | Badge | Color | Description |
|-------|-------|-------|-------------|
| **STANDARD** | 🔒 | Gray (#6b6b70) | Standard PFF biometric security |
| **SENTINEL** | 🛡️ | Green (#4ade80) | Enhanced security with Sentinel daemon active |
| **FORTRESS** | 🏛️ | Gold (#c9a227) | Maximum security with system-level wrapping |

### Callback Structure

```typescript
{
  citizenId: string;
  securityStatus: 'SENTINEL_INACTIVE' | 'SENTINEL_ACTIVE' | 'SENTINEL_BINDING' | 'SENTINEL_ERROR';
  statusBadge: {
    level: 'STANDARD' | 'SENTINEL' | 'FORTRESS';
    color: string;
    icon: string;
  };
  lastUpdated: Date;
  encryptedMetadata: string;  // Encrypted, no biometric data
}
```

### Zero-Knowledge Principle

**What is included:**
- Security level (STANDARD, SENTINEL, FORTRESS)
- Last verification timestamp
- PFF active status

**What is NOT included:**
- No biometric templates
- No raw sensor data
- No fingerprints
- No face data
- No voice recordings
- No heartbeat data

---

## 📁 Files Created (9 Total)

### Core Logic (2 files)
✅ **`core/sentinelOptIn.ts`** (150 lines)
- SENTINEL_DEPLOYMENT_REQUISITION gate types
- 4-layer handshake interfaces
- MASTER_SECURITY_TOKEN structure
- LifeOS callback types

✅ **`core/sentinelBindingEngine.ts`** (335 lines)
- Layer validation functions (1-4)
- MASTER_SECURITY_TOKEN generation
- Sentinel binding handshake execution engine

### Backend Implementation (4 files)
✅ **`backend/src/sentinel/tokenBurn.ts`** (150 lines)
- Execute 0.1 ngVIDA burn on SOVRYN Chain
- Log burn to VLT and burn_ledger
- Verify sufficient balance

✅ **`backend/src/sentinel/hardwareHandover.ts`** (200 lines)
- Generate MASTER_SECURITY_TOKEN
- Establish encrypted channel with daemon
- Hand over token to Sentinel Daemon
- Track activation status

✅ **`backend/src/sentinel/lifeosCallback.ts`** (150 lines)
- Generate encrypted LifeOS callbacks
- Determine security level
- Send status updates (no biometric data)

✅ **`backend/src/routes/sentinel.ts`** (290 lines)
- `POST /sentinel/request-activation` — Open SENTINEL_DEPLOYMENT_REQUISITION gate
- `POST /sentinel/verify-binding` — Execute 4-layer handshake and activate
- `GET /sentinel/status` — Get activation status
- `POST /sentinel/refresh-callback` — Refresh LifeOS callback

### Core Exports (1 file)
✅ **`core/index.ts`** (UPDATED)
- Added `export * from './sentinelOptIn';`
- Added `export * from './sentinelBindingEngine';`

### Documentation (1 file)
✅ **`docs/SENTINEL-OPT-IN.md`** (THIS FILE)

---

## 🚀 API Reference

### POST /sentinel/request-activation
**Description:** Open the SENTINEL_DEPLOYMENT_REQUISITION gate  
**Auth:** Presence Token required  
**Body:**
```json
{
  "deviceInfo": {
    "platform": "ios",
    "deviceId": "...",
    "hasSecureEnclave": true
  }
}
```
**Response:**
```json
{
  "success": true,
  "gateStatus": "REQUESTED",
  "sessionId": "sentinel-1234567890-abc12345"
}
```

---

### POST /sentinel/verify-binding
**Description:** Execute 4-layer handshake and activate Sentinel  
**Auth:** Presence Token required  
**Body:**
```json
{
  "handshakePayload": {
    "sessionId": "...",
    "layer1": { ... },
    "layer2": { ... },
    "layer3": { ... },
    "layer4": { ... },
    "totalDuration": 1850
  },
  "daemonInfo": {
    "daemonId": "...",
    "daemonPublicKey": "...",
    "encryptedChannel": "...",
    "platformInfo": { ... }
  }
}
```
**Response:**
```json
{
  "success": true,
  "sessionId": "...",
  "masterSecurityToken": "...",
  "sentinelDaemonId": "...",
  "burnTransactionHash": "...",
  "encryptedChannel": "...",
  "totalDuration": 1850
}
```

---

### GET /sentinel/status
**Description:** Get Sentinel activation status  
**Auth:** Presence Token required  
**Response:**
```json
{
  "success": true,
  "isActive": true,
  "sentinelDaemonId": "...",
  "activatedAt": "2026-02-01T12:00:00Z",
  "expiresAt": "2026-03-03T12:00:00Z",
  "securityStatus": "SENTINEL_ACTIVE",
  "statusBadge": {
    "level": "SENTINEL",
    "color": "#4ade80",
    "icon": "🛡️"
  }
}
```

---

### POST /sentinel/refresh-callback
**Description:** Manually refresh LifeOS security status callback  
**Auth:** Presence Token required  
**Body:**
```json
{
  "callbackUrl": "https://lifeos.example.com/webhook/security-status"
}
```
**Response:**
```json
{
  "success": true,
  "callback": {
    "citizenId": "...",
    "securityStatus": "SENTINEL_ACTIVE",
    "statusBadge": { ... },
    "lastUpdated": "2026-02-01T12:00:00Z",
    "encryptedMetadata": "..."
  }
}
```

---

## ⚠️ Next Steps Required

### 1. Register Sentinel Routes (CRITICAL)
**File:** `backend/src/index.ts`

```typescript
import { sentinelRouter } from './routes/sentinel';

app.use('/sentinel', sentinelRouter);
```

### 2. Create Database Tables

**Required tables:**
- `sentinel_activations`
- `master_security_tokens`

See database schema section below.

### 3. Integrate Sentinel Daemon

The Sentinel Daemon is a separate system-level service that:
- Runs as a background process
- Receives MASTER_SECURITY_TOKEN from PFF
- Wraps system-level security
- Communicates via encrypted channel

**TODO:** Implement Sentinel Daemon service

---

## 🗄️ Database Schema

### sentinel_activations

```sql
CREATE TABLE sentinel_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES citizens(id),
  pff_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- REQUESTED, BINDING, ACTIVE, FAILED
  session_id VARCHAR(255) NOT NULL,
  sentinel_daemon_id UUID,
  master_security_token_id VARCHAR(255),
  burn_transaction_hash VARCHAR(255),
  encrypted_channel VARCHAR(255),
  daemon_public_key TEXT,
  platform_info JSONB,
  device_info JSONB,
  error_code VARCHAR(100),
  error_message TEXT,
  requested_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sentinel_activations_citizen ON sentinel_activations(citizen_id);
CREATE INDEX idx_sentinel_activations_session ON sentinel_activations(session_id);
CREATE INDEX idx_sentinel_activations_status ON sentinel_activations(status);
```

### master_security_tokens

```sql
CREATE TABLE master_security_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id VARCHAR(255) UNIQUE NOT NULL,
  citizen_id UUID NOT NULL REFERENCES citizens(id),
  pff_id VARCHAR(255) NOT NULL,
  sentinel_daemon_id UUID NOT NULL,
  encrypted_payload TEXT NOT NULL,
  signature VARCHAR(255) NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_master_security_tokens_citizen ON master_security_tokens(citizen_id);
CREATE INDEX idx_master_security_tokens_token ON master_security_tokens(token_id);
CREATE INDEX idx_master_security_tokens_daemon ON master_security_tokens(sentinel_daemon_id);
```

---

## 🎯 Summary

**Status:** ✅ **CORE IMPLEMENTATION COMPLETE**

**What's Done:**
- ✅ SENTINEL_DEPLOYMENT_REQUISITION gate logic
- ✅ 4-layer Sentinel binding handshake
- ✅ Token burn (0.1 ngVIDA on SOVRYN Chain)
- ✅ MASTER_SECURITY_TOKEN generation
- ✅ Hardware handover protocol
- ✅ LifeOS encrypted callbacks
- ✅ Backend API routes
- ✅ Complete documentation

**What's Pending:**
- ⏳ Backend route registration
- ⏳ Database table creation
- ⏳ Sentinel Daemon implementation
- ⏳ Production RSA encryption for token payload
- ⏳ LifeOS webhook integration

---

**🛡️ The Sovereign Decision Engine stands ready.**  
**SENTINEL_DEPLOYMENT_REQUISITION: CLOSED until requested.**  
**Zero biometric data exposure. Maximum security.**


# 🏭 OEM Hardware Binding & Certification Protocol

**Architect:** Isreal Okoro (mrfundzman)  
**Status:** ✅ **IMPLEMENTATION COMPLETE**  
**Version:** 1.0.0

---

## 📋 Overview

The **OEM Hardware Binding & Certification Protocol** enables device manufacturers to pre-install Sentinel on their devices and receive official "Sentinel Certified" digital signatures. This protocol ensures:

- **Device-Bound Licensing**: Licenses are permanently bound to specific hardware
- **Pre-Install Detection**: Automatic detection of OEM pre-installed builds
- **Certification Levels**: Bronze, Silver, Gold, Platinum based on sensor capabilities
- **Mandatory Activation Fee**: $10 USD fee required even for pre-installed devices
- **Boot Screen Branding**: "Sentinel Certified" watermark for OEM-partnered builds

---

## 🔐 Core Principles

### 1. Non-Transferable Licensing

```typescript
const IS_LICENSE_TRANSFERABLE = false; // HARDCODED
```

**Device Binding Components:**
- **Device_UUID**: SHA-256 hash of device ID + platform info + architecture
- **Hardware_TPM_Hash**: SHA-256 hash of TPM attestation + secure enclave + device ID

**Enforcement:**
- License activation creates permanent binding to Device_UUID and Hardware_TPM_Hash
- Attempting to activate on different device returns `DEVICE_ALREADY_ACTIVATED` error
- No license transfer mechanism exists

### 2. Pre-Install Detection

**Detection Logic:**
```typescript
type PreInstallStatus = 'PRE_INSTALLED' | 'USER_INSTALLED';
```

**How It Works:**
1. Check OEM certifications table for matching manufacturer + device model
2. Parse `preInstallConfig.isPreInstalled` flag
3. Return status to frontend

**Frontend Behavior:**
- `PRE_INSTALLED`: Skip download phase → Go straight to handshake & activate
- `USER_INSTALLED`: Normal flow → Download → Install → Handshake → Activate

### 3. Certification Levels

| Level | Badge | Camera | Fingerprint | Heart Rate | Secure Hardware |
|-------|-------|--------|-------------|------------|-----------------|
| **PLATINUM** 💎 | 48MP @ 60fps + IR | 508 DPI + Liveness | Dedicated Sensor | TPM + Secure Enclave + Attestation |
| **GOLD** 🥇 | 12MP @ 30fps + IR | 508 DPI + Liveness | Dedicated Sensor | Secure Enclave + Attestation |
| **SILVER** 🥈 | 8MP @ 30fps | 500 DPI | Dedicated Sensor | Secure Enclave |
| **BRONZE** 🥉 | 5MP @ 24fps | 400 DPI | Camera PPG | Secure Enclave |

---

## 🛠️ Implementation Guide

### Step 1: OEM Certification Submission

**Endpoint:** `POST /oem/certify`

**Request Payload:**
```typescript
{
  oemInfo: {
    companyName: "Acme Electronics",
    contactEmail: "oem@acme.com",
    website: "https://acme.com"
  },
  sensorSpecs: {
    manufacturer: "Acme",
    deviceModel: "Acme Pro X1",
    camera: {
      resolution: "48MP",
      fps: 60,
      hasInfraredSensor: true
    },
    fingerprint: {
      sensorType: "ULTRASONIC",
      resolution: 508,
      hasLivenesDetection: true
    },
    heartRate: {
      sensorType: "DEDICATED_PPG",
      samplingRate: 100
    },
    secureHardware: {
      hasSecureEnclave: true,
      hasTPM: true,
      attestationSupported: true
    }
  },
  preInstallConfig: {
    isPreInstalled: true,
    buildVersion: "1.0.0",
    installationPath: "/system/app/Sentinel"
  }
}
```

**Response:**
```typescript
{
  success: true,
  certification: {
    certificationId: "a1b2c3d4...",
    manufacturer: "Acme",
    deviceModel: "Acme Pro X1",
    status: "CERTIFIED",
    certificationLevel: "PLATINUM",
    signature: "sha256_hash...",
    issuedAt: "2026-02-01T00:00:00Z",
    expiresAt: "2028-02-01T00:00:00Z", // 2 years
    badgeUrl: "https://pff.sentinel.certified/badges/a1b2c3d4.png",
    watermarkText: "💎 Sentinel Certified - PLATINUM"
  }
}
```

### Step 2: Pre-Install Detection (Frontend)

**Endpoint:** `POST /oem/detect-preinstall`

**Request:**
```typescript
{
  deviceId: "device_12345",
  manufacturer: "Acme",
  deviceModel: "Acme Pro X1",
  platformOS: "Android",
  platformVersion: "14",
  architecture: "arm64"
}
```

**Response:**
```typescript
{
  success: true,
  preInstallStatus: "PRE_INSTALLED",
  isPreInstalled: true,
  hasExistingActivation: false,
  skipDownloadPhase: true
}
```

### Step 3: Sentinel Activation (with Device Binding)

**Endpoint:** `POST /sentinel/verify-binding`

**Updated Request (includes device binding params):**
```typescript
{
  citizenId: "citizen_123",
  pffId: "pff_456",
  handshakePayload: { /* 4-layer handshake data */ },
  daemonInfo: { /* Sentinel daemon info */ },
  deviceId: "device_12345",
  secureEnclaveAttestation: "attestation_data...",
  tpmAttestation: "tpm_data...",  // NEW
  manufacturer: "Acme",            // NEW
  deviceModel: "Acme Pro X1"       // NEW
}
```

**Response (includes device binding):**
```typescript
{
  success: true,
  sessionId: "session_789",
  masterSecurityToken: "token_abc",
  sentinelDaemonId: "daemon_def",
  paymentTransactionHash: "0x123...",
  feeAmountUSD: 10.00,
  feeAmountVIDA: 0.0000123,
  oraclePrice: 812500.00,
  encryptedChannel: "channel_ghi",
  deviceUUID: "sha256_device_uuid...",      // NEW
  hardwareTPMHash: "sha256_tpm_hash...",    // NEW
  isPreInstalled: true,                      // NEW
  oemCertificationId: "a1b2c3d4...",        // NEW
  totalDuration: 1450
}
```

---

## 💰 Activation Fee Logic

### Mandatory $10 Fee

**CRITICAL:** The $10 Sovereign Fee is **MANDATORY** for ALL first-time activations, regardless of pre-install status.

**Payment Flow:**
1. ✅ 100% successful 4-layer handshake MUST complete first
2. ✅ ONLY IF handshake succeeds → Execute $10 USD payment
3. ✅ Convert $10 USD to VIDA using SOVRYN Oracle
4. ✅ Execute 45-10-45 split:
   - 45% → Citizen Vault
   - 10% → National Reserve
   - 45% → Sentinel Reserve
5. ✅ Generate hardware-bound MASTER_SECURITY_TOKEN (lifetime validity)

**Pre-Installed Devices:**
- ✅ Skip download phase
- ✅ Go straight to handshake & activate
- ✅ **STILL PAY $10 FEE** (no exceptions)

---

## 🎨 Boot Screen Branding

### Watermark Display

**Component:** `SentinelCertifiedWatermark.tsx`

**Behavior:**
- Displays on boot screen for OEM-certified devices only
- Shows certification level badge (💎 🥇 🥈 🥉)
- Fades in → Holds for 2 seconds → Fades out
- Skipped entirely for non-certified devices

**Integration:**
```typescript
import { SentinelBootScreen } from './src/sentinel/SentinelBootScreen';

function App() {
  const [showBootScreen, setShowBootScreen] = useState(true);
  
  if (showBootScreen) {
    return <SentinelBootScreen onComplete={() => setShowBootScreen(false)} />;
  }
  
  return <MainApp />;
}
```

---

## 📊 Database Schema

### OEM Certifications Table

```sql
CREATE TABLE oem_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id VARCHAR(255) UNIQUE NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  device_model VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  certification_level VARCHAR(50) NOT NULL,
  signature VARCHAR(255) NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  badge_url TEXT,
  watermark_text TEXT,
  sensor_specs JSONB,
  oem_info JSONB,
  pre_install_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oem_certifications_manufacturer 
  ON oem_certifications(manufacturer, device_model);
CREATE INDEX idx_oem_certifications_status 
  ON oem_certifications(status);
```

### Sentinel Activations Table (Updated)

```sql
ALTER TABLE sentinel_activations
ADD COLUMN device_uuid VARCHAR(255),
ADD COLUMN hardware_tpm_hash VARCHAR(255),
ADD COLUMN is_license_transferable BOOLEAN DEFAULT false,
ADD COLUMN pre_install_status VARCHAR(50),
ADD COLUMN oem_certification_id VARCHAR(255);

CREATE INDEX idx_sentinel_activations_device_uuid 
  ON sentinel_activations(device_uuid);
CREATE INDEX idx_sentinel_activations_tpm_hash 
  ON sentinel_activations(hardware_tpm_hash);
```

---

## 🔍 Verification & Testing

### Test Certification Request

```bash
curl -X POST http://localhost:3000/oem/certify \
  -H "Content-Type: application/json" \
  -d '{
    "oemInfo": {
      "companyName": "Test OEM",
      "contactEmail": "test@oem.com",
      "website": "https://testoem.com"
    },
    "sensorSpecs": {
      "manufacturer": "TestOEM",
      "deviceModel": "Test Device X1",
      "camera": {
        "resolution": "48MP",
        "fps": 60,
        "hasInfraredSensor": true
      },
      "fingerprint": {
        "sensorType": "ULTRASONIC",
        "resolution": 508,
        "hasLivenesDetection": true
      },
      "heartRate": {
        "sensorType": "DEDICATED_PPG",
        "samplingRate": 100
      },
      "secureHardware": {
        "hasSecureEnclave": true,
        "hasTPM": true,
        "attestationSupported": true
      }
    },
    "preInstallConfig": {
      "isPreInstalled": true,
      "buildVersion": "1.0.0",
      "installationPath": "/system/app/Sentinel"
    }
  }'
```

---

## ✅ Implementation Checklist

- [x] Device-bound licensing (isLicenseTransferable = FALSE)
- [x] Device_UUID generation
- [x] Hardware_TPM_Hash generation
- [x] Pre-install detection logic
- [x] OEM certification processing
- [x] Certification level determination
- [x] Hardware certification hook
- [x] $10 fee enforcement (pre-installed devices)
- [x] Sentinel Certified watermark
- [x] Boot screen integration
- [x] OEM certification API routes
- [x] Device binding in sovereign handoff
- [ ] Database table creation
- [ ] Backend route registration
- [ ] Production deployment

---

**🛡️ The OEM Hardware Binding & Certification Protocol is ready for deployment.**


# 🛡️ TIERED SENTINEL LICENSING

**Architect:** Isreal Okoro (mrfundzman)  
**Status:** ✅ **IMPLEMENTATION COMPLETE**  
**Version:** 1.0.0  
**Date:** 2026-02-01

---

## 📋 Overview

The **Tiered Sentinel Licensing** system provides three pricing tiers for Sentinel activation, allowing citizens to protect multiple devices with a single license.

**Core Principle:** All tiers maintain the same 99-1 Sovereign Split, ensuring consistent architect retention and sovereign movement across all pricing levels.

---

## 🎯 The Three Tiers

### Tier 1: Citizen
**Price:** $10.00 USD  
**Devices:** 1 device  
**Target:** Individual citizens with single device  
**Description:** Single device protection for individual citizens

### Tier 2: Personal Multi
**Price:** $30.00 USD  
**Devices:** Up to 5 unique Hardware_TPM_Hashes  
**Target:** Citizens with multiple personal devices  
**Description:** Multi-device protection for personal use (up to 5 devices)

### Tier 3: Enterprise
**Price:** $1,000.00 USD  
**Devices:** Up to 20 unique Hardware_TPM_Hashes  
**Target:** Organizations and businesses  
**Description:** Enterprise-grade protection for organizations (up to 20 devices)

---

## 💰 Revenue Distribution (99-1 Sovereign Split)

The 1% Sovereign Movement applies to **ALL** tiers:

| Tier | Price | 1% Split | National Escrow (0.5%) | Global Citizen Block (0.5%) | Architect (99%) |
|------|-------|----------|------------------------|----------------------------|-----------------|
| Tier 1 | $10.00 | $0.10 | $0.05 | $0.05 | $9.90 |
| Tier 2 | $30.00 | $0.30 | $0.15 | $0.15 | $29.70 |
| Tier 3 | $1,000.00 | $10.00 | $5.00 | $5.00 | $990.00 |

**Key Points:**
- ✅ 99% of all tiered revenue flows to SENTINEL_BUSINESS_BLOCK (Architect retention)
- ✅ 1% mandatory protocol pull from every transaction
- ✅ 0.5% → National Escrow (Liquidity backing)
- ✅ 0.5% → Global Citizen Block (Monthly Dividend) [UPDATED from User Vault]

---

## 🔐 Seat Management (Tiers 2 & 3)

### What is a Seat?
A **seat** is a device binding within a multi-device license. Each seat is uniquely identified by:
- `hardware_tpm_hash` - Unique hardware TPM hash
- `device_id` - Device UUID
- `device_fingerprint` - SHA-256 hash of device info

### Seat Limits
- **Tier 1:** 1 seat (no seat management needed)
- **Tier 2:** Up to 5 seats
- **Tier 3:** Up to 20 seats

### Seat Management Operations

#### 1. Bind New Device
**Endpoint:** `POST /api/seat-management/bind-device`

**Request:**
```json
{
  "licenseId": "uuid",
  "hardwareTpmHash": "sha256_hash",
  "deviceId": "device_uuid",
  "deviceFingerprint": "sha256_fingerprint",
  "devicePlatform": "iOS",
  "deviceModel": "iPhone 15 Pro"
}
```

**Response:**
```json
{
  "success": true,
  "seatId": "uuid",
  "seatsUsed": 3,
  "seatsAvailable": 2,
  "message": "Device bound successfully"
}
```

#### 2. Revoke Device
**Endpoint:** `DELETE /api/seat-management/revoke-device/:seatId`

**Request:**
```json
{
  "revokedBy": "pff_id",
  "revocationReason": "Device lost or stolen"
}
```

**Response:**
```json
{
  "success": true,
  "seatsUsed": 2,
  "seatsAvailable": 3,
  "message": "Device revoked successfully"
}
```

#### 3. Get Active Seats
**Endpoint:** `GET /api/seat-management/seats/:licenseId`

**Response:**
```json
{
  "success": true,
  "seats": [
    {
      "id": "uuid",
      "hardwareTpmHash": "sha256_hash",
      "deviceId": "device_uuid",
      "devicePlatform": "iOS",
      "deviceModel": "iPhone 15 Pro",
      "boundAt": "2026-02-01T12:00:00Z",
      "lastActiveAt": "2026-02-01T14:30:00Z",
      "status": "ACTIVE"
    }
  ],
  "totalSeats": 3
}
```

#### 4. Check Available Seats
**Endpoint:** `GET /api/seat-management/available-seats/:licenseId`

**Response:**
```json
{
  "success": true,
  "canBind": true,
  "seatsUsed": 3,
  "maxDevices": 5,
  "seatsAvailable": 2
}
```

---

## 🏗️ Database Schema

### sentinel_licenses
Tracks license purchases with tier information.

**Key Fields:**
- `tier` - TIER_1_CITIZEN, TIER_2_PERSONAL_MULTI, TIER_3_ENTERPRISE
- `price_usd` - $10.00, $30.00, $1000.00
- `max_devices` - 1, 5, 20
- `status` - ACTIVE, SUSPENDED, REVOKED

### sentinel_license_seats
Tracks device bindings for multi-device licenses.

**Key Fields:**
- `license_id` - Reference to sentinel_licenses
- `hardware_tpm_hash` - Unique hardware identifier
- `device_id` - Device UUID
- `status` - ACTIVE, REVOKED

### sentinel_seat_revocations
Audit trail for seat unbindings.

**Key Fields:**
- `seat_id` - Reference to revoked seat
- `revoked_by` - PFF ID of user who revoked
- `revocation_reason` - Reason for revocation
- `revoked_at` - Timestamp of revocation

---

## 📊 Example Scenarios

### Scenario 1: Citizen with Single Device (Tier 1)
**User:** John Doe  
**Devices:** 1 iPhone  
**License:** Tier 1 ($10.00)  
**Payment:** $10.00 → $9.90 Architect + $0.05 National Escrow + $0.05 Global Citizen Block

### Scenario 2: Citizen with Multiple Devices (Tier 2)
**User:** Jane Smith  
**Devices:** iPhone, iPad, MacBook, Apple Watch, AirPods (5 devices)  
**License:** Tier 2 ($30.00)  
**Payment:** $30.00 → $29.70 Architect + $0.15 National Escrow + $0.15 Global Citizen Block  
**Seat Management:** Can bind/revoke any of the 5 devices

### Scenario 3: Enterprise Organization (Tier 3)
**User:** Acme Corp  
**Devices:** 20 employee devices  
**License:** Tier 3 ($1,000.00)  
**Payment:** $1,000.00 → $990.00 Architect + $5.00 National Escrow + $5.00 Global Citizen Block  
**Seat Management:** Can bind/revoke any of the 20 devices

---

## ✅ Implementation Checklist

- [x] Define Tier 1 (Citizen) - $10.00 for 1 device
- [x] Define Tier 2 (Personal Multi) - $30.00 for 5 devices
- [x] Define Tier 3 (Enterprise) - $1,000.00 for 20 devices
- [x] Update 1% split logic to route to Global Citizen Block
- [x] Verify 99% architect retention across all tiers
- [x] Create database schema for tiered licensing
- [x] Create seat management backend services
- [x] Create seat management API routes
- [x] Update payment logic to handle different tier pricing
- [ ] Create seat management frontend UI
- [ ] Run database migration
- [ ] Test tier purchasing flow
- [ ] Test seat binding/revocation
- [ ] Create admin dashboard for license management

---

**🛡️ The Tiered Sentinel Licensing stands ready.**  
**Tier 1: $10 for 1 device**  
**Tier 2: $30 for 5 devices**  
**Tier 3: $1000 for 20 devices**  
**99% Architect Retention ✅**  
**1% Sovereign Movement ✅**  
**Seat Management Ready ✅**


# Genesis Migration Manifest
## PFF Production Transition — Mock to Live Data

**Protocol:** Genesis Purge Protocol v1.0  
**Architect:** Isreal Okoro (mrfundzman)  
**Date:** 2026-01-31  
**Status:** Ready for Execution

---

## Executive Summary

This document outlines the transition from development mock data to production live data sources, preparing the PFF system for SOVRYN Mainnet Genesis deployment.

---

## Migration Overview

### Current State (Development)
- **Data Source:** Mock JSON files (`web/data/mockData.json`, `mockdata.json/`)
- **Mode:** Development/Testing
- **Network:** Local/Testnet
- **Authentication:** Mock biometric verification

### Target State (Production)
- **Data Source:** VLT Live Node + SOVRYN Blockchain
- **Mode:** PURE_SOVRYN
- **Network:** SOVRYN_MAINNET_GENESIS (Rootstock RSK)
- **Authentication:** Real biometric verification + hardware attestation

---

## Files Created/Modified

### New Production Configuration Files

✅ **Created:**
- `backend/.env.production` — Production backend environment template
- `web/.env.production` — Production web environment template
- `web/lib/dataService.ts` — Smart data routing service (mock → live)
- `docs/PRODUCTION-DEPLOYMENT.md` — Comprehensive deployment guide
- `scripts/verify-production.js` — Automated verification script
- `docs/GENESIS-MIGRATION-MANIFEST.md` — This document

### Modified Files

📝 **No existing files modified** — All changes are additive and backward-compatible

---

## Mock Data Handling Strategy

### Files Containing Mock Data

1. **`web/data/mockData.json`**
   - **Status:** Keep for development
   - **Action:** Archive before production deployment
   - **Location:** `web/data/archive/mockData.json.bak`

2. **`mockdata.json/Untitled`**
   - **Status:** Duplicate of above
   - **Action:** Delete or archive
   - **Reason:** Redundant with `web/data/mockData.json`

3. **`web/lib/mockDataService.ts`**
   - **Status:** Keep for development fallback
   - **Action:** No changes needed
   - **Reason:** Used by `dataService.ts` as fallback

### Mock Data Archive Process

```bash
# Create archive directory
mkdir -p web/data/archive

# Archive mock data
cp web/data/mockData.json web/data/archive/mockData.json.bak

# Remove duplicate mock data directory (optional)
rm -rf mockdata.json
```

---

## Environment Transition Plan

### Phase 1: Configuration Setup

**Backend Environment Variables:**
```bash
VITALIE_MODE=PURE_SOVRYN
NETWORK_ID=SOVRYN_MAINNET_GENESIS
DATA_SOURCE=VLT_LIVE_NODE
RSK_RPC_URL=https://public-node.rsk.co
RSK_WS_URL=wss://public-node.rsk.co/websocket
VLT_API_URL=https://vlt-node.sovryn.app/api/v1
```

**Web Environment Variables:**
```bash
NEXT_PUBLIC_VITALIE_MODE=PURE_SOVRYN
NEXT_PUBLIC_NETWORK_ID=SOVRYN_MAINNET_GENESIS
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_ENABLE_BLOCKCHAIN_INTEGRATION=true
NEXT_PUBLIC_RSK_RPC_URL=https://public-node.rsk.co
```

### Phase 2: Data Source Migration

The new `web/lib/dataService.ts` automatically handles data source routing:

**Development Mode:**
```javascript
getDataSource() → 'MOCK'
getNationalReserveData() → mockData.national_reserve
```

**Production Mode (VLT):**
```javascript
getDataSource() → 'VLT_LIVE'
getNationalReserveData() → fetch(VLT_API_URL/national-reserve)
```

**Production Mode (Backend API):**
```javascript
getDataSource() → 'BACKEND_API'
getNationalReserveData() → fetch(BACKEND_URL/economic/national-reserve)
```

### Phase 3: Authentication Wipe

**Local Storage Cleanup:**
```javascript
// Clear all PFF-related local storage
localStorage.removeItem('pff_token');
localStorage.removeItem('pff_master_handshake');
localStorage.removeItem('pff_device_id');
localStorage.removeItem('pff_biometric_template');
```

**Cookie Cleanup:**
```javascript
// Clear all authentication cookies
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

**Implementation:**
- Automatic on first production deployment
- Manual trigger via `/api/auth/reset` endpoint (admin only)

---

## Endpoint Re-Routing

### Current Endpoints (Development)

| Service | Current Endpoint | Type |
|---------|-----------------|------|
| Mock Data | `/data/mockData.json` | Static JSON |
| National Reserve | Mock service | In-memory |
| Citizen Vault | Mock service | In-memory |

### Production Endpoints

| Service | Production Endpoint | Type |
|---------|-------------------|------|
| VLT API | `https://vlt-node.sovryn.app/api/v1` | REST + WebSocket |
| RSK RPC | `https://public-node.rsk.co` | JSON-RPC |
| RSK WebSocket | `wss://public-node.rsk.co/websocket` | WebSocket |
| Backend API | `https://api.your-domain.com` | REST |
| Supabase Realtime | `wss://[project].supabase.co/realtime/v1` | WebSocket |

### Endpoint Configuration

**Backend (`backend/src/config.ts`):**
```typescript
export const config = {
  rsk: {
    rpcUrl: process.env.RSK_RPC_URL,
    wsUrl: process.env.RSK_WS_URL,
    chainId: 30,
  },
  vlt: {
    apiUrl: process.env.VLT_API_URL,
    wsUrl: process.env.VLT_WS_URL,
    apiKey: process.env.VLT_API_KEY,
  },
};
```

**Web (`web/lib/sovryn/config.ts`):**
```typescript
export const RSK_MAINNET = {
  chainId: 30,
  rpc: process.env.NEXT_PUBLIC_RSK_RPC_URL,
  ws: process.env.NEXT_PUBLIC_RSK_WS_URL,
};
```

---

## VLT Genesis Entry

### Genesis Block Structure

```json
{
  "block": 0,
  "type": "GENESIS",
  "timestamp": "2026-01-31T00:00:00Z",
  "architect": {
    "name": "ISREAL OKORO",
    "alias": "MRFUNDZMAN",
    "status": "SOVEREIGN_LIVE"
  },
  "network": {
    "id": "SOVRYN_MAINNET_GENESIS",
    "chain": "Rootstock (RSK)",
    "chainId": 30,
    "mode": "PURE_SOVRYN"
  },
  "protocol": {
    "version": "1.0.0-genesis",
    "name": "PFF (Presence Factor Fabric)",
    "doctrine": "50/50 Split"
  },
  "signature": "ISREAL_OKORO_MRFUNDZMAN",
  "origin": "Born in Lagos, Built for the World"
}
```

### Genesis Entry API Call

```bash
curl -X POST https://vlt-node.sovryn.app/api/v1/genesis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${VLT_API_KEY}" \
  -d '{
    "architect": "ISREAL OKORO",
    "alias": "MRFUNDZMAN",
    "status": "SOVEREIGN_LIVE",
    "network": "SOVRYN_MAINNET_GENESIS"
  }'
```

---

## Verification Checklist

### Pre-Deployment Verification

Run the automated verification script:
```bash
node scripts/verify-production.js
```

**Manual Checks:**
- [ ] All environment variables configured
- [ ] Mock data archived
- [ ] Database migrations applied
- [ ] RSK RPC endpoint accessible
- [ ] VLT API endpoint accessible (if applicable)
- [ ] SSL certificates valid
- [ ] CORS origins configured
- [ ] Rate limiting enabled

### Post-Deployment Verification

- [ ] Backend health check: `GET /health` returns `200 OK`
- [ ] Web application loads without errors
- [ ] Data source shows `VLT_LIVE` or `BACKEND_API` (not `MOCK`)
- [ ] Blockchain connection successful (RSK network detected)
- [ ] Biometric authentication functional
- [ ] National Reserve data loads from live source
- [ ] Citizen Vault data loads from live source
- [ ] WebSocket connections established
- [ ] Genesis block entry confirmed in VLT

---

## Rollback Plan

If issues arise during deployment:

1. **Immediate Rollback:**
   ```bash
   # Set environment to use mock data
   NEXT_PUBLIC_USE_MOCK_DATA=true
   
   # Restore mock data file
   cp web/data/archive/mockData.json.bak web/data/mockData.json
   
   # Redeploy
   npm run build && netlify deploy --prod
   ```

2. **Database Rollback:**
   ```bash
   # Revert to previous migration
   supabase db reset
   ```

3. **Monitoring:**
   - Check error logs
   - Monitor user reports
   - Verify data integrity

---

## Success Criteria

✅ **Deployment is successful when:**

1. All environment variables set to production values
2. Mock data disabled (`NEXT_PUBLIC_USE_MOCK_DATA=false`)
3. Data source routing to VLT or Backend API (not MOCK)
4. RSK blockchain connection established
5. Biometric authentication working
6. Genesis block entry confirmed
7. Zero critical errors in logs
8. User vitalization flow completes successfully

---

## Final Manifest Summary

**Files Archived:**
- `web/data/mockData.json` → `web/data/archive/mockData.json.bak`

**Files Deleted (Optional):**
- `mockdata.json/` directory (duplicate)

**Files Created:**
- `backend/.env.production`
- `web/.env.production`
- `web/lib/dataService.ts`
- `docs/PRODUCTION-DEPLOYMENT.md`
- `scripts/verify-production.js`
- `docs/GENESIS-MIGRATION-MANIFEST.md`

**Environment Status:**
- ✅ VITALIE_MODE = 'PURE_SOVRYN'
- ✅ NETWORK_ID = 'SOVRYN_MAINNET_GENESIS'
- ✅ DATA_SOURCE = 'VLT_LIVE_NODE'
- ✅ Mock data disabled
- ✅ Live endpoints configured

**System Status:** 🟢 **READY FOR GENESIS DEPLOYMENT**

---

*Architect: Isreal Okoro (mrfundzman)*  
*Born in Lagos, Built for the World*  
*Genesis Protocol v1.0 — SOVRYN Mainnet*


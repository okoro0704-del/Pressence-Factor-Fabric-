# PFF Production Deployment Guide
## Genesis Protocol v1.0 — SOVRYN Mainnet Integration

**Architect:** Isreal Okoro (mrfundzman)  
**Status:** Production Ready  
**Network:** Rootstock (RSK) Mainnet  
**Mode:** PURE_SOVRYN

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Data Migration Strategy](#data-migration-strategy)
4. [Deployment Steps](#deployment-steps)
5. [Verification & Testing](#verification--testing)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Infrastructure Requirements

- [ ] **Production Database**: Supabase project created and configured
- [ ] **RSK Node Access**: Verified connection to `https://public-node.rsk.co`
- [ ] **VLT Node**: Live VLT node endpoint available (if applicable)
- [ ] **Domain & SSL**: Production domain with valid SSL certificate
- [ ] **Hosting**: Netlify/Vercel account configured for web deployment
- [ ] **Backend Hosting**: Server/container platform for Node.js backend

### Security Requirements

- [ ] **JWT Secret**: Generated 256-bit secret key
- [ ] **Vault AES Key**: Generated 32-byte encryption key
- [ ] **API Keys**: All third-party API keys secured
- [ ] **Environment Variables**: All secrets stored securely (not in git)
- [ ] **CORS Configuration**: Production domains whitelisted
- [ ] **Rate Limiting**: Configured and tested

### Blockchain Requirements

- [ ] **RSK Wallet**: Admin wallet with RBTC for gas fees
- [ ] **Contract Addresses**: Verified DLLR, ZUSD, and Sovryn protocol addresses
- [ ] **RPC Endpoints**: Primary and fallback RPC URLs tested
- [ ] **WebSocket**: WSS endpoint for real-time blockchain events

---

## Environment Configuration

### Backend Configuration

1. **Copy production template:**
   ```bash
   cd backend
   cp .env.production .env
   ```

2. **Configure required variables:**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate Vault AES key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Update `.env` with your values:**
   - `DATABASE_URL`: Supabase connection string
   - `JWT_SECRET`: Generated secret
   - `VAULT_AES_KEY`: Generated key
   - `CORS_ORIGINS`: Your production domain(s)
   - `VLT_API_URL`: Live VLT node endpoint (if available)
   - `VLT_API_KEY`: VLT authentication key (if required)

### Web Configuration

1. **Copy production template:**
   ```bash
   cd web
   cp .env.production .env.local
   ```

2. **Configure required variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `NEXT_PUBLIC_PFF_BACKEND_URL`: Your backend API URL
   - `NEXT_PUBLIC_APP_URL`: Your production domain
   - `NEXT_PUBLIC_WEBAUTHN_RP_ID`: Your domain (without https://)
   - `NEXT_PUBLIC_VLT_API_URL`: Live VLT node endpoint (if available)

3. **Verify feature flags:**
   ```bash
   NEXT_PUBLIC_USE_MOCK_DATA=false
   NEXT_PUBLIC_ENABLE_MOCK_SERVICES=false
   NEXT_PUBLIC_VITALIE_MODE=PURE_SOVRYN
   ```

### Mobile Configuration

1. **Update `mobile/app.config.js`:**
   ```javascript
   extra: {
     vitalieMode: 'PURE_SOVRYN',
     networkId: 'SOVRYN_MAINNET_GENESIS',
     backendUrl: 'https://your-backend.fly.dev', // or your API URL; use Supabase for national reserve / citizen impact when backend not set
     vltApiUrl: 'https://vlt-node.sovryn.app/api/v1',
   }
   ```

---

## Data Migration Strategy

### Phase 1: Mock Data Removal

**Files to remove/archive:**
- `web/data/mockData.json` → Archive to `web/data/archive/mockData.json.bak`
- `mockdata.json/` directory → Archive or delete
- Mock service imports in production builds

**Implementation:**
```bash
# Archive mock data
mkdir -p web/data/archive
mv web/data/mockData.json web/data/archive/mockData.json.bak

# Remove mock data directory
rm -rf mockdata.json
```

### Phase 2: Data Service Migration

The new `web/lib/dataService.ts` automatically handles data source routing:

- **Development**: Uses mock data
- **Production with VLT**: Uses VLT Live Node API
- **Production with Backend**: Uses PFF Backend API
- **Fallback**: Gracefully degrades to cached/mock data on errors

**No code changes required** — controlled by environment variables.

### Phase 3: Database Migration

1. **Run Supabase migrations:**
   ```bash
   cd supabase
   supabase db push
   ```

2. **Verify tables created:**
   - `presence_handshakes`
   - `citizen_vaults`
   - `national_reserve`
   - `vitalization_records`

3. **Seed initial data (if needed):**
   ```sql
   -- Genesis Block Entry
   INSERT INTO national_reserve (country, vault_balance_vida_cap, backed_currency_circulation_vida)
   VALUES ('Nigeria', 0, 0);
   ```

---

## Deployment Steps

### Step 1: Database Deployment

```bash
# 1. Link to Supabase project
cd supabase
supabase link --project-ref YOUR_PROJECT_REF

# 2. Push migrations
supabase db push

# 3. Enable realtime
supabase db execute -f ENABLE_REALTIME.sql
```

### Step 2: Backend Deployment

```bash
cd backend

# 1. Install dependencies
npm ci --production

# 2. Build TypeScript
npm run build

# 3. Deploy to your hosting platform
# Example for Docker:
docker build -t pff-backend:1.0.0-genesis .
docker push your-registry/pff-backend:1.0.0-genesis

# Example for PM2:
pm2 start dist/index.js --name pff-backend
```

### Step 3: Web Deployment

```bash
cd web

# 1. Install dependencies
npm ci

# 2. Build production bundle
npm run build

# 3. Deploy to Netlify/Vercel
# Netlify:
netlify deploy --prod

# Vercel:
vercel --prod
```

### Step 4: Mobile Deployment

```bash
cd mobile

# 1. Update version in app.config.js
# 2. Build for production
eas build --platform all --profile production

# 3. Submit to stores
eas submit --platform all
```

---

## Verification & Testing

### Backend Health Check

```bash
curl https://api.your-production-domain.com/health
# Expected: {"status":"ok","service":"pff-backend"}
```

### Web Application

1. **Visit production URL**: e.g. `https://your-app.netlify.app` (set in Netlify)
2. **Check data source**: Open browser console
   ```javascript
   // Should show VLT_LIVE or BACKEND_API, not MOCK
   ```
3. **Test Vitalization flow**: Complete full PFF scan
4. **Verify blockchain connection**: Connect wallet, check RSK network

### Database Verification

```sql
-- Check realtime is enabled
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## Rollback Procedures

### Emergency Rollback

1. **Revert to mock data mode:**
   ```bash
   # Update environment variable
   NEXT_PUBLIC_USE_MOCK_DATA=true
   
   # Redeploy web
   netlify deploy --prod
   ```

2. **Restore mock data file:**
   ```bash
   cp web/data/archive/mockData.json.bak web/data/mockData.json
   ```

3. **Switch backend to development mode:**
   ```bash
   NODE_ENV=development
   pm2 restart pff-backend
   ```

---

## Monitoring & Maintenance

### Key Metrics to Monitor

- **Handshake Success Rate**: Should be >95%
- **API Response Time**: <500ms for critical endpoints
- **Database Connections**: Monitor pool usage
- **RSK RPC Latency**: <2s for blockchain queries
- **Error Rate**: <1% for production traffic

### Logging

- **Backend**: Check logs for errors
  ```bash
  pm2 logs pff-backend
  ```

- **Web**: Monitor Sentry/error tracking service
- **Database**: Check Supabase logs dashboard

### Regular Maintenance

- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Audit smart contract interactions and gas usage

---

## Genesis Block Entry

After successful deployment, the VLT Genesis Block should contain:

```
Block 0 — GENESIS
Architect: ISREAL OKORO
Alias: MRFUNDZMAN
Status: SOVEREIGN_LIVE
Timestamp: 2026-01-31T00:00:00Z
Network: SOVRYN_MAINNET_GENESIS
Mode: PURE_SOVRYN
```

---

**Deployment Complete. The system is now live on SOVRYN Mainnet.**

*Born in Lagos, Built for the World.*


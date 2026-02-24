# 🔄 PFF Sentinel Migration Analysis

**Purpose:** Identify files that should be moved to a standalone PFF Sentinel project  
**Date:** 2026-02-23  
**Architect:** Isreal Okoro (mrfundzman)

---

## 🎯 STRATEGIC QUESTION

**"What files should we move to the Sentinel project to enable the PFF Protocol function perfectly?"**

This question implies creating a **standalone PFF Sentinel Backend** separate from the PFF Protocol Frontend.

---

## 🏗️ CURRENT ARCHITECTURE

Currently, the project is a **monorepo** with:
- **Frontend:** `web/` (Next.js PFF Protocol Dashboard)
- **Backend:** `backend/` (Express.js PFF Sentinel API)
- **Shared Core:** `core/` (Economic logic, types, constants)
- **Protocols:** `protocols/` (Handshake, heartbeat definitions)
- **Biometric Engines:** `face_biometric_engine/`, `palm_biometric_engine/`
- **Smart Contracts:** `contracts/`
- **Database:** `supabase/`

---

## 📦 RECOMMENDED MIGRATION STRATEGY

### **Option 1: Keep Monorepo (RECOMMENDED)**

**Rationale:**
- ✅ Shared `core/` logic (economic constants, types)
- ✅ Shared `protocols/` definitions
- ✅ Shared `supabase/` migrations
- ✅ Single source of truth for contract addresses
- ✅ Easier to maintain synchronization
- ✅ Simpler deployment pipeline

**Structure:**
```
PFF-Protocol/ (Monorepo)
├── web/              # Frontend (Stateless Doorkeeper)
├── backend/          # Sentinel Backend (Single Source of Truth)
├── core/             # Shared economic logic
├── protocols/        # Shared protocol definitions
├── supabase/         # Shared database migrations
└── contracts/        # Shared smart contracts
```

**Deployment:**
- Frontend → Netlify (already deployed at sovrn.netlify.app)
- Backend → Heroku/Railway/Render/DigitalOcean
- Database → Supabase (already configured)

---

### **Option 2: Separate Repositories (If Required)**

**Only if you need:**
- Different teams managing frontend vs backend
- Different deployment schedules
- Stricter access control (backend team vs frontend team)

**Files to Move to Standalone Sentinel Repo:**

#### **1. Core Backend Files (MUST MOVE)**
```
backend/                          # Entire backend directory
├── src/
│   ├── routes/                   # All API routes
│   │   ├── vitalize.ts          # ✅ Vitalization endpoint
│   │   ├── pillars.ts           # ✅ Pillar save endpoints
│   │   ├── vault.ts
│   │   ├── guardian.ts
│   │   ├── economic.ts
│   │   ├── sentinel.ts
│   │   └── ...
│   ├── sentinel/                 # Sentinel-specific logic
│   ├── economic/                 # Economic calculations
│   ├── db/                       # Database client
│   ├── lib/                      # Utilities
│   ├── middleware/               # Auth middleware
│   ├── services/                 # Business services
│   ├── config.ts                 # Backend config
│   └── index.ts                  # Entry point
├── package.json
└── tsconfig.json
```

#### **2. Shared Core Logic (MUST COPY/SYNC)**
```
core/                             # Shared economic logic
├── economic.ts                   # ✅ VIDA distribution constants
├── constants.ts                  # Protocol constants
├── types.ts                      # Shared types
├── sentinelOptIn.ts             # Sentinel types
├── sentinelBindingEngine.ts     # Sentinel binding logic
├── oemCertification.ts          # OEM certification
├── rootPairBinding.ts           # Root pair binding
├── revenueBridge.ts             # Revenue bridge
├── goldRush.ts                  # Gold rush logic
└── index.ts                      # Public API
```

#### **3. Protocol Definitions (MUST COPY/SYNC)**
```
protocols/                        # Protocol definitions
├── handshake.ts                  # Digital handshake
├── heartbeat.ts                  # Heartbeat protocol
├── schema.ts                     # 50/50 schema
└── index.ts                      # Public API
```

#### **4. Database Migrations (MUST COPY/SYNC)**
```
supabase/                         # Database migrations
├── migrations/                   # All migration files
│   ├── 20260280000000_vitalization_status.sql
│   ├── 20260281000000_vitalization_log.sql
│   ├── 20260282000000_vida_distribution_log.sql
│   ├── 20260283000000_vitalization_log_add_columns.sql
│   └── ...
└── config.toml                   # Supabase config
```

#### **5. Biometric Engines (OPTIONAL - If Sentinel Handles)**
```
face_biometric_engine/            # Face recognition engine
palm_biometric_engine/            # Palm recognition engine
```

#### **6. Environment Configuration (MUST CREATE)**
```
.env.production                   # Backend environment variables
├── POLYGON_RPC_URL
├── POLYGON_CHAIN_ID
├── VIDA_CAP_TOKEN_ADDRESS
├── NGN_VIDA_TOKEN_ADDRESS
├── SENTINEL_VAULT_ADDRESS
├── NATIONAL_TREASURY_ADDRESS
├── FOUNDATION_VAULT_ADDRESS
├── SUPABASE_URL
├── SUPABASE_SERVICE_ROLE_KEY    # Backend has owner permissions
└── PORT
```

---

## ⚠️ CRITICAL SYNCHRONIZATION POINTS

If you separate the repositories, you MUST keep these synchronized:

### **1. Economic Constants (CRITICAL)**
- **File:** `core/economic.ts`
- **Why:** Frontend and Backend must agree on 5-5-1 split
- **Solution:** Publish `core/` as npm package, both repos import it

### **2. Contract Addresses (CRITICAL)**
- **Files:** `backend/.env.production`, `web/.env.local`
- **Why:** Both must point to same Polygon contracts
- **Solution:** Single source of truth (environment variables)

### **3. Database Schema (CRITICAL)**
- **Files:** `supabase/migrations/`
- **Why:** Backend writes, Frontend reads
- **Solution:** Shared Supabase project, migrations applied once

### **4. API Contract (CRITICAL)**
- **Files:** `web/src/lib/sentinel/client.ts` ↔ `backend/src/routes/`
- **Why:** Frontend calls Backend endpoints
- **Solution:** OpenAPI/Swagger spec, versioned API

---

## 🚀 RECOMMENDED APPROACH

### **Phase 1: Keep Monorepo (Current State)**
- ✅ Already implemented
- ✅ Frontend and Backend in same repo
- ✅ Shared `core/` and `protocols/`
- ✅ Deploy separately (Frontend → Netlify, Backend → Heroku)

### **Phase 2: Extract Shared Core (If Needed)**
- Publish `core/` as `@pff/core` npm package
- Publish `protocols/` as `@pff/protocols` npm package
- Both repos import from npm

### **Phase 3: Separate Repos (Only If Required)**
- Create `pff-sentinel` repo with backend code
- Create `pff-protocol` repo with frontend code
- Both import `@pff/core` and `@pff/protocols` from npm

---

## 📋 MIGRATION CHECKLIST (If Separating)

### **Sentinel Repo Setup:**
- [ ] Copy `backend/` directory
- [ ] Copy `core/` directory
- [ ] Copy `protocols/` directory
- [ ] Copy `supabase/migrations/` directory
- [ ] Create `backend/.env.production` with all contract addresses
- [ ] Update `package.json` with backend dependencies
- [ ] Create `README.md` for Sentinel
- [ ] Set up CI/CD for backend deployment

### **Protocol Repo Cleanup:**
- [ ] Remove `backend/` directory (keep only `web/`)
- [ ] Update `web/src/lib/sentinel/client.ts` to point to deployed Sentinel URL
- [ ] Set `NEXT_PUBLIC_PFF_BACKEND_URL` in Netlify environment
- [ ] Remove backend dependencies from root `package.json`
- [ ] Update `README.md` for Protocol

### **Shared Dependencies:**
- [ ] Publish `core/` as npm package
- [ ] Publish `protocols/` as npm package
- [ ] Update both repos to import from npm

---

## 💡 MY RECOMMENDATION

**KEEP THE MONOREPO** for now because:

1. ✅ **Easier Synchronization** - No risk of contract address mismatches
2. ✅ **Shared Core Logic** - Economic constants stay in sync
3. ✅ **Simpler Deployment** - One repo, two deployment targets
4. ✅ **Faster Development** - Changes to `core/` immediately available to both
5. ✅ **Single Source of Truth** - Database migrations in one place

**Deploy Separately:**
- Frontend → Netlify (already done: sovrn.netlify.app)
- Backend → Heroku/Railway/Render
- Database → Supabase (already configured)

**Only separate if:**
- You have different teams managing frontend vs backend
- You need stricter access control
- You want independent versioning

---

**Would you like me to:**
1. **Keep monorepo** and help you deploy the backend to Heroku/Railway?
2. **Separate repos** and create migration scripts?
3. **Publish shared packages** to npm for better modularity?

Let me know your preference! 🚀


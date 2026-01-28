# Economic Layer Architecture
## VIDA CAP, $VIDA, and ATE Implementation

**Architect:** Isreal Okoro (mrfundzman)  
**Framework:** The Vitalie & PFF Framework  
**Status:** Design Document

---

## 1. System Overview

The Economic Layer implements the three immutable economic laws:
1. **50/50 Minting Split** — VIDA CAP allocation upon Vitalization
2. **45-10-45 Recovery Split** — External fund recovery distribution
3. **Debt-Free Backing** — $VIDA issuance against VIDA CAP Reserve

---

## 2. Database Schema

### `vida_cap_allocations`
Tracks VIDA CAP minted per citizen with 50/50 split.

```sql
CREATE TABLE vida_cap_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  pff_id TEXT NOT NULL REFERENCES citizens(pff_id),
  total_minted NUMERIC(20, 8) NOT NULL,           -- Total VIDA CAP minted
  citizen_share NUMERIC(20, 8) NOT NULL,          -- 50% to Citizen Vault
  national_reserve_share NUMERIC(20, 8) NOT NULL, -- 50% to National Reserve
  minted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_hash TEXT,                          -- VLT transaction hash
  UNIQUE(citizen_id)
);
```

### `national_reserve`
National Reserve Vault (State's 50% share of all VIDA CAP).

```sql
CREATE TABLE national_reserve (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vida_cap_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id) -- Singleton table
);
```

### `citizen_vaults`
Citizen Private Vaults (Citizen's 50% share of VIDA CAP).

```sql
CREATE TABLE citizen_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  pff_id TEXT NOT NULL REFERENCES citizens(pff_id),
  vida_cap_balance NUMERIC(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(citizen_id)
);
```

### `vida_currency`
$VIDA issuance tracking (1:1 against VIDA CAP Reserve).

```sql
CREATE TABLE vida_currency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuance_type TEXT NOT NULL,                    -- 'citizen' | 'state'
  citizen_id UUID REFERENCES citizens(id),        -- NULL if state issuance
  amount NUMERIC(20, 8) NOT NULL,                 -- $VIDA issued
  vida_cap_backing NUMERIC(20, 8) NOT NULL,       -- VIDA CAP reserved
  reserve_balance_before NUMERIC(20, 8) NOT NULL, -- Reserve before issuance
  reserve_balance_after NUMERIC(20, 8) NOT NULL,  -- Reserve after issuance
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_hash TEXT,                          -- VLT transaction hash
  status TEXT NOT NULL DEFAULT 'issued'            -- 'issued' | 'redeemed'
);
```

### `recovery_transactions`
External fund recovery (45-10-45 split).

```sql
CREATE TABLE recovery_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recovery_amount NUMERIC(20, 8) NOT NULL,        -- Total recovered
  people_share NUMERIC(20, 8) NOT NULL,          -- 45% to People
  state_share NUMERIC(20, 8) NOT NULL,           -- 45% to State
  agent_share NUMERIC(20, 8) NOT NULL,            -- 10% to Agents
  agent_id TEXT,                                  -- Agent identifier
  distribution_method TEXT,                       -- 'proportional' | 'equal'
  recovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_hash TEXT,                          -- VLT transaction hash
  metadata JSONB                                  -- Additional recovery details
);
```

### `vlt_transactions`
Vitalization Ledger Technology — immutable transaction log.

```sql
CREATE TABLE vlt_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL,                 -- 'mint' | 'issue' | 'recovery' | 'transfer'
  transaction_hash TEXT NOT NULL UNIQUE,          -- SHA-256 hash
  citizen_id UUID REFERENCES citizens(id),
  amount NUMERIC(20, 8),
  from_vault TEXT,                                -- 'citizen' | 'national_reserve' | 'external'
  to_vault TEXT,                                  -- 'citizen' | 'national_reserve' | 'agent'
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Core Constants

```typescript
// VIDA CAP minting amount per Vitalization (configurable)
export const VIDA_CAP_MINT_AMOUNT = 1.0; // 1 VIDA CAP per citizen

// Split ratios (immutable)
export const MINTING_SPLIT_CITIZEN = 0.5;      // 50%
export const MINTING_SPLIT_NATIONAL = 0.5;     // 50%

export const RECOVERY_SPLIT_PEOPLE = 0.45;     // 45%
export const RECOVERY_SPLIT_STATE = 0.45;      // 45%
export const RECOVERY_SPLIT_AGENT = 0.10;      // 10%

// $VIDA issuance ratio (1:1 against VIDA CAP)
export const VIDA_ISSUANCE_RATIO = 1.0;
```

---

## 4. API Endpoints

### `POST /vitalize/register`
**Enhanced:** Now triggers VIDA CAP minting with 50/50 split.

**Request:** (unchanged)
```json
{
  "publicKey": "...",
  "deviceId": "...",
  "keyId": "...",
  "legalIdentityRef": "..."
}
```

**Response:** (enhanced)
```json
{
  "success": true,
  "pffId": "pff_...",
  "vidaCap": {
    "totalMinted": 1.0,
    "citizenShare": 0.5,
    "nationalReserveShare": 0.5,
    "transactionHash": "..."
  }
}
```

### `GET /vida-cap/balance`
Get citizen VIDA CAP balance.

**Auth:** Presence Token

**Response:**
```json
{
  "success": true,
  "citizenVault": {
    "vidaCapBalance": 0.5,
    "pffId": "pff_..."
  },
  "nationalReserve": {
    "totalVidaCap": 1000.0
  }
}
```

### `GET /vida-cap/reserve`
Get National Reserve VIDA CAP total (public, no auth).

**Response:**
```json
{
  "success": true,
  "totalVidaCap": 1000.0,
  "backingRatio": 1.0,
  "lastUpdated": "2026-01-28T..."
}
```

### `POST /vida/issue`
Issue $VIDA against VIDA CAP Reserve.

**Auth:** Presence Token (for citizen) or Admin Token (for state)

**Request:**
```json
{
  "amount": 100.0,
  "type": "citizen" // or "state"
}
```

**Response:**
```json
{
  "success": true,
  "vidaIssued": 100.0,
  "vidaCapReserved": 100.0,
  "reserveBalanceBefore": 1000.0,
  "reserveBalanceAfter": 900.0,
  "transactionHash": "..."
}
```

### `POST /recovery/split`
Process external fund recovery (45-10-45 split).

**Auth:** Admin Token

**Request:**
```json
{
  "recoveryAmount": 1000.0,
  "agentId": "agent_123",
  "distributionMethod": "proportional", // or "equal"
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "peopleShare": 450.0,
  "stateShare": 450.0,
  "agentShare": 100.0,
  "transactionHash": "..."
}
```

---

## 5. Business Logic

### VIDA CAP Minting (50/50 Split)

```typescript
async function mintVidaCap(citizenId: string, pffId: string): Promise<MintResult> {
  // 1. Calculate split
  const totalMinted = VIDA_CAP_MINT_AMOUNT;
  const citizenShare = totalMinted * MINTING_SPLIT_CITIZEN;
  const nationalShare = totalMinted * MINTING_SPLIT_NATIONAL;

  // 2. Atomic transaction: Insert allocation + Update citizen vault + Update national reserve
  await db.transaction(async (tx) => {
    // Insert allocation record
    await tx.query(`
      INSERT INTO vida_cap_allocations 
      (citizen_id, pff_id, total_minted, citizen_share, national_reserve_share, transaction_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [citizenId, pffId, totalMinted, citizenShare, nationalShare, generateHash()]);

    // Update/create citizen vault
    await tx.query(`
      INSERT INTO citizen_vaults (citizen_id, pff_id, vida_cap_balance)
      VALUES ($1, $2, $3)
      ON CONFLICT (citizen_id) DO UPDATE SET
        vida_cap_balance = citizen_vaults.vida_cap_balance + $3,
        updated_at = NOW()
    `, [citizenId, pffId, citizenShare]);

    // Update national reserve (singleton)
    await tx.query(`
      INSERT INTO national_reserve (id, vida_cap_balance)
      VALUES (1, $1)
      ON CONFLICT (id) DO UPDATE SET
        vida_cap_balance = national_reserve.vida_cap_balance + $1,
        last_updated = NOW()
    `, [nationalShare]);

    // Log to VLT
    await logVLTTransaction(tx, 'mint', citizenId, totalMinted, generateHash());
  });

  return { totalMinted, citizenShare, nationalShare };
}
```

### $VIDA Issuance (1:1 Against Reserve)

```typescript
async function issueVida(
  amount: number,
  type: 'citizen' | 'state',
  citizenId?: string
): Promise<IssueResult> {
  // 1. Verify reserve has enough VIDA CAP
  const reserve = await getNationalReserve();
  if (reserve.vidaCapBalance < amount) {
    throw new Error('Insufficient VIDA CAP in National Reserve');
  }

  // 2. Atomic transaction: Reserve VIDA CAP + Issue $VIDA + Log
  const result = await db.transaction(async (tx) => {
    const before = reserve.vidaCapBalance;
    const after = before - amount;

    // Update reserve
    await tx.query(`
      UPDATE national_reserve
      SET vida_cap_balance = $1, last_updated = NOW()
      WHERE id = 1
    `, [after]);

    // Issue $VIDA
    await tx.query(`
      INSERT INTO vida_currency 
      (issuance_type, citizen_id, amount, vida_cap_backing, reserve_balance_before, reserve_balance_after, transaction_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [type, citizenId || null, amount, amount, before, after, generateHash()]);

    // Log to VLT
    await logVLTTransaction(tx, 'issue', citizenId, amount, generateHash());

    return { before, after, amount };
  });

  return result;
}
```

### Recovery Split (45-10-45)

```typescript
async function processRecovery(
  recoveryAmount: number,
  agentId: string,
  distributionMethod: 'proportional' | 'equal'
): Promise<RecoveryResult> {
  // 1. Calculate split
  const agentShare = recoveryAmount * RECOVERY_SPLIT_AGENT;
  const peopleShare = recoveryAmount * RECOVERY_SPLIT_PEOPLE;
  const stateShare = recoveryAmount * RECOVERY_SPLIT_STATE;

  // 2. Atomic transaction: Distribute to People/State/Agent
  await db.transaction(async (tx) => {
    // Log recovery transaction
    await tx.query(`
      INSERT INTO recovery_transactions 
      (recovery_amount, people_share, state_share, agent_share, agent_id, distribution_method, transaction_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [recoveryAmount, peopleShare, stateShare, agentShare, agentId, distributionMethod, generateHash()]);

    // Distribute to people (proportional to citizen vault balances or equal)
    if (distributionMethod === 'proportional') {
      await distributeProportionalToCitizens(tx, peopleShare);
    } else {
      await distributeEqualToCitizens(tx, peopleShare);
    }

    // Add to national reserve
    await tx.query(`
      UPDATE national_reserve
      SET vida_cap_balance = vida_cap_balance + $1, last_updated = NOW()
      WHERE id = 1
    `, [stateShare]);

    // Log agent share (tracked separately)
    await logAgentShare(tx, agentId, agentShare);

    // Log to VLT
    await logVLTTransaction(tx, 'recovery', null, recoveryAmount, generateHash());
  });

  return { peopleShare, stateShare, agentShare };
}
```

---

## 6. Security & Validation

### Atomic Transactions
All economic operations use database transactions to ensure atomicity:
- VIDA CAP minting (allocation + citizen vault + national reserve)
- $VIDA issuance (reserve update + currency issuance)
- Recovery split (all distributions in one transaction)

### Reserve Verification
Before $VIDA issuance:
```typescript
if (reserveBalance < requestedAmount) {
  throw new Error('Insufficient VIDA CAP in National Reserve');
}
```

### Presence-Gated Access
Citizen VIDA CAP access requires Presence Proof:
```typescript
// GET /vida-cap/balance requires Presence Token
// Token verified via pffAuth middleware
```

### VLT Immutability
All transactions logged to VLT with SHA-256 hash:
```typescript
function generateHash(): string {
  return crypto
    .createHash('sha256')
    .update(`${Date.now()}-${Math.random()}`)
    .digest('hex');
}
```

---

## 7. Integration Points

### Vitalization Flow
`POST /vitalize/register` now calls `mintVidaCap()` after citizen creation.

### Vault System
Citizen VIDA CAP balance stored in `citizen_vaults`, accessible via Presence Proof.

### National Pulse
National Reserve total displayed on `/pulse` dashboard.

### Sovryn Bridge
$VIDA can be bridged to Sovryn (Rootstock) for DeFi, maintaining presence-gated access.

---

**End of Architecture Document**

*This architecture implements the immutable economic laws defined in MASTER-PROMPT.md.*

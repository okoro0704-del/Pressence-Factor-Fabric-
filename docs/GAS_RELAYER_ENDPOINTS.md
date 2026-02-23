# PFF × Sovryn — Gas Relayer Endpoints Documentation

This document lists all endpoints related to gas/relayer functionality for gasless transactions on Rootstock (RSK).

---

## Overview

The PFF Protocol provides **gasless transaction support** for users who don't have RBTC (Rootstock Bitcoin) for gas fees. The Protocol Relayer sends small amounts of RBTC to user wallets so they can execute their first transactions.

**Key Concepts:**
- **RBTC**: Gas token on Rootstock (RSK) - required for all transactions
- **MIN_RBTC_FOR_GAS**: 0.0001 RBTC - minimum balance needed for transactions
- **GAS_DRIP_AMOUNT**: 0.001 RBTC - amount sent per drip request
- **Relayer Wallet**: Protocol-owned wallet that funds gas drips

---

## Endpoints

### 1. Next.js API Route: `/v1/sovryn/gas-drip`

**Type:** Next.js API Route (Server-Side)  
**File:** `web/src/app/api/v1/sovryn/gas-drip/route.ts`  
**URL:** `https://sovrn.netlify.app/v1/sovryn/gas-drip`

**Purpose:** Provide RBTC gas for users via HTTP API

**Authentication:** `x-sovryn-secret` header

**Request:**
```bash
curl -X POST https://sovrn.netlify.app/v1/sovryn/gas-drip \
  -H "x-sovryn-secret: Pff-Sen-Sov-555-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

**Request Body:**
```typescript
{
  phone?: string;    // Phone number to derive RSK address
  address?: string;  // Direct RSK address (if phone not provided)
}
```

**Response (Success):**
```json
{
  "ok": true,
  "txHash": "0x...",
  "amount": "0.001",
  "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response (Error):**
```json
{
  "ok": false,
  "error": "Relayer wallet low on RBTC (0.005 RBTC). Admin has been notified."
}
```

**Environment Variables:**
- `RELAYER_PRIVATE_KEY`: Private key of relayer wallet (required)

---

### 2. Supabase Edge Function: `relayer-gas`

**Type:** Supabase Edge Function (Deno)  
**File:** `supabase/functions/relayer-gas/index.ts`  
**URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/relayer-gas`

**Purpose:** Provide RBTC gas for users via Supabase Edge Function

**Authentication:** Supabase `Authorization: Bearer` header

**Request:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/relayer-gas \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

**Request Body:**
```typescript
{
  phone: string;            // Phone number (for logging/tracking)
  recipientAddress: string; // RSK address to receive RBTC
}
```

**Response:** Same as Next.js API route

**Supabase Secrets:**
- `RELAYER_PRIVATE_KEY`: Private key of relayer wallet (required)
- `RSK_RPC_URL`: Rootstock RPC endpoint (default: https://public-node.rsk.co)
- `GAS_DRIP_AMOUNT`: Amount of RBTC per drip (default: 0.001)
- `RELAYER_MIN_RBTC`: Minimum relayer balance (default: 0.01)

**Deployment:**
```bash
supabase functions deploy relayer-gas
supabase secrets set RELAYER_PRIVATE_KEY=0x...
```

---

### 3. Supabase Edge Function: `gasless-mint`

**Type:** Supabase Edge Function (Deno)  
**File:** `supabase/functions/gasless-mint/index.ts`  
**URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/gasless-mint`

**Purpose:** Mint VIDA tokens without requiring user to have RBTC for gas

**Authentication:** Supabase `Authorization: Bearer` header

**Request:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/gasless-mint \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

**Request Body:**
```typescript
{
  phone: string;            // Phone number (for verification)
  recipientAddress: string; // RSK address to receive VIDA tokens
}
```

**Response (Success):**
```json
{
  "ok": true,
  "txHash": "0x...",
  "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "blockExplorerUrl": "https://explorer.rsk.co/tx/0x...",
  "amountMinted": "5.00"
}
```

**Supabase Secrets:**
- `VIDA_MINTER_PRIVATE_KEY`: Private key of minter wallet (required)
- `VIDA_TOKEN_ADDRESS`: VIDA token contract address (required)
- `RSK_RPC_URL`: Rootstock RPC endpoint
- `RELAYER_MIN_RBTC`: Minimum relayer balance

---

## Client-Side Integration

### Using `requestRelayerGasForSwap()`

**File:** `web/lib/sovryn/relayerGas.ts`

```typescript
import { requestRelayerGasForSwap } from '@/lib/sovryn/relayerGas';

// Request gas for a user
const result = await requestRelayerGasForSwap('+2348012345678');
if (result.ok) {
  console.log('Gas drip successful');
} else {
  console.error('Gas drip failed:', result.error);
}
```

**Flow:**
1. Tries Supabase Edge Function `relayer-gas` first
2. Falls back to Next.js API route `/api/relayer/gas` if Edge Function unavailable
3. Returns `{ ok: boolean, error?: string }`

---

## Security

**Authentication:**
- Next.js API: `x-sovryn-secret` header (value: `Pff-Sen-Sov-555-2026`)
- Supabase Edge Functions: Supabase `Authorization: Bearer` header

**Rate Limiting:**
- Only drips gas if recipient has < 0.0001 RBTC (prevents abuse)
- Relayer must maintain minimum balance (prevents draining)

**Private Key Management:**
- Never commit private keys to Git
- Store in environment variables (Netlify) or Supabase secrets
- Use separate relayer wallet (not deployer wallet)

---

## Monitoring

**Relayer Balance Alerts:**
- If relayer balance < `RELAYER_MIN_RBTC`, endpoint returns 503 error
- Admin should monitor relayer wallet and top up when low
- Consider setting up webhook alerts for low balance

**Transaction Tracking:**
- All gas drips return transaction hash
- View on RSK Explorer: `https://explorer.rsk.co/tx/{txHash}`

---

## Troubleshooting

**Error: "Relayer not configured"**
- Set `RELAYER_PRIVATE_KEY` environment variable

**Error: "Relayer wallet low on RBTC"**
- Top up relayer wallet with RBTC

**Error: "Recipient already has sufficient gas"**
- User already has >= 0.0001 RBTC, no drip needed

**Error: "Transaction failed"**
- Check RSK RPC endpoint is accessible
- Verify relayer wallet has RBTC
- Check transaction on RSK Explorer


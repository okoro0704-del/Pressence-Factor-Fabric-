# Sovryn Gas Relayer — Edge Function

Provides RBTC gas for users who don't have enough for transactions on Rootstock (RSK).

## Purpose

When a user wants to perform their first VIDA→DLLR swap but has no RBTC for gas, the Protocol Relayer sends a small amount of RBTC (default: 0.001 RBTC) to their wallet so they can execute the transaction.

## Secret Management (Supabase → Project Settings → Edge Functions → Secrets)

```bash
# Required
RELAYER_PRIVATE_KEY=0x...  # Private key of wallet with RBTC balance

# Optional (with defaults)
RSK_RPC_URL=https://public-node.rsk.co
GAS_DRIP_AMOUNT=0.001  # Amount of RBTC to send per drip
RELAYER_MIN_RBTC=0.01  # Minimum RBTC balance for relayer
```

## Flow

1. App sends `{ phone, recipientAddress }` (recipientAddress = derived RSK address)
2. Function validates recipient address format
3. Connects to `RSK_RPC_URL` and checks relayer RBTC balance
4. If relayer balance < `RELAYER_MIN_RBTC`: return 503 error
5. Checks recipient balance - if they already have >= 0.0001 RBTC, skip drip
6. Sends `GAS_DRIP_AMOUNT` RBTC to recipient address
7. Returns tx hash

## Request

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/relayer-gas \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348012345678",
    "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

## Response

**Success:**
```json
{
  "ok": true,
  "txHash": "0x...",
  "amount": "0.001",
  "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Already has gas:**
```json
{
  "ok": true,
  "txHash": "",
  "amount": "0",
  "recipientAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Recipient already has sufficient gas"
}
```

**Error:**
```json
{
  "ok": false,
  "error": "Relayer wallet low on RBTC (0.005 RBTC). Admin has been notified."
}
```

## Deployment

```bash
# Deploy to Supabase
supabase functions deploy relayer-gas

# Set secrets
supabase secrets set RELAYER_PRIVATE_KEY=0x...
supabase secrets set RSK_RPC_URL=https://public-node.rsk.co
supabase secrets set GAS_DRIP_AMOUNT=0.001
supabase secrets set RELAYER_MIN_RBTC=0.01
```

## Integration

This function is called by `web/lib/sovryn/relayerGas.ts`:

```typescript
const { data, error } = await supabase.functions.invoke('relayer-gas', {
  body: { phone: trimmed, recipientAddress: derived.address },
});
```

## Security

- Only sends gas if recipient has < 0.0001 RBTC (prevents abuse)
- Relayer wallet must maintain minimum balance (prevents draining)
- Private key stored in Supabase Edge Function secrets (never in code)
- CORS enabled for web app access


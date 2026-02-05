# Sovryn Minting Relayer — Edge Function

Called by the app after **Face Pulse + Fingerprint**. Verifies `is_fully_verified` in `user_profiles`, connects to Rootstock (RSK_RPC_URL), checks relayer RBTC balance, then signs and sends `mint(recipient, VIDA_MINT_AMOUNT)` to VIDA_TOKEN_ADDRESS. Returns the Rootstock transaction hash so the user can view **Proof of Wealth** on the block explorer.

## Secret Management (Supabase → Project Settings → Edge Functions → Secrets)

| Secret | Required | Description |
|--------|----------|-------------|
| `VIDA_MINTER_PRIVATE_KEY` | Yes | Private key of the Relayer Wallet (pays RBTC gas). |
| `VIDA_TOKEN_ADDRESS` | Yes | VIDA token contract address on Rootstock (Chain ID 30). |
| `RSK_RPC_URL` | No | Rootstock RPC; default `https://public-node.rsk.co`. |
| `VIDA_MINT_AMOUNT` | No | VIDA to mint per user; default `5` (5.00). |
| `RELAYER_MIN_RBTC` | No | Min RBTC balance before minting; default `0.001`. If below, mint fails and Admin is alerted. |
| `ADMIN_ALERT_WEBHOOK_URL` | No | When gas is low, POST `{ alert: 'RELAYER_GAS_LOW', ... }` to this URL (e.g. Slack, PagerDuty). |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set automatically.

## Minting Trigger

1. App sends `{ phone, recipientAddress }` (recipientAddress = derived RSK address).
2. Function verifies `user_profiles.is_fully_verified === true` for that phone.
3. Connects to `RSK_RPC_URL` and checks relayer RBTC balance.
4. If balance &lt; `RELAYER_MIN_RBTC`: alert Admin (webhook + `relayer_gas_alerts` table), return 503.
5. Signs `mint(recipientAddress, VIDA_MINT_AMOUNT)` with `VIDA_MINTER_PRIVATE_KEY`.
6. Saves `vida_mint_tx_hash` to `user_profiles` and returns tx hash + block explorer URL.

## Gas Check & Admin Alert

- If the relayer wallet balance is below `RELAYER_MIN_RBTC`, the function does **not** mint and returns 503.
- If `ADMIN_ALERT_WEBHOOK_URL` is set, it POSTs a JSON body with `alert: 'RELAYER_GAS_LOW'`, balance, and relayer address.
- If the `relayer_gas_alerts` table exists (migration `20260238000000_relayer_gas_alerts.sql`), an row is inserted so Admin can query low-gas events.

## Receipt (Proof of Wealth)

Response when successful:

```json
{
  "ok": true,
  "txHash": "0x...",
  "recipientAddress": "0x...",
  "blockExplorerUrl": "https://explorer.rsk.co/tx/0x...",
  "amountMinted": "5"
}
```

The app can open `blockExplorerUrl` so the user can see their mint on the Rootstock block explorer.

## Deploy

```bash
supabase functions deploy gasless-mint
```

Then set the secrets in the Supabase Dashboard.

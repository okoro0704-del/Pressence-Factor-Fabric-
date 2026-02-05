# Shared Vault — Cross-Domain Sentinel Handshake

Both the **Main PFF App** and the **PFF Sentinel App** (pffsentinel.com) connect to the **same Supabase project**. This shared backend is the "Shared Brain" that lets the Sentinel site unlock the Main site instantly after payment.

## Configuration

- **Main PFF App**: Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same as below).
- **PFF Sentinel App**: Set the **same** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
  Also set `NEXT_PUBLIC_MAIN_PFF_APP_URL` to the Main app origin (e.g. `https://your-main-pff-domain.com`) so the Sentinel app can:
  - Build the **Success webhook** URL: `{MAIN_PFF_APP_URL}/api/sentinel-webhook`
  - Build the **Return to Main App** link after activation.

- **Main PFF App** (optional): Set `NEXT_PUBLIC_SENTINEL_ACTIVATE_URL` if the Sentinel site is not at `https://pffsentinel.com` (e.g. staging).

## Shared tables (Supabase)

| Table | Purpose |
|-------|---------|
| `sentinel_licenses` | Active licenses per `owner_id` (Identity Anchor). Main app checks this via `hasActiveSentinelLicense(ownerId)`. |
| `sentinel_license_devices` | Devices linked to each license. |
| `sentinel_business_ledger` | Payment records (USD/DLLR, tier, reference). |
| `sentinel_security_tokens` | Tokens created on Sentinel site; user can enter in Main app to unlock. |

## Flow

1. User on Main PFF has no active license → **SentinelGuard** blocks dashboard and shows "Security Protocol Offline. Activate your Sentinel at pffsentinel.com to unlock funds."
2. User clicks **Secure Redirect** → `https://pffsentinel.com/activate?uid=[USER_ID]`.
3. On Sentinel **Download & Activate** page, user selects tier ($20 or other), completes payment (API confirms).
4. Sentinel app calls `processSentinelPayment(ownerId, tier, amount, …)` → inserts into `sentinel_business_ledger` and `sentinel_licenses` in **Supabase**.
5. Sentinel app optionally creates a security token and then POSTs to **Main PFF** `POST /api/sentinel-webhook` with `{ uid, tier, success: true }`.
6. User returns to Main PFF (same browser or new tab). **SentinelGuard** re-runs `hasActiveSentinelLicense(ownerId)` → reads from same Supabase → sees active license → **dashboard unlocks**.

Because both apps use the same Supabase project, no server-side "push" from Sentinel to Main is strictly required for unlocking: the next time the Main app checks license status, it sees the new row. The webhook is for logging, analytics, or triggering realtime UI refresh if needed.

## Branding

CSS/Styles on pffsentinel.com (and the in-repo Sentinel pages `/activate`, `/sentinel-vault`) use the **Sovereign** aesthetic:

- **Deep slate**: `#0d0d0f` (bg), `#16161a` (cards), `#2a2a2e` (borders).
- **Gold**: `#D4AF37` (primary), `rgba(212, 175, 55, 0.3)` (borders).
- Font: JetBrains Mono for headings and tokens.

These match the main Protocol (e.g. `SentinelGuard`, dashboard, sentinel purchase pages).

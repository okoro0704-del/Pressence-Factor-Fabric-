# 🏦 PFF Shared Account Factory

## Overview

The **PFF Shared Account Factory** is a smart contract system that enables external partners (like banks) to create shared business accounts for verified PFF users. The system includes:

- **KYC Verification**: Checks PFF Verified SBT ownership before account creation
- **Partner Whitelisting**: Only approved partners can create accounts
- **Webhook Notifications**: Sentinel receives real-time notifications
- **Multi-Admin Support**: Accounts can have multiple administrators

---

## Architecture

### Smart Contracts

#### 1. **SharedAccountFactory.sol**
Factory contract that creates new shared accounts.

**Key Features:**
- Creates minimal proxy clones (EIP-1167) for gas efficiency
- Verifies KYC status via PFF Verified SBT
- Emits events for Sentinel webhook notifications
- Partner whitelisting system

**Main Functions:**
```solidity
function createAccount(
    address sovereignID,
    string calldata accountName,
    address[] calldata additionalAdmins
) external returns (address account)
```

#### 2. **SharedAccount.sol**
Implementation contract for individual shared accounts.

**Key Features:**
- Multiple admin management
- Partner tracking
- Account metadata (name, creation time)
- Admin-only access control

---

## Deployment Guide

### Step 1: Deploy Contracts

#### Deploy SharedAccount Implementation
```bash
# Deploy the implementation contract first
npx hardhat run scripts/deploy-shared-account.ts --network polygon
```

#### Deploy SharedAccountFactory
```bash
# Deploy the factory with:
# - PFF Verified SBT address
# - SharedAccount implementation address
# - Sentinel webhook URL
npx hardhat run scripts/deploy-factory.ts --network polygon
```

### Step 2: Configure Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_SHARED_ACCOUNT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_SHARED_ACCOUNT_IMPLEMENTATION_ADDRESS=0x...
SENTINEL_WEBHOOK_URL=https://sentinel.pffprotocol.com/webhooks/account-created
WEBHOOK_SECRET=your-secret-key
POLYGON_RPC_URL=https://polygon-rpc.com
```

Add to Netlify environment variables (same as above).

### Step 3: Whitelist Partners

```javascript
// Using Hardhat console or script
const factory = await ethers.getContractAt("SharedAccountFactory", FACTORY_ADDRESS);
await factory.whitelistPartner(UBA_ADDRESS, "UBA (United Bank for Africa)");
```

---

## Partner Integration Guide

### For External Partners (e.g., UBA)

#### 1. Get Whitelisted
Contact PFF Protocol to whitelist your partner address:
- Email: partners@pffprotocol.com
- Provide: Partner name, wallet address, integration details

#### 2. Integrate the Factory

**TypeScript/React Example:**
```typescript
import { useSharedAccountFactory } from "@/lib/pff/hooks/useSharedAccountFactory";

function CreateAccount() {
  const { createAccount, isCreating, error } = useSharedAccountFactory();
  
  const handleCreate = async () => {
    const accountAddress = await createAccount({
      sovereignID: "0x...", // Customer's PFF wallet
      accountName: "ABC Corp Business Account",
      additionalAdmins: ["0x...", "0x..."], // Optional
    });
    
    if (accountAddress) {
      console.log("Account created:", accountAddress);
    }
  };
  
  return <button onClick={handleCreate}>Create Account</button>;
}
```

**Direct Contract Call (Solidity/Web3):**
```javascript
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

const tx = await factory.createAccount(
  sovereignID,      // Customer's verified PFF wallet
  "Business Account", // Account name
  []                // Additional admins (optional)
);

const receipt = await tx.wait();
const accountAddress = receipt.events[0].args.account;
```

#### 3. Handle KYC Verification

The factory automatically checks if the Sovereign ID owns a PFF Verified SBT:

```solidity
// This happens automatically in createAccount()
uint256 sbtBalance = pffVerifiedSBT.balanceOf(sovereignID);
if (sbtBalance == 0) {
    revert SovereignIDNotVerified(sovereignID);
}
```

**Error Handling:**
- `NotWhitelistedPartner`: Your address is not whitelisted
- `SovereignIDNotVerified`: Customer hasn't completed KYC
- `InvalidSovereignID`: Invalid wallet address
- `InvalidAccountName`: Account name is empty

---

## Webhook System

### Event Flow

1. **Partner creates account** → `createAccount()` called
2. **Factory emits event** → `AccountCreated` event
3. **Event listener detects** → Blockchain event listener
4. **Webhook triggered** → POST to `/api/webhooks/account-created`
5. **Sentinel notified** → Webhook forwarded to Sentinel

### Webhook Payload

```json
{
  "type": "SHARED_ACCOUNT_CREATED",
  "data": {
    "accountAddress": "0x...",
    "sovereignID": "0x...",
    "partnerAddress": "0x...",
    "partnerName": "UBA",
    "accountName": "ABC Corp Business Account",
    "timestamp": 1708531200,
    "transactionHash": "0x...",
    "blockNumber": 12345678,
    "explorerUrl": "https://polygonscan.com/tx/0x..."
  },
  "metadata": {
    "source": "PFF_SHARED_ACCOUNT_FACTORY",
    "version": "1.0.0",
    "receivedAt": "2024-02-21T10:00:00Z"
  }
}
```

### Setting Up Event Listener

**Server-side script:**
```typescript
import { startEventListenerService } from "@/lib/webhooks/eventListener";

// Start listening for events
await startEventListenerService();
```

**Docker/PM2:**
```bash
# Run as a background service
pm2 start npm --name "pff-event-listener" -- run listen:events
```

---

## Frontend Integration

### React Hooks

#### useSharedAccountFactory
```typescript
const { createAccount, isCreating, error } = useSharedAccountFactory();
```

#### useAccountsBySovereign
```typescript
const { accounts, isLoading } = useAccountsBySovereign(sovereignID);
```

#### useSharedAccount
```typescript
const { addAdmin, removeAdmin } = useSharedAccount(accountAddress);
```

#### useAccountInfo
```typescript
const { accountName, partner, admins } = useAccountInfo(accountAddress);
```

### Example Pages

- **Partner Portal**: `/partners/uba` - UBA integration example
- **Account Management**: Create, view, and manage shared accounts
- **Admin Panel**: Add/remove admins from accounts

---

## Security Considerations

### 1. Partner Whitelisting
Only whitelisted partners can create accounts. This prevents unauthorized account creation.

### 2. KYC Verification
All Sovereign IDs must own a PFF Verified SBT (Soul-Bound Token) proving KYC completion.

### 3. Webhook Signatures
Webhooks are signed with HMAC-SHA256 to prevent tampering:
```typescript
const signature = await generateSignature(payload);
// Include in X-PFF-Signature header
```

### 4. Multi-Admin Protection
Accounts cannot have zero admins. The last admin cannot be removed.

### 5. Non-Transferable SBTs
PFF Verified SBTs are soul-bound (non-transferable), ensuring KYC cannot be sold or transferred.

---

## Testing

### Local Testing

1. **Deploy contracts to testnet** (Polygon Mumbai)
2. **Mint test SBT** to a test wallet
3. **Whitelist test partner** address
4. **Create test account** using the factory
5. **Verify webhook** is triggered

### Integration Testing

```typescript
// Test account creation
const account = await createAccount({
  sovereignID: TEST_WALLET,
  accountName: "Test Account",
});

expect(account).toBeTruthy();

// Test KYC verification
await expect(
  createAccount({
    sovereignID: UNVERIFIED_WALLET,
    accountName: "Test",
  })
).rejects.toThrow("SovereignIDNotVerified");
```

---

## Troubleshooting

### "NotWhitelistedPartner" Error
**Solution**: Contact PFF Protocol to whitelist your partner address.

### "SovereignIDNotVerified" Error
**Solution**: Customer must complete KYC and receive PFF Verified SBT.

### Webhook Not Received
**Solution**: 
- Check event listener is running
- Verify `SENTINEL_WEBHOOK_URL` is correct
- Check webhook endpoint logs

### Account Creation Failed
**Solution**:
- Verify all parameters are valid
- Check gas limits
- Ensure implementation contract is deployed

---

## Roadmap

- [ ] Multi-signature support for high-value accounts
- [ ] Account recovery mechanisms
- [ ] Role-based permissions (admin, viewer, operator)
- [ ] Account freezing/unfreezing
- [ ] Batch account creation
- [ ] Account templates for different business types

---

## Support

- **Documentation**: https://docs.pffprotocol.com
- **Partner Support**: partners@pffprotocol.com
- **Technical Issues**: support@pffprotocol.com
- **GitHub**: https://github.com/pff-protocol

---

## License

MIT License - See LICENSE file for details


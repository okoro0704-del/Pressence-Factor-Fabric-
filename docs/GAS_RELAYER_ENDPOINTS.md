# PFF Protocol — Gas Fees Documentation

This document explains how gas fees work in the PFF Protocol on Polygon.

---

## Overview

The PFF Protocol is deployed on **Polygon Mainnet** (Chain ID: 137). All transactions require **MATIC** for gas fees.

**Key Concepts:**
- **MATIC**: Native gas token on Polygon - required for all transactions
- **Gas Fees**: Typically 0.001-0.01 MATIC per transaction (~$0.001-$0.01 USD)
- **User Responsibility**: Users must have MATIC in their wallet to interact with PFF contracts

---

## Deployed Contracts (Polygon Mainnet)

- **VIDA CAP Token**: `0xDc6EFba149b47f6F6d77AC0523c51F204964C12E`
- **ngnVIDA Token**: `0x5dD456B88f2be6688E7A04f78471A3868bd06811`
- **Foundation Vault**: `0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0`
- **National Treasury**: `0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4`

All contracts use MATIC for gas fees.

---

## How Users Get MATIC for Gas

Users need MATIC to interact with PFF Protocol contracts. Here are the recommended ways:

### 1. **Buy MATIC on Exchanges**
- Binance, Coinbase, Kraken, etc.
- Withdraw directly to Polygon network
- Minimum: 0.1 MATIC (~$0.10 USD) is enough for hundreds of transactions

### 2. **Bridge from Ethereum**
- Use Polygon Bridge: https://wallet.polygon.technology/
- Bridge ETH or other tokens to Polygon
- Swap for MATIC on Polygon DEXs

### 3. **Faucets (Testnet Only)**
- For testing: https://faucet.polygon.technology/
- Mainnet: Users must acquire MATIC through exchanges

### 4. **On-Ramp Services**
- Transak, MoonPay, Ramp Network
- Buy MATIC directly with credit card
- Delivered to Polygon wallet

---

## Gas Fee Estimates

Typical gas costs on Polygon for PFF Protocol operations:

| Operation | Estimated Gas (MATIC) | USD Cost |
|-----------|----------------------|----------|
| VIDA Transfer | 0.001 - 0.005 | $0.001 - $0.005 |
| ngnVIDA Transfer | 0.001 - 0.005 | $0.001 - $0.005 |
| Vitalization (Sovereign Pulse) | 0.005 - 0.01 | $0.005 - $0.01 |
| Contract Interaction | 0.002 - 0.01 | $0.002 - $0.01 |

**Note:** Gas prices fluctuate based on network congestion. Polygon is typically very cheap.

---

## Developer Guide: Checking User Gas Balance

**Check if user has enough MATIC for transactions:**

```typescript
import { ethers } from 'ethers';

async function checkGasBalance(userAddress: string): Promise<boolean> {
  const provider = new ethers.providers.JsonRpcProvider(
    'https://polygon-rpc.com'
  );

  const balance = await provider.getBalance(userAddress);
  const minGas = ethers.utils.parseEther('0.001'); // 0.001 MATIC minimum

  return balance.gte(minGas);
}
```

**Display gas balance in UI:**

```typescript
const balance = await provider.getBalance(userAddress);
const maticBalance = ethers.utils.formatEther(balance);
console.log(`User has ${maticBalance} MATIC`);
```

---

## Network Configuration

**Polygon Mainnet:**
- **Chain ID**: 137
- **RPC URL**: https://polygon-rpc.com
- **Block Explorer**: https://polygonscan.com
- **Currency Symbol**: MATIC

**Add to MetaMask:**
```javascript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x89', // 137 in hex
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com']
  }]
});
```

---

## Future: Gasless Transactions (Meta-Transactions)

**Phase 2 Enhancement:**

The PFF Protocol may implement **ERC-2771 meta-transactions** in the future, allowing:
- Users to sign transactions without MATIC
- Protocol relayer pays gas fees
- User experience: completely gasless

**Implementation would require:**
1. Deploy Trusted Forwarder contract
2. Update PFF contracts to support meta-transactions
3. Create relayer service to submit transactions
4. Frontend integration for signature-based transactions

**Status:** Not implemented in Phase 1. Users must have MATIC for now.


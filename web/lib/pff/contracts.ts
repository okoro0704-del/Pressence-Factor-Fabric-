/**
 * PFF Protocol Smart Contract Addresses and ABIs
 * 
 * Deployed on Polygon/RSK
 */

// ============================================================================
// CONTRACT ADDRESSES
// ============================================================================

export const PFF_CONTRACTS = {
  // Core VIDA CAP Token (Dual-Vault System)
  FOUNDATION_VAULT: "0xD42C5b854319e43e2F9e2c387b13b84D1dF542E0",
  
  // National Treasury (SAMM - Sovereign Automated Market Maker)
  NATIONAL_TREASURY: "0x5E8474D3BaaF27A4531F34f6fA8c9E237ce1ebb4",
  
  // VIDA CAP Token (ERC20 interface)
  VIDA_CAP_TOKEN: "0xDc6EFba149b47f6F6d77AC0523c51F204964C12E",
  
  // ngnVIDA Token (Nigerian VIDA - pegged 1:1 with Naira)
  NGN_VIDA_TOKEN: "0x5dD456B88f2be6688E7A04f78471A3868bd06811",
} as const;

// ============================================================================
// EXCHANGE RATES
// ============================================================================

export const EXCHANGE_RATES = {
  // 1 VIDA CAP = 1,345,450 ngnVIDA (1:1 with Nigerian Naira)
  VIDA_TO_NGN: 1_345_450,
  NGN_TO_VIDA: 1 / 1_345_450,
} as const;

// ============================================================================
// CONTRACT ABIs (Minimal - only functions we need)
// ============================================================================

export const FOUNDATION_VAULT_ABI = [
  // Read Functions
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getVaultBalances",
    outputs: [
      { name: "spendable", type: "uint256" },
      { name: "locked", type: "uint256" },
      { name: "total", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Write Functions
  {
    inputs: [
      { name: "_citizen", type: "address" },
      { name: "_nation", type: "address" },
    ],
    name: "vitalize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const NATIONAL_TREASURY_ABI = [
  // Read Functions
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_vidaCapAmount", type: "uint256" }],
    name: "calculateNgnVidaAmount",
    outputs: [{ name: "ngnVidaAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_ngnVidaAmount", type: "uint256" }],
    name: "calculateVidaCapAmount",
    outputs: [{ name: "vidaCapAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      { name: "vidaCapReserve_", type: "uint256" },
      { name: "ngnVidaSupply_", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Write Functions
  {
    inputs: [{ name: "_vidaCapAmount", type: "uint256" }],
    name: "swapVidaToNgn",
    outputs: [{ name: "ngnVidaAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_ngnVidaAmount", type: "uint256" }],
    name: "swapNgnToVida",
    outputs: [{ name: "vidaCapAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  // Read Functions
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Write Functions
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;


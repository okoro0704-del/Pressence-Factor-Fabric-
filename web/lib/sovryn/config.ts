/**
 * PFF × Sovryn — Rootstock (RSK) / Sovryn config.
 * Rootstock Mainnet: Chain ID 30, Symbol RBTC (Bitcoin Layer 2).
 */

export const RSK_MAINNET = {
  chainId: 30,
  name: 'Rootstock',
  rpc: 'https://public-node.rsk.co',
  currency: 'RBTC',
  symbol: 'RBTC' as const,
  blockExplorer: 'https://explorer.rsk.co',
};

/** Sovryn Dollar (DLLR) — RSK mainnet. Gold/Silver branding. */
export const DLLR_ADDRESS = '0xc141156911E8db99ce472824652208Aa201EE76d' as const;

/** USDT (bridged rUSDT) on RSK mainnet. Green branding. Override with NEXT_PUBLIC_USDT_ADDRESS. */
export const USDT_ADDRESS =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USDT_ADDRESS?.trim()) ||
  '0xEf213441a85DF4d7acBdAe0Cf78004E1e486BB96';

/** Zero protocol ZUSD (0% interest). */
export const ZUSD_ADDRESS = '0xdB107FA69E33f05180a4C2cE9c2E7CB481645C2d' as const;

/** Sovryn Wealth Dashboard — deep-link after Master Handshake. */
export const SOVRYN_WEALTH_DASHBOARD_URL = 'https://sovryn.app';

/** VIDA token contract on RSK — mints 5 VIDA to verified user wallet. Use env NEXT_PUBLIC_VIDA_TOKEN_ADDRESS if set. */
export const VIDA_TOKEN_ADDRESS =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VIDA_TOKEN_ADDRESS?.trim()) ||
  '0x0000000000000000000000000000000000000000';

/** 5 VIDA minted per verified user (Sovryn smart contract). */
export const VIDA_MINT_AMOUNT = 5;

/** National Vault: receives 5 VIDA on verification (70% locked, 30% liquid). Set in Edge Function env NATIONAL_VAULT_ADDRESS. */
export const NATIONAL_VAULT_ADDRESS =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_NATIONAL_VAULT_ADDRESS?.trim()) ||
  '';

/** Sentinel Wallet (Hub): receives 0.1 VIDA ($100) from citizen spendable. Set in Edge Function env SENTINEL_WALLET_ADDRESS. */
export const SENTINEL_WALLET_ADDRESS =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SENTINEL_WALLET_ADDRESS?.trim()) ||
  '';

/** vNGN (VIDA Naira) — placeholder contract on RSK. Set when token is deployed. */
export const VNGN_ADDRESS =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VNGN_ADDRESS?.trim()) ||
  '0x0000000000000000000000000000000000000000';

/** Sovryn Swap contract (e.g. SwapNetwork) for convertByPath — optional; when set, swap uses contract. */
export const SOVRYN_SWAP_CONTRACT_ADDRESS =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SOVRYN_SWAP_CONTRACT?.trim()) || '';

/**
 * PFF × Sovryn — Rootstock (RSK) / Sovryn config.
 * Chain, RPC, and contract addresses for DLLR, Zero, Spot.
 */

export const RSK_MAINNET = {
  chainId: 30,
  name: 'Rootstock',
  rpc: 'https://public-node.rsk.co',
  currency: 'RBTC',
  blockExplorer: 'https://explorer.rsk.co',
};

/** Sovryn Dollar (DLLR) — RSK mainnet. */
export const DLLR_ADDRESS = '0xc141156911E8db99ce472824652208Aa201EE76d' as const;

/** Zero protocol ZUSD (0% interest). */
export const ZUSD_ADDRESS = '0xdB107FA69E33f05180a4C2cE9c2E7CB481645C2d' as const;

/** Sovryn Wealth Dashboard — deep-link after Master Handshake. */
export const SOVRYN_WEALTH_DASHBOARD_URL = 'https://sovryn.app';

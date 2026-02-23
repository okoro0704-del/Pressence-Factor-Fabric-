/**
 * Protocol Vault — token list for Multi-Currency Liquidity Bridge.
 * DLLR and USDT on Rootstock (RSK) with display metadata (icons: Gold/Silver for DLLR, Green for USDT).
 */

import { DLLR_ADDRESS, USDT_ADDRESS } from './config';

export interface RSKToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  /** UI: 'dllr' | 'usdt' for icon/color styling. */
  theme: 'dllr' | 'usdt';
}

export const RSK_TOKENS: RSKToken[] = [
  {
    symbol: 'DLLR',
    name: 'Sovryn Dollar',
    address: DLLR_ADDRESS,
    decimals: 18,
    theme: 'dllr', // Gold/Silver
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: USDT_ADDRESS,
    decimals: 18,
    theme: 'usdt', // Green
  },
];

export function getTokenBySymbol(symbol: string): RSKToken | undefined {
  return RSK_TOKENS.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
}

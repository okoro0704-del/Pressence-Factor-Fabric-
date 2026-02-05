/**
 * Sovereign Wallet — asset and activity types.
 */

export type AssetSymbol = 'VIDA' | 'DLLR' | 'USDT' | 'vNGN';

export interface AssetBalance {
  symbol: AssetSymbol;
  balance: number;
  usdValue: number;
  /** VIDA only: spendable amount (total - 4 locked). */
  spendable?: number;
  /** VIDA only: locked as Future Wealth. */
  locked?: number;
}

export interface WalletActivityItem {
  id: string;
  type: 'send' | 'receive' | 'swap';
  symbol: AssetSymbol;
  amount: number;
  amountUsd?: number;
  label: string;
  date: string;
  /** Optional secondary asset for swaps. */
  secondarySymbol?: AssetSymbol;
}

export interface LinkedBankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

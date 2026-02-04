/**
 * Merchant Mode — QR and wallet_address for VIDA-accepting merchants.
 * When toggled, the merchant's wallet_address (identity anchor phone) is used to generate
 * a permanent payment QR. Payment URI: pff://pay?to=<wallet_address>
 */

const MERCHANT_MODE_KEY = 'pff_merchant_mode';
const MERCHANT_WALLET_KEY = 'pff_merchant_wallet_address';

export function isMerchantMode(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(MERCHANT_MODE_KEY) === 'true';
}

export function setMerchantMode(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(MERCHANT_MODE_KEY, enabled ? 'true' : 'false');
}

/** Wallet address for payment QR — defaults to identity anchor phone (E.164). */
export function getMerchantWalletAddress(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(MERCHANT_WALLET_KEY);
}

export function setMerchantWalletAddress(address: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(MERCHANT_WALLET_KEY, address);
}

/** Payment URI that the QR code encodes — citizen scans to pay this merchant. */
export function getMerchantPaymentUri(walletAddress: string): string {
  return `pff://pay?to=${encodeURIComponent(walletAddress)}&label=Merchant`;
}

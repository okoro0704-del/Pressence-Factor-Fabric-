/**
 * PFF × Sovryn — Send VIDA, DLLR, or USDT to a recipient address on RSK.
 * Uses internal signer (derived from recovery seed) when phoneNumber is provided.
 */

import { Contract, parseUnits, type Signer } from 'ethers';
import { DLLR_ADDRESS, USDT_ADDRESS, VIDA_TOKEN_ADDRESS } from './config';
import { getBrowserProvider } from './wallet';
import { getInternalSigner } from './internalSigner';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export type SendTokenType = 'VIDA' | 'DLLR' | 'USDT';

function getTokenAddress(token: SendTokenType): string {
  switch (token) {
    case 'VIDA':
      return VIDA_TOKEN_ADDRESS;
    case 'DLLR':
      return DLLR_ADDRESS;
    case 'USDT':
      return USDT_ADDRESS;
    default:
      return DLLR_ADDRESS;
  }
}

export interface SendTokenParams {
  token: SendTokenType;
  toAddress: string;
  amount: string; // Human-readable (e.g. "10.5")
}

export interface SendTokenOptions {
  /** When set, use internal signer from recovery seed (no MetaMask popup). */
  phoneNumber?: string;
  encryptedSeed?: import('./internalSigner').EncryptedSeedPayload;
}

export interface SendTokenResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Send VIDA, DLLR, or USDT to an RSK address.
 * When options.phoneNumber is set: uses internal signer (derived from seed).
 * Otherwise: uses browser provider (MetaMask).
 */
export async function sendToken(
  params: SendTokenParams,
  options?: SendTokenOptions
): Promise<SendTokenResult> {
  const { token, toAddress, amount } = params;

  if (!toAddress || toAddress.length !== 42 || !toAddress.startsWith('0x')) {
    return { success: false, error: 'Invalid recipient address (must be 0x + 40 hex chars)' };
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return { success: false, error: 'Invalid amount' };
  }

  const contractAddress = getTokenAddress(token);
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    return { success: false, error: `${token} contract not configured` };
  }

  let signer: Signer | null = null;
  if (options?.phoneNumber?.trim()) {
    signer = await getInternalSigner(options.phoneNumber.trim(), {
      encryptedSeed: options.encryptedSeed ?? undefined,
    });
    if (!signer) {
      return { success: false, error: 'Recovery seed not available. Complete setup first.' };
    }
  } else {
    const provider = await getBrowserProvider();
    if (!provider) return { success: false, error: 'No wallet provider found' };
    signer = await provider.getSigner();
  }

  try {
    const contract = new Contract(contractAddress, ERC20_ABI, signer);
    const decimals = (await contract.decimals()) as number;
    const amountWei = parseUnits(amount, decimals);
    const signerAddress = await signer.getAddress();
    const balance = (await contract.balanceOf(signerAddress)) as bigint;

    if (balance < amountWei) {
      return { success: false, error: `Insufficient ${token} balance` };
    }

    const tx = await contract.transfer(toAddress, amountWei);
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      return { success: false, error: 'Transaction failed' };
    }

    return { success: true, txHash: receipt.hash };
  } catch (error) {
    console.error('[sendToken] Error:', error);
    const msg = error instanceof Error ? error.message : `Failed to send ${token}`;
    const gasRelated = /insufficient funds|out of gas|not enough gas|gas required/i.test(msg);
    return {
      success: false,
      error:
        options?.phoneNumber && gasRelated
          ? 'Gas insufficient. Ensure your wallet has a small amount of RBTC for fees.'
          : msg,
    };
  }
}

export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

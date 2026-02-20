/**
 * PFF × Sovryn — DLLR Send/Transfer Functions
 * Uses internal signer (derived from seed) when phoneNumber is provided — no Connect Wallet popup.
 */

import { ethers } from 'ethers';
import { DLLR_ADDRESS } from './config';
import { getBrowserProvider } from './wallet';
import { getInternalSigner } from './internalSigner';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export interface SendDLLRParams {
  toAddress: string;
  amount: string; // Human-readable amount (e.g., "100.50")
}

export interface SendDLLROptions {
  /** When set, use internal signer from recovery seed (no MetaMask popup). */
  phoneNumber?: string;
}

export interface SendDLLRResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Send DLLR to an external address.
 * When options.phoneNumber is set: uses internal signer (derived from seed) — no Connect Wallet.
 * Otherwise: uses browser provider (MetaMask); may trigger connection popup.
 */
export async function sendDLLR(
  params: SendDLLRParams,
  options?: SendDLLROptions
): Promise<SendDLLRResult> {
  try {
    const { toAddress, amount } = params;

    // Validate address
    if (!toAddress || toAddress.length !== 42 || !toAddress.startsWith('0x')) {
      return { success: false, error: 'Invalid recipient address' };
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    // Prefer internal signer (no popup) when phoneNumber is provided
    let signer: ethers.Signer | null = null;
    if (options?.phoneNumber?.trim()) {
      signer = await getInternalSigner(options.phoneNumber.trim());
      if (!signer) return { success: false, error: 'Recovery seed not available. Complete setup first.' };
    } else {
      const provider = await getBrowserProvider();
      if (!provider) return { success: false, error: 'No wallet provider found' };
      signer = provider.getSigner();
    }

    const contract = new ethers.Contract(DLLR_ADDRESS, ERC20_ABI, signer);

    // Get decimals
    const decimals = await contract.decimals() as number;

    // Parse amount to wei
    const amountWei = ethers.utils.parseUnits(amount, decimals);

    // Check balance
    const signerAddress = await signer.getAddress();
    const balance = await contract.balanceOf(signerAddress) as bigint;

    if (balance < amountWei) {
      return { success: false, error: 'Insufficient DLLR balance' };
    }

    // Execute transfer
    const tx = await contract.transfer(toAddress, amountWei);
    
    // Wait for confirmation
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      return { success: false, error: 'Transaction failed' };
    }

    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error('[sendDLLR] Error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to send DLLR';
    const gasRelated = /insufficient funds|out of gas|not enough gas|gas required/i.test(msg);
    return {
      success: false,
      error: options?.phoneNumber && gasRelated
        ? 'Gas insufficient. The Protocol Relayer can cover fees — try again or ensure your wallet has a small amount of RBTC.'
        : msg,
    };
  }
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}


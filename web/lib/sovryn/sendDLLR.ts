/**
 * PFF × Sovryn — DLLR Send/Transfer Functions
 * Presence-gated DLLR transfers to external wallets/exchanges
 */

import { Contract, parseUnits } from 'ethers';
import { DLLR_ADDRESS } from './config';
import { getBrowserProvider } from './wallet';

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

export interface SendDLLRResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Send DLLR to an external address (exchange, wallet, etc.)
 * Requires wallet connection and presence verification (handled by caller)
 */
export async function sendDLLR(params: SendDLLRParams): Promise<SendDLLRResult> {
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

    // Get browser provider and signer
    const provider = await getBrowserProvider();
    if (!provider) {
      return { success: false, error: 'No wallet provider found' };
    }

    const signer = await provider.getSigner();
    const contract = new Contract(DLLR_ADDRESS, ERC20_ABI, signer);

    // Get decimals
    const decimals = await contract.decimals() as number;

    // Parse amount to wei
    const amountWei = parseUnits(amount, decimals);

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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send DLLR',
    };
  }
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}


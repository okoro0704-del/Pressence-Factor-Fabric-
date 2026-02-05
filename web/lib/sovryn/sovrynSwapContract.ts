/**
 * PFF × Sovryn — Swap contract interaction (convertByPath / swap).
 * Hook up Sovryn Swap contract ABI so the app can call convertByPath or swap directly.
 */

import { Contract, type Signer } from 'ethers';
import { SOVRYN_SWAP_CONTRACT_ADDRESS } from './config';
import { VIDA_TOKEN_ADDRESS } from './config';
import { DLLR_ADDRESS } from './config';

/** Minimal ABI for Sovryn-style swap (convertByPath or swap). */
const SOVRYN_SWAP_ABI = [
  'function convertByPath(uint256 _amount, address[] _path) returns (uint256)',
  'function swap(address sourceToken, address targetToken, uint256 amount) returns (uint256)',
  'function getReturnByPath(uint256 _amount, address[] _path) view returns (uint256)',
];

export interface SwapByPathParams {
  amountWei: bigint;
  path: string[]; // e.g. [VIDA, DLLR]
}

/**
 * Execute swap via Sovryn contract convertByPath when contract address is configured.
 * Returns tx hash or null if contract not configured / call fails.
 */
export async function swapByPath(
  signer: Signer,
  amountWei: bigint,
  path: string[]
): Promise<{ txHash: string } | { error: string }> {
  if (!SOVRYN_SWAP_CONTRACT_ADDRESS || path.length < 2) {
    return { error: 'Swap contract not configured or invalid path' };
  }

  try {
    const contract = new Contract(SOVRYN_SWAP_CONTRACT_ADDRESS, SOVRYN_SWAP_ABI, signer);
    const tx = await contract.convertByPath(amountWei, path);
    const receipt = await tx.wait();
    if (!receipt?.hash) return { error: 'No tx hash' };
    return { txHash: receipt.hash };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}

/**
 * Build path for VIDA → DLLR (token addresses on RSK).
 */
export function getVidaToDllrPath(): string[] {
  if (!VIDA_TOKEN_ADDRESS || VIDA_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return [DLLR_ADDRESS];
  }
  return [VIDA_TOKEN_ADDRESS, DLLR_ADDRESS];
}

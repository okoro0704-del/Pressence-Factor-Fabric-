/**
 * PFF × Sovryn — Real-time VIDA balance from blockchain (balanceOf).
 * Use this instead of only reading from Supabase so the app shows on-chain balance.
 */

import { Contract, JsonRpcProvider, formatUnits } from 'ethers';
import { RSK_MAINNET, VIDA_TOKEN_ADDRESS } from './config';

const VIDA_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export interface VidaBalanceResult {
  ok: true;
  balance: string;
  balanceFormatted: string;
  decimals: number;
}
export interface VidaBalanceError {
  ok: false;
  error: string;
}

/**
 * Fetch VIDA balance for an RSK address by calling balanceOf on the VIDA token contract.
 */
export async function getVidaBalanceOnChain(
  userAddress: string
): Promise<VidaBalanceResult | VidaBalanceError> {
  const address = userAddress?.trim();
  if (!address || !address.startsWith('0x')) {
    return { ok: false, error: 'Valid Ethereum address required' };
  }

  const rpcUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_RSK_RPC_URL?.trim()) ||
    RSK_MAINNET.rpc;

  if (!VIDA_TOKEN_ADDRESS || VIDA_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return { ok: false, error: 'VIDA token contract not configured' };
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(VIDA_TOKEN_ADDRESS, VIDA_ABI, provider);
    const [balanceWei, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals().catch(() => 18),
    ]);
    const dec = Number(decimals);
    const balanceStr = balanceWei.toString();
    const formatted = formatUnits(balanceStr, dec);
    const formattedDisplay = parseFloat(formatted).toFixed(2);
    return {
      ok: true,
      balance: balanceStr,
      balanceFormatted: formattedDisplay,
      decimals: dec,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

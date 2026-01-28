/**
 * PFF × Sovryn — DLLR (Sovryn Dollar) balance and helpers.
 */

import { Contract, JsonRpcProvider } from 'ethers';
import { DLLR_ADDRESS } from './config';
import { getRSKProvider } from './wallet';

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export async function getDLLRBalance(address: string): Promise<{ raw: bigint; formatted: string }> {
  const provider = await getRSKProvider();
  const contract = new Contract(DLLR_ADDRESS, ERC20_ABI, provider);
  const [balance, decimals] = await Promise.all([
    contract.balanceOf(address) as Promise<bigint>,
    contract.decimals() as Promise<number>,
  ]);
  const divisor = 10 ** decimals;
  const value = Number(balance) / divisor;
  const formatted = value >= 1e9 ? value.toExponential(2) : value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  return { raw: balance, formatted };
}

export { DLLR_ADDRESS };

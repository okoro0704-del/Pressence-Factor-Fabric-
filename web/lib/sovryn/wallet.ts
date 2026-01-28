/**
 * PFF × Sovryn — Wallet helpers for RSK (MetaMask, Defiant, hardware).
 * Non-custodial; sign only after PFF presence verification.
 */

import { BrowserProvider, JsonRpcProvider } from 'ethers';
import { RSK_MAINNET } from './config';

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

export function getEth(): Window['ethereum'] {
  return typeof window !== 'undefined' ? window.ethereum : undefined;
}

export async function getBrowserProvider(): Promise<BrowserProvider | null> {
  const eth = getEth();
  if (!eth) return null;
  return new BrowserProvider(eth);
}

export async function ensureRSK(): Promise<boolean> {
  const eth = getEth();
  if (!eth) return false;
  try {
    const chainIdHex = (await eth.request({ method: 'eth_chainId' })) as string;
    const chainId = parseInt(chainIdHex, 16);
    if (chainId === RSK_MAINNET.chainId) return true;
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${RSK_MAINNET.chainId.toString(16)}` }],
    });
    return true;
  } catch {
    try {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${RSK_MAINNET.chainId.toString(16)}`,
            chainName: RSK_MAINNET.name,
            nativeCurrency: { name: RSK_MAINNET.currency, symbol: RSK_MAINNET.currency, decimals: 18 },
            rpcUrls: [RSK_MAINNET.rpc],
            blockExplorerUrls: [RSK_MAINNET.blockExplorer],
          },
        ],
      });
      return true;
    } catch {
      return false;
    }
  }
}

export async function getRSKProvider(): Promise<JsonRpcProvider> {
  return new JsonRpcProvider(RSK_MAINNET.rpc);
}

export async function getConnectedAddress(): Promise<string | null> {
  const eth = getEth();
  if (!eth) return null;
  try {
    const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
    return accounts[0] ?? null;
  } catch {
    return null;
  }
}

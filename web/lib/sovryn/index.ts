/**
 * PFF × Sovryn — Presence-gated DeFi on Rootstock (RSK).
 */

export { withPresence, type PresenceGatedFn } from './withPresence';
export {
  getBrowserProvider,
  getRSKProvider,
  ensureRSK,
  getConnectedAddress,
  getEth,
  getRbtcBalance,
} from './wallet';
export { getInternalSigner, getSovereignSigner, MIN_RBTC_FOR_GAS } from './internalSigner';
export { useNativeBalances, type NativeBalances } from './useNativeBalances';
export { getDLLRBalance } from './dllr';
export { getUSDTBalance } from './usdtBalance';
export { RSK_TOKENS, getTokenBySymbol, type RSKToken } from './tokenList';
export { sendDLLR, isValidAddress, type SendDLLRParams, type SendDLLRResult, type SendDLLROptions } from './sendDLLR';
export {
  executeSovereignSwap,
  calculateDLLROutput,
  calculateVIDAInput,
  type SovereignSwapParams,
  type SovereignSwapResult,
  type SovereignLedgerEntry,
} from './sovereignSwap';
export {
  runMasterHandshake,
  isMasterHandshakeComplete,
  setMasterHandshakeComplete,
  type MasterHandshakeResult,
} from './bridge';
export { RSK_MAINNET, DLLR_ADDRESS, USDT_ADDRESS, ZUSD_ADDRESS, SOVRYN_WEALTH_DASHBOARD_URL, VIDA_TOKEN_ADDRESS, VIDA_MINT_AMOUNT } from './config';
export { deriveRSKWalletFromSeed, RSK_DERIVATION_PATH } from './derivedWallet';
export { mintVidaToken, type MintVidaResult } from './vidaMint';
export { startVerifiedMintListener, subscribeVerifiedMint } from './verifiedMintListener';
export { getVidaBalanceOnChain, type VidaBalanceResult, type VidaBalanceError } from './vidaBalance';

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
} from './wallet';
export { getDLLRBalance } from './dllr';
export { sendDLLR, isValidAddress, type SendDLLRParams, type SendDLLRResult } from './sendDLLR';
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
export { RSK_MAINNET, DLLR_ADDRESS, ZUSD_ADDRESS, SOVRYN_WEALTH_DASHBOARD_URL, VIDA_TOKEN_ADDRESS, VIDA_MINT_AMOUNT } from './config';
export { deriveRSKWalletFromSeed, RSK_DERIVATION_PATH } from './derivedWallet';
export { mintVidaToken, type MintVidaResult } from './vidaMint';
export { startVerifiedMintListener, subscribeVerifiedMint } from './verifiedMintListener';
export { getVidaBalanceOnChain, type VidaBalanceResult, type VidaBalanceError } from './vidaBalance';

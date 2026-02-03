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
  runMasterHandshake,
  isMasterHandshakeComplete,
  setMasterHandshakeComplete,
  type MasterHandshakeResult,
} from './bridge';
export { RSK_MAINNET, DLLR_ADDRESS, ZUSD_ADDRESS, SOVRYN_WEALTH_DASHBOARD_URL } from './config';

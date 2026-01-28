/**
 * PFF × Sovryn — Presence-gated transaction middleware.
 * No trade or loan can be initiated without a successful biometric handshake.
 */

import { fetchChallenge, generatePresenceProof } from '@/lib/handshake';

export type PresenceGatedFn<T> = () => Promise<T>;

/**
 * Requires a successful Presence Proof (generatePresenceProof) before running the transaction.
 * Use for any contract write to Sovryn Zero, Spot Exchange, or other DeFi actions.
 *
 * Flow: fetchChallenge → generatePresenceProof (biometric) → run transaction.
 * If proof fails, the transaction is never executed.
 *
 * @example
 * import { withPresence } from '@/lib/sovryn';
 * import { getBrowserProvider } from '@/lib/sovryn';
 * await withPresence(async () => {
 *   const provider = await getBrowserProvider();
 *   const signer = await provider!.getSigner();
 *   const contract = new Contract(ZERO_ADDR, ABI, signer);
 *   const tx = await contract.borrow(...);
 *   await tx.wait();
 *   return tx;
 * });
 */
export async function withPresence<T>(transaction: PresenceGatedFn<T>): Promise<T> {
  const challenge = await fetchChallenge();
  if (!challenge) {
    throw new Error('Could not fetch challenge. Connect to the internet and try again.');
  }
  const result = await generatePresenceProof(undefined, challenge);
  if (!result.success || !result.proof) {
    throw new Error(result.error ?? 'Presence verification failed. No transaction was sent.');
  }
  return transaction();
}

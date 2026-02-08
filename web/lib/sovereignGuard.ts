/**
 * Sovereign Guard — Prevent backtracking into registration/vitalization when already verified.
 * If user is 3/4 or 4/4 (Face, Palm, Anchor, optional GPS), redirect to Dashboard instead of loops.
 */

import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import { getTripleAnchorState } from '@/lib/tripleAnchor';

/** True when user has at least core mesh (3/4): Face, Palm, Identity Anchor verified. */
export function isAlreadyVerified(): boolean {
  if (typeof window === 'undefined') return false;
  const phone = getIdentityAnchorPhone();
  if (!phone) return false;
  const anchors = getTripleAnchorState();
  return anchors.face && anchors.fingerprint && anchors.device;
}

/**
 * PFF Backend — Minting trigger logic.
 * Trigger mint once face_verification == SUCCESS, regardless of whether device_id is present.
 * Supports Ghost Vault (face-only) and Registrar proxy flows.
 */

export const FACE_VERIFICATION_SUCCESS = 'SUCCESS';

/**
 * Whether the mint should execute. Runs when face verification has succeeded;
 * device_id is not required (allows Ghost Vault / face-only mint).
 */
export function shouldTriggerMint(faceVerification: string | null | undefined): boolean {
  return faceVerification === FACE_VERIFICATION_SUCCESS;
}

/**
 * Trigger mint when face_verification == SUCCESS.
 * Call this from any flow that has set face_verification to SUCCESS (e.g. after face scan).
 * Does not require device_id — mint runs on face success only.
 */
export async function triggerMint(params: {
  faceHash: string;
  faceVerification: string;
  citizenId?: string;
  pffId?: string;
  deviceId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!shouldTriggerMint(params.faceVerification)) {
    return { ok: false, error: 'Mint only runs when face_verification is SUCCESS' };
  }
  const { faceHash, citizenId, pffId } = params;
  if (!faceHash?.trim()) {
    return { ok: false, error: 'face_hash required for mint' };
  }
  try {
    const { mintOnVitalization } = await import('./vidaCap');
    const id = citizenId ?? `ghost_${faceHash.trim().slice(0, 16)}`;
    const pff = pffId ?? `pff_${faceHash.trim().slice(0, 8)}`;
    await mintOnVitalization(id, pff);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

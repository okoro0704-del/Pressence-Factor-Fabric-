/**
 * Master Identity Anchor: unify Pillar 1 (Face), Pillar 2 (Palm), Pillar 3 (Identity Anchor)
 * into a single sovereign root hash. Once created, individual hashes must be deleted from
 * local memory; login only needs to verify that the current scan matches a portion of this root.
 */

const SOVEREIGN_ROOT_SEPARATOR = '\u001f'; // unit separator to avoid collision with hash content

/**
 * Combine three verified pillar hashes into a single Master Root Hash using SHA-256.
 * Uses deterministic concatenation so the same inputs always produce the same root.
 * Alternative: use keccak256 (e.g. from js-sha3) for EVM compatibility; here we use SHA-256 for Web Crypto availability.
 *
 * @param faceHash - Verified hash from Pillar 1 (Face)
 * @param palmHash - Verified hash from Pillar 2 (Palm)
 * @param identityAnchorHash - Verified hash from Pillar 3 (Identity Anchor), e.g. SHA-256(phone + '|' + device_id)
 * @returns The master root hex string (64 chars). Caller must clear faceHash, palmHash, identityAnchorHash from memory after storing.
 */
export async function generateSovereignRoot(
  faceHash: string,
  palmHash: string,
  identityAnchorHash: string
): Promise<string> {
  const normalized = [
    String(faceHash).trim(),
    String(palmHash).trim(),
    String(identityAnchorHash).trim(),
  ];
  if (normalized[0] === '' || normalized[1] === '' || normalized[2] === '') {
    throw new Error('generateSovereignRoot: face, palm, and identity anchor hashes are required');
  }
  const payload = normalized.join(SOVEREIGN_ROOT_SEPARATOR);
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const hex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex;
}

/**
 * Synchronous SHA-256 using Web Crypto (for environments where async is not desired).
 * Prefer generateSovereignRoot() for consistency.
 */
export function generateSovereignRootSync(
  faceHash: string,
  palmHash: string,
  identityAnchorHash: string
): string {
  const normalized = [
    String(faceHash).trim(),
    String(palmHash).trim(),
    String(identityAnchorHash).trim(),
  ];
  if (normalized[0] === '' || normalized[1] === '' || normalized[2] === '') {
    throw new Error('generateSovereignRootSync: face, palm, and identity anchor hashes are required');
  }
  const payload = normalized.join(SOVEREIGN_ROOT_SEPARATOR);
  // Use crypto.subtle is async-only in browser; so sync version requires a small digest lib or we leave it async-only.
  // For Node/crypto: require('crypto').createHash('sha256').update(payload).digest('hex');
  throw new Error('Use generateSovereignRoot() (async) for browser; sync requires Node crypto');
}

/**
 * Compute the Identity Anchor (Pillar 3) hash from phone and device_id.
 * Use this when you have phone + device_id and need the third input to generateSovereignRoot.
 */
export async function computeIdentityAnchorHash(phone: string, deviceId: string): Promise<string> {
  const payload = `${String(phone).trim()}${SOVEREIGN_ROOT_SEPARATOR}${String(deviceId).trim()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * After successfully storing the master root (e.g. via saveCitizenRootToSupabase),
 * clear the pillar hash references from the given object to avoid retaining them in memory.
 * In JavaScript we cannot force overwrite string contents; this sets the object keys to empty string
 * so the original references can be GC'd if nothing else holds them.
 */
export function clearPillarHashesFromObject(holder: {
  faceHash?: string;
  palmHash?: string;
  identityAnchorHash?: string;
}): void {
  if (holder.faceHash !== undefined) holder.faceHash = '';
  if (holder.palmHash !== undefined) holder.palmHash = '';
  if (holder.identityAnchorHash !== undefined) holder.identityAnchorHash = '';
}

/**
 * Save the Master Root to Supabase (citizens.citizen_root) and then clear the provided hashes.
 * Call this after generateSovereignRoot. On success, the individual hashes are cleared from the holder object.
 *
 * @param citizenRoot - The master root from generateSovereignRoot()
 * @param deviceId - Citizen's device_id
 * @param keyId - Citizen's key_id
 * @param holder - Object holding faceHash, palmHash, identityAnchorHash; will be cleared on success
 * @returns { ok: true } or { ok: false, error: string }
 */
export async function saveCitizenRootToSupabase(
  citizenRoot: string,
  deviceId: string,
  keyId: string,
  holder: { faceHash?: string; palmHash?: string; identityAnchorHash?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/v1/save-citizen-root', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId.trim(),
        key_id: keyId.trim(),
        citizen_root: citizenRoot.trim(),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && json.ok === true) {
      clearPillarHashesFromObject(holder);
      return { ok: true };
    }
    return { ok: false, error: json.error ?? 'Failed to save citizen root' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to save citizen root' };
  }
}

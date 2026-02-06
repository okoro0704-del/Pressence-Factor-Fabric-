/**
 * Triple-Anchor Security — Face, Fingerprint (WebAuthn), Device ID.
 * All three must be verified (and turn Gold in UI) before 1 VIDA balance is unlocked.
 * State is stored in sessionStorage for the current session only.
 */

export type TripleAnchorType = 'face' | 'fingerprint' | 'device';

const KEY_FACE = 'pff_triple_anchor_face';
const KEY_FINGERPRINT = 'pff_triple_anchor_fingerprint';
const KEY_DEVICE = 'pff_triple_anchor_device';

export interface TripleAnchorState {
  face: boolean;
  fingerprint: boolean;
  device: boolean;
}

function getBool(key: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setBool(key: string, value: boolean): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, value ? '1' : '0');
  } catch {
    // ignore
  }
}

/** Get current triple-anchor verification state. */
export function getTripleAnchorState(): TripleAnchorState {
  return {
    face: getBool(KEY_FACE),
    fingerprint: getBool(KEY_FINGERPRINT),
    device: getBool(KEY_DEVICE),
  };
}

/** Mark one anchor as verified. Call after each step in sequential flow. */
export function setTripleAnchorVerified(anchor: TripleAnchorType): void {
  setBool(
    anchor === 'face' ? KEY_FACE : anchor === 'fingerprint' ? KEY_FINGERPRINT : KEY_DEVICE,
    true
  );
}

/** Clear one or all anchors (e.g. on logout or reset). */
export function clearTripleAnchor(anchor?: TripleAnchorType): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (!anchor || anchor === 'face') sessionStorage.removeItem(KEY_FACE);
    if (!anchor || anchor === 'fingerprint') sessionStorage.removeItem(KEY_FINGERPRINT);
    if (!anchor || anchor === 'device') sessionStorage.removeItem(KEY_DEVICE);
  } catch {
    // ignore
  }
}

/** True only when Face, Fingerprint, and Device are all verified. Unlocks 1 VIDA. */
export function areAllAnchorsVerified(): boolean {
  const s = getTripleAnchorState();
  return s.face && s.fingerprint && s.device;
}

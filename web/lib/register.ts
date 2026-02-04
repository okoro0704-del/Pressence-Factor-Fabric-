/**
 * PFF — Biometric registration. Hardware-bound key via WebAuthn, stored via /vitalize/register.
 * When in Guest Mode, sends guestMode and hostDeviceId so the Sovereign Hub Access Fee (0.1 VIDA)
 * is transferred to the device owner's primary wallet after the grant is issued.
 */

import { createCredential, isWebAuthnSupported, isSecureContext } from './webauthn';
import { isGuestMode } from './guestMode';

const DEVICE_ID_KEY = 'pff_device_id';
const REG_API = '/api/vitalize/register';

function bufferToBase64Url(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf);
  let b64 = '';
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < u8.length; i += 3) {
    const a = u8[i] ?? 0;
    const b = u8[i + 1] ?? 0;
    const c = u8[i + 2] ?? 0;
    b64 +=
      ALPHABET[a >> 2] +
      ALPHABET[((a & 3) << 4) | (b >> 4)] +
      ALPHABET[((b & 15) << 2) | (c >> 6)] +
      ALPHABET[c & 63];
  }
  const pad = u8.length % 3;
  const out = pad ? b64.slice(0, b64.length - (3 - pad)) : b64;
  return out.replace(/\+/g, '-').replace(/\//g, '_');
}

function getOrCreateDeviceId(): string {
  if (typeof localStorage === 'undefined') return `pff_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `pff_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export interface RegisterResult {
  success: boolean;
  pffId?: string;
  error?: string;
}

/**
 * Register hardware-bound credential with biometrics (userVerification: required).
 * Stores credentialID and publicKey via /vitalize/register.
 */
export async function registerBiometric(userId: string, userName: string): Promise<RegisterResult> {
  if (!isSecureContext()) {
    return { success: false, error: 'PFF requires HTTPS or localhost.' };
  }
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn not supported. Use HTTPS and a supported browser.' };
  }
  const cred = await createCredential(userId, userName);
  if (!cred) return { success: false, error: 'Registration cancelled or failed.' };
  const response = cred.response as AuthenticatorAttestationResponse;
  const credentialId = bufferToBase64Url(cred.rawId);
  const attestationObject = bufferToBase64Url(response.attestationObject);
  const clientDataJSON = bufferToBase64Url(response.clientDataJSON);
  const deviceId = getOrCreateDeviceId();
  const guestMode = typeof sessionStorage !== 'undefined' && isGuestMode();
  try {
    const res = await fetch(REG_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentialId,
        attestationObject,
        clientDataJSON,
        deviceId,
        userName,
        ...(guestMode && { guestMode: true, hostDeviceId: deviceId }),
      }),
    });
    const data = (await res.json()) as { success?: boolean; pffId?: string; message?: string };
    if (!res.ok) {
      return { success: false, error: data.message ?? `Register failed (${res.status})` };
    }
    return { success: true, pffId: data.pffId };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { success: false, error: err };
  }
}

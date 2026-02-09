/**
 * Native Device Auth (WebAuthn) — registerDevicePasskey triggers the browser's
 * navigator.credentials.create prompt (Face ID / Fingerprint). Sovereign link: map
 * credentialId to citizen_hash in Supabase device_anchors table.
 */

import { createCredential, isWebAuthnSupported, isSecureContext } from '@/lib/webauthn';
import { linkPasskeyToDeviceAnchors } from '@/lib/deviceAnchors';

/**
 * Register a device passkey: triggers the browser's native navigator.credentials.create
 * prompt (Face ID / Fingerprint). Maps the resulting credentialId to the user's
 * citizen_hash in the Supabase device_anchors table (sovereign link).
 */
export async function registerDevicePasskey(
  phoneNumber: string,
  citizenHash: string,
  displayName?: string
): Promise<{ ok: true; credentialId: string } | { ok: false; error: string }> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Client only' };
  }
  if (!isSecureContext() || !isWebAuthnSupported()) {
    return { ok: false, error: 'WebAuthn not supported. Use HTTPS or localhost.' };
  }
  const phone = String(phoneNumber ?? '').trim();
  const citizen = String(citizenHash ?? '').trim();
  if (!phone || !citizen) {
    return { ok: false, error: 'Phone number and citizen_hash are required.' };
  }
  const name = displayName?.trim() || `PFF — ${phone.slice(-4)}`;

  try {
    const cred = await createCredential(phone, name);
    if (!cred?.id) {
      return { ok: false, error: 'Passkey creation was cancelled or failed.' };
    }
    const link = await linkPasskeyToDeviceAnchors(cred.id, phone, citizen);
    if (!link.ok) return { ok: false, error: link.error };
    return { ok: true, credentialId: cred.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export { linkPasskeyToDeviceAnchors, resolveIdentityFromCredentialId } from '@/lib/deviceAnchors';

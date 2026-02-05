/**
 * Sovereign Constitution — legal_approvals (constitution_version, signature_timestamp, signature_device_id).
 * 10 VIDA minting only begins AFTER the Constitution is signed and recorded.
 * If the Constitution is updated, the user must re-sign on next login.
 * BIOMETRIC DATA IS HASHED AND ENCRYPTED. RAW IMAGES ARE NEVER PERSISTED.
 */

import { supabase } from './supabase';
import { getSupabase } from './supabase';
import { verifyBiometricSignature, getCompositeDeviceFingerprint } from './biometricAuth';
import { waitForExternalFingerprint } from './externalScannerBridge';

/** Current constitution version; bump when Articles change to force re-sign. */
export const CURRENT_CONSTITUTION_VERSION = '1.0';

/** Check if user has signed the current constitution. */
export async function hasSignedConstitution(
  identityAnchor: string,
  version: string = CURRENT_CONSTITUTION_VERSION
): Promise<boolean> {
  const client = typeof window !== 'undefined' ? supabase : getSupabase();
  if (!client?.from) return false;
  try {
    const { data, error } = await (client as any)
      .from('legal_approvals')
      .select('id')
      .eq('identity_anchor', identityAnchor.trim())
      .eq('constitution_version', version)
      .maybeSingle();
    return !error && !!data?.id;
  } catch {
    return false;
  }
}

/** Record constitution acceptance (call only after successful biometric). Optional signature_device_id, external_fingerprint_hash (Legal Digital Thumbprint). */
export async function recordConstitutionSignature(
  identityAnchor: string,
  version: string = CURRENT_CONSTITUTION_VERSION,
  signatureDeviceId?: string | null,
  externalFingerprintHash?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = typeof window !== 'undefined' ? supabase : getSupabase();
  if (!client) return { ok: false, error: 'Supabase not available' };
  try {
    const payload: Record<string, unknown> = {
      identity_anchor: identityAnchor.trim(),
      constitution_version: version,
      signature_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    if (signatureDeviceId != null && signatureDeviceId !== '') {
      payload.signature_device_id = signatureDeviceId;
    }
    if (externalFingerprintHash != null && externalFingerprintHash !== '') {
      payload.external_fingerprint_hash = externalFingerprintHash;
    }
    const { error } = await (client as any)
      .from('legal_approvals')
      .upsert(payload, { onConflict: ['identity_anchor', 'constitution_version'] });
    if (error) return { ok: false, error: error.message ?? 'Failed to record signature' };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|webOS|Mobile/i.test(navigator.userAgent);
}

/**
 * Sign constitution with biometrics.
 * Mobile: uses built-in sensor (FaceID/TouchID) only for the legal agreement signature; device_id = composite device fingerprint.
 * PC/Hub: requires Face Pulse AND external USB/Bluetooth scanner as Legal Digital Thumbprint.
 */
export async function signConstitutionWithBiometrics(
  identityAnchorPhone: string,
  version: string = CURRENT_CONSTITUTION_VERSION
): Promise<{ ok: true; device_id: string; timestamp: string } | { ok: false; error: string }> {
  const trimmed = identityAnchorPhone?.trim();
  if (!trimmed) return { ok: false, error: 'Identity anchor required.' };

  const bioResult = await verifyBiometricSignature(trimmed);
  if (!bioResult.success) {
    return { ok: false, error: bioResult.error ?? 'Biometric verification failed.' };
  }
  if (bioResult.credential == null) {
    return { ok: false, error: 'Biometric credential required. Complete face or fingerprint scan.' };
  }

  const timestamp = new Date().toISOString();

  if (isMobileUserAgent()) {
    const compositeDeviceId = await getCompositeDeviceFingerprint();
    const recorded = await recordConstitutionSignature(
      trimmed,
      version,
      compositeDeviceId,
      null
    );
    if (!recorded.ok) return { ok: false, error: recorded.error };
    return { ok: true, device_id: compositeDeviceId, timestamp };
  }

  const externalSignal = await waitForExternalFingerprint(60_000).catch((e) => {
    return null;
  });
  if (!externalSignal?.fingerprintHash || !externalSignal?.scannerSerialNumber) {
    return {
      ok: false,
      error: 'Legal Digital Thumbprint required. Connect the external USB/Bluetooth scanner and scan your finger.',
    };
  }

  const recorded = await recordConstitutionSignature(
    trimmed,
    version,
    externalSignal.scannerSerialNumber,
    externalSignal.fingerprintHash
  );
  if (!recorded.ok) return { ok: false, error: recorded.error };

  return {
    ok: true,
    device_id: externalSignal.scannerSerialNumber,
    timestamp,
  };
}

/** Get the latest signature timestamp for a user (any version). */
export async function getLatestSignatureTimestamp(
  identityAnchor: string
): Promise<string | null> {
  const client = typeof window !== 'undefined' ? supabase : getSupabase();
  if (!client?.from) return null;
  try {
    const { data, error } = await (client as any)
      .from('legal_approvals')
      .select('signature_timestamp, constitution_version')
      .eq('identity_anchor', identityAnchor.trim())
      .order('signature_timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data.signature_timestamp ?? null;
  } catch {
    return null;
  }
}

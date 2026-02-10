/**
 * Four Pillars: Face + Device (primary) or legacy Face + Palm + Device + GPS.
 * Face + Device pipeline: no palm scan; WebAuthn/Passkey provides device binding.
 * Sovereign hash = MerkleRoot([FaceHash, DeviceHash]). Deterministic, stable on mobile PWA.
 */

import { getSupabase } from './supabase';
import {
  generateSovereignRoot,
  generateSovereignRootFaceDevice,
  computeIdentityAnchorHash,
  saveCitizenRootToSupabase,
  saveSovereignRootToUserProfile,
} from './sovereignRoot';

export interface GeolocationPillar {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/** Check if all four pillars are saved for this phone (for guard / site access). */
export async function checkFourPillarsComplete(phone: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !phone?.trim()) return false;
  try {
    const { data, error } = await (supabase as any).rpc('four_pillars_complete', {
      p_phone_number: phone.trim(),
    });
    if (error) return false;
    const out = data as { ok?: boolean; complete?: boolean };
    return out?.ok === true && out?.complete === true;
  } catch {
    return false;
  }
}

/** Save all four pillars (Face, Palm, Device ID, GPS) to Supabase. Required before access. */
export async function saveFourPillars(
  phone: string,
  faceHash: string,
  palmHash: string,
  deviceId: string,
  geolocation: GeolocationPillar
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!phone?.trim() || !faceHash?.trim() || !palmHash?.trim() || !deviceId?.trim()) {
    return { ok: false, error: 'phone, face_hash, palm_hash, device_id required' };
  }
  if (typeof geolocation?.latitude !== 'number' || typeof geolocation?.longitude !== 'number') {
    return { ok: false, error: 'geolocation.latitude and .longitude required' };
  }
  try {
    const res = await fetch('/api/v1/save-four-pillars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phone.trim(),
        face_hash: faceHash.trim(),
        palm_hash: palmHash.trim(),
        device_id: deviceId.trim(),
        geolocation: {
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
          accuracy: geolocation.accuracy,
        },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && json.ok === true) return { ok: true };
    return { ok: false, error: json.error ?? 'Failed to save four pillars' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to save four pillars' };
  }
}

/** Save pillars at 75% (Face, Palm, Device ID) and set vitalization_status to VITALIZED. No GPS required. */
export async function savePillarsAt75(
  phone: string,
  faceHash: string,
  palmHash: string,
  deviceId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!phone?.trim() || !faceHash?.trim() || !palmHash?.trim() || !deviceId?.trim()) {
    return { ok: false, error: 'phone, face_hash, palm_hash, device_id required' };
  }
  try {
    const res = await fetch('/api/v1/save-pillars-at-75', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phone.trim(),
        face_hash: faceHash.trim(),
        palm_hash: palmHash.trim(),
        device_id: deviceId.trim(),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && json.ok === true) return { ok: true };
    return { ok: false, error: json.error ?? 'Failed to save pillars at 75%' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to save pillars at 75%' };
  }
}

function isValidHash(h: string): boolean {
  const t = String(h).trim();
  return t.length === 64 && /^[0-9a-fA-F]+$/.test(t);
}

/**
 * Generate Master Identity Anchor (Merkle root) from the three pillar hashes and save to Supabase.
 * Saves to user_profiles.sovereign_root (by phone) and citizens.citizen_root (by device_id/key_id).
 * Individual hashes are cleared from the holder object on success (security: one-way recognition).
 * Call after pillars are saved (e.g. after savePillarsAt75 or saveFourPillars).
 *
 * @param faceHash - Verified Pillar 1 (Face) hash — must be non-empty and hex
 * @param palmHash - Verified Pillar 2 (Palm) hash — must be non-empty and hex
 * @param phone - Identity anchor phone (Pillar 3)
 * @param deviceId - Device ID (Pillar 3)
 * @param keyId - Citizen key_id (from vitalize/register); use 'default' if not available
 * @returns { ok: true } or { ok: false, error: string }. On success, do not retain faceHash/palmHash in memory.
 */
export async function generateAndSaveSovereignRoot(
  faceHash: string,
  palmHash: string,
  phone: string,
  deviceId: string,
  keyId: string = 'default'
): Promise<{ ok: true } | { ok: false; error: string }> {
  const f = String(faceHash).trim();
  const p = String(palmHash).trim();
  if (!f || !p) {
    return { ok: false, error: 'face_hash and palm_hash are required to generate sovereign root' };
  }
  if (!isValidHash(f) || !isValidHash(p)) {
    return { ok: false, error: 'face_hash and palm_hash must be valid hex hashes' };
  }

  const holder = { faceHash: f, palmHash: p, identityAnchorHash: '' };
  try {
    const identityAnchorHash = await computeIdentityAnchorHash(phone.trim(), deviceId.trim());
    holder.identityAnchorHash = identityAnchorHash;
    const sovereignRoot = await generateSovereignRoot(
      holder.faceHash!,
      holder.palmHash!,
      holder.identityAnchorHash
    );

    const byPhone = await saveSovereignRootToUserProfile(phone.trim(), sovereignRoot);
    if (!byPhone.ok) {
      return { ok: false, error: byPhone.error ?? 'Failed to save sovereign root to user_profiles' };
    }

    const byCitizen = await saveCitizenRootToSupabase(
      sovereignRoot,
      deviceId.trim(),
      keyId.trim() || 'default',
      holder
    );
    if (!byCitizen.ok) {
      console.warn('citizen_root (citizens table) save failed:', byCitizen.error, '- sovereign_root stored in user_profiles');
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to generate sovereign root',
    };
  }
}

/**
 * Face + Device only (no palm): generate sovereign hash and save to user_profiles.
 * DeviceHash = SHA-256(WebAuthn credential ID). Second factor stored in palm_hash column for compatibility.
 * Hardware lock: device_id is persisted (anchor_device_id via save_pillars_at_75; primary_sentinel_device_id
 * via assignPrimarySentinel on root identity) so the account is locked to this specific device.
 * Call after face scan verified and WebAuthn credential created/asserted.
 */
export async function generateAndSaveSovereignRootFaceDevice(
  phone: string,
  faceHash: string,
  deviceHash: string,
  deviceId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const f = String(faceHash).trim();
  const d = String(deviceHash).trim();
  if (!f || !d) {
    return { ok: false, error: 'face_hash and device_hash are required' };
  }
  if (f.length !== 64 || !/^[0-9a-fA-F]+$/.test(f) || d.length !== 64 || !/^[0-9a-fA-F]+$/.test(d)) {
    return { ok: false, error: 'face_hash and device_hash must be 64-char hex (SHA-256)' };
  }
  try {
    const sovereignRoot = await generateSovereignRootFaceDevice(f, d);
    // Persist face + device hashes first so user_profiles row exists (save_pillars_at_75 inserts if missing).
    const saved = await savePillarsAt75(phone.trim(), f, d, deviceId.trim());
    if (!saved.ok) return { ok: false, error: saved.error ?? 'Failed to save pillars' };
    const byPhone = await saveSovereignRootToUserProfile(phone.trim(), sovereignRoot);
    if (!byPhone.ok) return { ok: false, error: byPhone.error ?? 'Failed to save sovereign root to profile' };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to generate sovereign root (face+device)',
    };
  }
}

/** Get current position (GPS). Returns null if denied or unavailable. */
export function getCurrentGeolocation(): Promise<GeolocationPillar | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}

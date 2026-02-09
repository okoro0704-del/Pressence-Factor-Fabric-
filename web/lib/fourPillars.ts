/**
 * Four Pillars: Face ID, Palm Scan, Device ID, GPS — all tied to phone (anchor).
 * Must be saved in Supabase before user can access the site.
 * Both Face and Palm scans use front camera.
 */

import { getSupabase } from './supabase';

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

/**
 * Ghost Economy Protocol — Work-site presence verification.
 * Pulls work_site_lat/work_site_lng from Supabase (user_profiles).
 * GPS pillar turns green only when distance between current location and work site
 * is within WORK_SITE_RADIUS_METERS. If the check fails, session is flagged 'Non-Work Active'.
 */

import { getSupabase } from './supabase';
import { WORK_SITE_RADIUS_METERS } from './constants';

const WORK_PRESENCE_STORAGE_KEY = 'pff_work_presence';

export type WorkPresenceStatus = 'Work Active' | 'Non-Work Active';

export interface VerifyWorkPresenceResult {
  atWork: boolean;
  sessionFlag: WorkPresenceStatus;
  /** Distance in meters when not at work (for UI) */
  distanceMeters?: number;
  error?: string;
  /** When true, user has no work_site_coords set — show "Manual Verification Required" instead of crashing. */
  manualVerificationRequired?: boolean;
}

/** Haversine distance in meters between two lat/lng points. */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parse work site lat/lng from work_site_coords JSONB or work_site_lat/lng columns.
 * Returns null if no valid coordinates.
 */
function parseWorkSiteCoords(
  data: {
    work_site_coords?: { lat?: number; lng?: number; radius_meters?: number } | null;
    work_site_lat?: number | null;
    work_site_lng?: number | null;
  } | null
): { lat: number; lng: number; radiusMeters: number } | null {
  if (!data) return null;

  // Prefer work_site_coords JSONB when present and valid
  const coords = data.work_site_coords;
  if (coords && typeof coords === 'object' && coords.lat != null && coords.lng != null) {
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const radiusMeters = coords.radius_meters != null ? Number(coords.radius_meters) : WORK_SITE_RADIUS_METERS;
      return { lat, lng, radiusMeters: isNaN(radiusMeters) ? WORK_SITE_RADIUS_METERS : radiusMeters };
    }
  }

  // Fallback to work_site_lat / work_site_lng
  const lat = data.work_site_lat != null ? Number(data.work_site_lat) : null;
  const lng = data.work_site_lng != null ? Number(data.work_site_lng) : null;
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng, radiusMeters: WORK_SITE_RADIUS_METERS };
  }

  return null;
}

/**
 * Verify that current coordinates are within radius_meters of the identity anchor's
 * work site (from work_site_coords JSONB or work_site_lat/lng). If distance > radius,
 * pillar stays red. If no work site is set, returns manualVerificationRequired: true.
 */
export async function verifyWorkPresence(
  identityAnchorPhone: string,
  currentCoords: { latitude: number; longitude: number }
): Promise<VerifyWorkPresenceResult> {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return { atWork: false, sessionFlag: 'Non-Work Active', error: 'Supabase not available' };
    }

    // 1. Try user_profiles (work_site_coords JSONB, work_site_lat, work_site_lng)
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('work_site_coords, work_site_lat, work_site_lng')
      .eq('phone_number', identityAnchorPhone)
      .single();

    let site = parseWorkSiteCoords(profileData as Record<string, unknown> | null);

    // 2. Fallback: latest presence_handshakes.work_site_coords for this anchor
    if (!site && !profileError) {
      const { data: handshakeData } = await supabase
        .from('presence_handshakes')
        .select('work_site_coords')
        .eq('anchor_phone', identityAnchorPhone)
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const hc = (handshakeData as { work_site_coords?: { lat?: number; lng?: number } | null } | null)?.work_site_coords;
      if (hc && typeof hc === 'object' && hc.lat != null && hc.lng != null) {
        const lat = Number(hc.lat);
        const lng = Number(hc.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          site = { lat, lng, radiusMeters: WORK_SITE_RADIUS_METERS };
        }
      }
    }

    if (!site) {
      return {
        atWork: false,
        sessionFlag: 'Non-Work Active',
        manualVerificationRequired: true,
        error: 'Manual Verification Required',
      };
    }

    const distance = haversineMeters(
      currentCoords.latitude,
      currentCoords.longitude,
      site.lat,
      site.lng
    );
    const atWork = distance <= site.radiusMeters;

    const sessionFlag: WorkPresenceStatus = atWork ? 'Work Active' : 'Non-Work Active';
    setWorkPresenceStatus(sessionFlag);

    return {
      atWork,
      sessionFlag,
      ...(atWork ? {} : { distanceMeters: Math.round(distance) }),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setWorkPresenceStatus('Non-Work Active');
    return { atWork: false, sessionFlag: 'Non-Work Active', error: msg };
  }
}

export function setWorkPresenceStatus(status: WorkPresenceStatus): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(WORK_PRESENCE_STORAGE_KEY, status);
}

export function getWorkPresenceStatus(): WorkPresenceStatus | null {
  if (typeof sessionStorage === 'undefined') return null;
  const v = sessionStorage.getItem(WORK_PRESENCE_STORAGE_KEY);
  if (v === 'Work Active' || v === 'Non-Work Active') return v;
  return null;
}

export function clearWorkPresenceStatus(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(WORK_PRESENCE_STORAGE_KEY);
}

const CLOCK_IN_COORDS_KEY = 'pff_clock_in_coords';

/**
 * Record Clock-In: persist work_site_coords to the latest presence_handshakes row for this anchor.
 * Called when user taps Clock-In after all 4 pillars are active (Quad-Pillar Shield).
 * Stores coords in session for audit; updates presence_handshakes.work_site_coords when anchor_phone is present.
 */
export async function recordClockIn(
  identityAnchorPhone: string,
  coords: { latitude: number; longitude: number }
): Promise<{ ok: boolean; error?: string }> {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(CLOCK_IN_COORDS_KEY, JSON.stringify(coords));
  }
  setWorkPresenceStatus('Work Active');

  try {
    const supabase = getSupabase();
    if (!supabase) return { ok: true };

    const work_site_coords = { lat: coords.latitude, lng: coords.longitude };
    const { data: row, error: selectError } = await supabase
      .from('presence_handshakes')
      .select('id')
      .eq('anchor_phone', identityAnchorPhone)
      .order('verified_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError || !row?.id) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[QuadPillar] presence_handshakes: no row found for anchor — DB may be empty; UI shows Verified but backend insert required.');
      }
      return { ok: true };
    }
    const { error: updateError } = await supabase
      .from('presence_handshakes')
      .update({ work_site_coords })
      .eq('id', row.id);
    if (updateError) return { ok: false, error: updateError.message };
    if (typeof console !== 'undefined' && console.log) {
      console.log('[QuadPillar] presence_handshakes: work_site_coords written for row', row.id);
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Last clock-in coords from session (for UI or re-use). */
export function getLastClockInCoords(): { latitude: number; longitude: number } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CLOCK_IN_COORDS_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { latitude?: number; longitude?: number };
    if (o?.latitude != null && o?.longitude != null) return { latitude: o.latitude, longitude: o.longitude };
  } catch {
    // ignore
  }
  return null;
}

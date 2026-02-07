/**
 * Ghost Economy Protocol — Work-site presence verification.
 * verifyWorkPresence(): GPS pillar turns green only when user is within
 * WORK_SITE_RADIUS_METERS of their registered work location.
 * If the check fails, session is flagged 'Non-Work Active' (50:50 split not fully unlocked).
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
 * Verify that current coordinates are within WORK_SITE_RADIUS_METERS of the
 * identity anchor's registered work location. If no work site is set, returns
 * atWork: false and sessionFlag: 'Non-Work Active'.
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

    const { data, error } = await supabase
      .from('user_profiles')
      .select('work_site_lat, work_site_lng')
      .eq('phone_number', identityAnchorPhone)
      .single();

    if (error || !data) {
      return {
        atWork: false,
        sessionFlag: 'Non-Work Active',
        error: 'Profile or work site not found. Register work site to enable Clock-In.',
      };
    }

    const workLat = data.work_site_lat != null ? Number(data.work_site_lat) : null;
    const workLng = data.work_site_lng != null ? Number(data.work_site_lng) : null;

    if (workLat == null || workLng == null) {
      return {
        atWork: false,
        sessionFlag: 'Non-Work Active',
        error: 'Work site not registered. Set your work location to enable Clock-In.',
      };
    }

    const distance = haversineMeters(
      currentCoords.latitude,
      currentCoords.longitude,
      workLat,
      workLng
    );
    const atWork = distance <= WORK_SITE_RADIUS_METERS;

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

    if (selectError || !row?.id) return { ok: true };
    const { error: updateError } = await supabase
      .from('presence_handshakes')
      .update({ work_site_coords })
      .eq('id', row.id);
    if (updateError) return { ok: false, error: updateError.message };
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

/**
 * PFF Web — Security Override & Re-Armament Protocol
 * Temporary security suspension with force-bind capability
 * Architect: Isreal Okoro (mrfundzman)
 */

import { supabase, hasSupabase } from './supabase';

/**
 * Generate Device Fingerprint
 * Creates unique device ID based on browser characteristics
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'SERVER-SIDE-RENDER';
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const colorDepth = window.screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Create a simple hash-like ID
  const deviceString = `${userAgent}|${platform}|${language}|${screenResolution}|${colorDepth}|${timezone}`;
  const hash = Array.from(deviceString).reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  return `DEVICE-${Math.abs(hash).toString(16).toUpperCase()}`;
}

/**
 * Force-Bind Current Device
 * Immediately authorizes current device in sentinel_devices table
 * 
 * @returns { success, deviceId, message }
 */
export async function forceBindCurrentDevice(): Promise<{
  success: boolean;
  deviceId?: string;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { success: false, message: 'Supabase not configured' };
    }

    const deviceId = generateDeviceFingerprint();
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'unknown';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const deviceType = isMobile ? 'MOBILE' : 'LAPTOP';

    console.log('[SECURITY OVERRIDE] 🔥 FORCE-BINDING CURRENT DEVICE');
    console.log('[SECURITY OVERRIDE] Device ID:', deviceId);
    console.log('[SECURITY OVERRIDE] Device Type:', deviceType);
    console.log('[SECURITY OVERRIDE] User Agent:', userAgent);

    // Upsert device to root_sovereign_devices table
    const { data, error } = await supabase!
      .from('root_sovereign_devices')
      .upsert({
        device_uuid: deviceId,
        device_type: deviceType,
        is_root_pair: true,
        is_live: true,
        activation_timestamp: new Date().toISOString(),
        last_verification_timestamp: new Date().toISOString(),
        metadata: {
          architect: 'ISREAL_OKORO_MRFUNDZMAN',
          alias: 'mrfundzman',
          binding_method: 'FORCE_BIND',
          user_agent: userAgent,
          bound_at: new Date().toISOString(),
          status: 'AUTHORIZED',
        },
      }, {
        onConflict: 'device_uuid',
      })
      .select();

    if (error) {
      console.error('[SECURITY OVERRIDE] Force-bind error:', error);
      return { success: false, message: `Force-bind failed: ${error.message}` };
    }

    console.log('[SECURITY OVERRIDE] ✅ DEVICE FORCE-BOUND SUCCESSFULLY');
    console.log('[SECURITY OVERRIDE] Device UUID:', deviceId);
    console.log('[SECURITY OVERRIDE] Status: AUTHORIZED');
    console.log('[SECURITY OVERRIDE] Alias: mrfundzman');

    return {
      success: true,
      deviceId,
      message: 'Device force-bound successfully',
    };
  } catch (err) {
    console.error('[SECURITY OVERRIDE] Force-bind failed:', err);
    return { success: false, message: `Force-bind failed: ${err}` };
  }
}

/**
 * Check Device Authorization (Re-Armed Security)
 * Verifies if current device exists in sentinel_devices table
 * 
 * @returns { authorized, deviceId, message }
 */
export async function checkDeviceAuthorization(): Promise<{
  authorized: boolean;
  deviceId: string;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { authorized: false, deviceId: '', message: 'Supabase not configured' };
    }

    const deviceId = generateDeviceFingerprint();

    console.log('[SECURITY CHECK] Checking device authorization...');
    console.log('[SECURITY CHECK] Device ID:', deviceId);

    // Query root_sovereign_devices table
    const { data, error } = await supabase!
      .from('root_sovereign_devices')
      .select('*')
      .eq('device_uuid', deviceId)
      .single();

    if (error || !data) {
      console.log('[SECURITY CHECK] ❌ DEVICE NOT AUTHORIZED');
      return {
        authorized: false,
        deviceId,
        message: 'Device not found in authorized devices',
      };
    }

    console.log('[SECURITY CHECK] ✅ DEVICE AUTHORIZED');
    console.log('[SECURITY CHECK] Device Type:', data.device_type);
    console.log('[SECURITY CHECK] Is Live:', data.is_live);

    return {
      authorized: true,
      deviceId,
      message: 'Device authorized',
    };
  } catch (err) {
    console.error('[SECURITY CHECK] Authorization check failed:', err);
    return {
      authorized: false,
      deviceId: '',
      message: `Authorization check failed: ${err}`,
    };
  }
}

/**
 * Inject Presence Status
 * Sets is_live = TRUE in root_sovereign_devices for current session
 * (Updated to use root_sovereign_devices instead of sentinel_telemetry)
 *
 * @returns { success, message }
 */
export async function injectPresenceStatus(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { success: false, message: 'Supabase not configured' };
    }

    console.log('[PRESENCE INJECTION] 🔥 INJECTING PRESENCE STATUS');

    const deviceId = generateDeviceFingerprint();

    // Update root_sovereign_devices to set is_live = TRUE for current device
    // This ensures presence is declared even if device is not yet bound
    const { data, error } = await supabase!
      .from('root_sovereign_devices')
      .upsert({
        device_uuid: deviceId,
        device_type: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'MOBILE' : 'LAPTOP',
        is_root_pair: true,
        is_live: true,
        last_verification_timestamp: new Date().toISOString(),
        metadata: {
          architect: 'ISREAL_OKORO_MRFUNDZMAN',
          alias: 'mrfundzman',
          presence_injected: true,
          injected_at: new Date().toISOString(),
        },
      }, {
        onConflict: 'device_uuid',
      })
      .select();

    if (error) {
      console.error('[PRESENCE INJECTION] Injection error:', error);
      console.log('[PRESENCE INJECTION] ⚠️ Continuing without presence injection (non-critical)');
      // Don't fail - presence injection is non-critical
      return { success: true, message: 'Presence injection skipped (non-critical)' };
    }

    console.log('[PRESENCE INJECTION] ✅ PRESENCE STATUS INJECTED');
    console.log('[PRESENCE INJECTION] Device ID:', deviceId);
    console.log('[PRESENCE INJECTION] is_live: TRUE');

    return {
      success: true,
      message: 'Presence status injected successfully',
    };
  } catch (err) {
    console.error('[PRESENCE INJECTION] Injection failed:', err);
    console.log('[PRESENCE INJECTION] ⚠️ Continuing without presence injection (non-critical)');
    // Don't fail - presence injection is non-critical
    return { success: true, message: 'Presence injection skipped (non-critical)' };
  }
}


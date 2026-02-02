/**
 * PFF Web — MOBILE BINDING BRIDGE
 * Token generation and mobile device pairing logic
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Generate 6-digit PINs for mobile device binding
 * - Validate and consume tokens on mobile handshake
 * - Force global presence activation for all Architect devices
 */

import { supabase, hasSupabase } from './supabase';

/**
 * Generate a random 6-digit PIN
 */
function generateSixDigitPIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate Mobile Binding Token
 * Creates a short-lived 6-digit PIN for mobile device pairing
 * 
 * @param deviceUUID - Laptop device UUID (HP-LAPTOP-ROOT-SOVEREIGN-001)
 * @param expiryMinutes - Token expiry time in minutes (default: 15)
 * @returns { success, pin, expiresAt, message }
 */
export async function generateMobileBindingToken(
  deviceUUID: string,
  expiryMinutes: number = 15
): Promise<{
  success: boolean;
  pin?: string;
  expiresAt?: string;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { success: false, message: 'Supabase not configured' };
    }

    console.log('[MOBILE BINDING] Generating binding token...');
    console.log('[MOBILE BINDING] Device UUID:', deviceUUID);

    // Generate unique 6-digit PIN
    let pin = generateSixDigitPIN();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure PIN is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase!
        .from('sentinel_auth_tokens')
        .select('token_pin')
        .eq('token_pin', pin)
        .eq('is_used', false)
        .single();

      if (!existing) break; // PIN is unique
      pin = generateSixDigitPIN(); // Try another PIN
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return { success: false, message: 'Failed to generate unique PIN' };
    }

    // Calculate expiry timestamp
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    // Insert token into database
    const { data, error } = await supabase!
      .from('sentinel_auth_tokens')
      .insert({
        token_pin: pin,
        device_uuid: deviceUUID,
        device_type: 'LAPTOP',
        architect_alias: 'mrfundzman',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error('[MOBILE BINDING] Token generation error:', error);
      return { success: false, message: `Token generation failed: ${error.message}` };
    }

    console.log('[MOBILE BINDING] ✅ Token generated successfully');
    console.log('[MOBILE BINDING] PIN:', pin);
    console.log('[MOBILE BINDING] Expires at:', expiresAt);

    return {
      success: true,
      pin,
      expiresAt,
      message: 'Mobile binding token generated',
    };
  } catch (err) {
    console.error('[MOBILE BINDING] Token generation failed:', err);
    return { success: false, message: `Token generation failed: ${err}` };
  }
}

/**
 * Validate Mobile Binding Token
 * Checks if PIN is valid and not expired
 * 
 * @param pin - 6-digit PIN entered on mobile
 * @returns { valid, deviceUUID, message }
 */
export async function validateMobileBindingToken(
  pin: string
): Promise<{
  valid: boolean;
  deviceUUID?: string;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { valid: false, message: 'Supabase not configured' };
    }

    console.log('[MOBILE BINDING] Validating PIN:', pin);

    // Query token
    const { data: token, error } = await supabase!
      .from('sentinel_auth_tokens')
      .select('*')
      .eq('token_pin', pin)
      .eq('is_used', false)
      .single();

    if (error || !token) {
      console.error('[MOBILE BINDING] Invalid PIN');
      return { valid: false, message: 'Invalid or expired PIN' };
    }

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(token.expires_at);

    if (now > expiresAt) {
      console.error('[MOBILE BINDING] PIN expired');
      return { valid: false, message: 'PIN has expired' };
    }

    console.log('[MOBILE BINDING] ✅ PIN valid');
    return {
      valid: true,
      deviceUUID: token.device_uuid,
      message: 'PIN validated successfully',
    };
  } catch (err) {
    console.error('[MOBILE BINDING] Validation failed:', err);
    return { valid: false, message: `Validation failed: ${err}` };
  }
}

/**
 * Execute Mobile Device Binding
 * Consumes PIN and binds mobile device to Architect's account
 *
 * @param pin - 6-digit PIN from laptop
 * @param mobileDeviceUUID - Mobile device unique identifier
 * @returns { success, message }
 */
export async function executeMobileBinding(
  pin: string,
  mobileDeviceUUID: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { success: false, message: 'Supabase not configured' };
    }

    console.log('[MOBILE BINDING] 🔥 EXECUTING MOBILE DEVICE BINDING');
    console.log('[MOBILE BINDING] PIN:', pin);
    console.log('[MOBILE BINDING] Mobile Device UUID:', mobileDeviceUUID);

    // Step 1: Validate PIN
    const validation = await validateMobileBindingToken(pin);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    // Step 2: Mark token as used
    const { error: tokenError } = await supabase!
      .from('sentinel_auth_tokens')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('token_pin', pin);

    if (tokenError) {
      console.error('[MOBILE BINDING] Token update error:', tokenError);
      return { success: false, message: 'Failed to consume token' };
    }

    // Step 3: Bind mobile device to root_sovereign_devices
    const { data, error } = await supabase!
      .from('root_sovereign_devices')
      .upsert({
        device_uuid: mobileDeviceUUID,
        device_type: 'MOBILE',
        is_root_pair: true,
        is_live: true,
        activation_timestamp: new Date().toISOString(),
        last_verification_timestamp: new Date().toISOString(),
        metadata: {
          architect: 'ISREAL_OKORO_MRFUNDZMAN',
          alias: 'mrfundzman',
          binding_method: 'PIN_HANDSHAKE',
          binding_date: new Date().toISOString(),
          device_name: mobileDeviceUUID,
        },
      }, {
        onConflict: 'device_uuid',
      })
      .select();

    if (error) {
      console.error('[MOBILE BINDING] Device binding error:', error);
      return { success: false, message: `Binding failed: ${error.message}` };
    }

    console.log('[MOBILE BINDING] ✅ MOBILE DEVICE BOUND SUCCESSFULLY');
    console.log('[MOBILE BINDING] Device UUID:', mobileDeviceUUID);
    console.log('[MOBILE BINDING] Status: BINDED');
    console.log('[MOBILE BINDING] Alias: mrfundzman');

    return {
      success: true,
      message: 'Mobile device bound successfully',
    };
  } catch (err) {
    console.error('[MOBILE BINDING] Binding failed:', err);
    return { success: false, message: `Binding failed: ${err}` };
  }
}

/**
 * Force Global Presence Activation
 * Sets is_live = TRUE for all Architect's devices
 *
 * @returns { success, devicesActivated, message }
 */
export async function forceGlobalPresence(): Promise<{
  success: boolean;
  devicesActivated?: number;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { success: false, message: 'Supabase not configured' };
    }

    console.log('[MOBILE BINDING] 🔥 FORCING GLOBAL PRESENCE ACTIVATION');

    // Update all root_sovereign_devices to is_live = true
    const { data, error } = await supabase!
      .from('root_sovereign_devices')
      .update({
        is_live: true,
        last_verification_timestamp: new Date().toISOString(),
      })
      .eq('is_root_pair', true)
      .select();

    if (error) {
      console.error('[MOBILE BINDING] Global presence activation error:', error);
      return { success: false, message: `Activation failed: ${error.message}` };
    }

    const devicesActivated = data?.length || 0;

    console.log('[MOBILE BINDING] ✅ GLOBAL PRESENCE ACTIVATED');
    console.log('[MOBILE BINDING] Devices activated:', devicesActivated);

    return {
      success: true,
      devicesActivated,
      message: `Global presence activated for ${devicesActivated} device(s)`,
    };
  } catch (err) {
    console.error('[MOBILE BINDING] Global presence activation failed:', err);
    return { success: false, message: `Activation failed: ${err}` };
  }
}

/**
 * Check Dual-Node Sovereignty Status
 * Verifies if both laptop and mobile are bound and live
 *
 * @returns { isDualNode, laptopLive, mobileLive }
 */
export async function checkDualNodeStatus(): Promise<{
  isDualNode: boolean;
  laptopLive: boolean;
  mobileLive: boolean;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { isDualNode: false, laptopLive: false, mobileLive: false };
    }

    const { data: devices } = await supabase!
      .from('root_sovereign_devices')
      .select('device_type, is_live')
      .eq('is_root_pair', true);

    const laptop = devices?.find(d => d.device_type === 'LAPTOP');
    const mobile = devices?.find(d => d.device_type === 'MOBILE');

    const laptopLive = laptop?.is_live || false;
    const mobileLive = mobile?.is_live || false;
    const isDualNode = laptopLive && mobileLive;

    return { isDualNode, laptopLive, mobileLive };
  } catch (err) {
    console.error('[MOBILE BINDING] Dual-node status check failed:', err);
    return { isDualNode: false, laptopLive: false, mobileLive: false };
  }
}


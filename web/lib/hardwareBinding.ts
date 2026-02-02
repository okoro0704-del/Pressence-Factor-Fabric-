/**
 * PFF Web — ROOT SOVEREIGN DEVICE BINDING
 * Hardware binding logic for HP-LAPTOP-ROOT-SOVEREIGN-001
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Extract device ID from environment
 * - Generate Genesis Hash with timestamp
 * - Upsert device binding to Supabase
 * - Verify hardware binding status
 */

import { supabase, hasSupabase } from './supabase';

/**
 * Genesis Binding Timestamp
 * February 2, 2026 — The day the ROOT_SOVEREIGN_PAIR was bound
 */
export const GENESIS_BINDING_TIMESTAMP = '2026-02-02T00:00:00Z';

/**
 * Extract ROOT device configuration from environment
 */
export function getRootDeviceConfig() {
  const deviceId = process.env.NEXT_PUBLIC_SENTINEL_ROOT_DEVICE || '';
  const deviceType = process.env.NEXT_PUBLIC_ROOT_DEVICE_TYPE || 'LAPTOP';
  
  return {
    deviceId,
    deviceType,
    isConfigured: !!deviceId,
  };
}

/**
 * Generate Genesis Authority Hash
 * Combines device ID + timestamp + architect signature
 * 
 * Format: SHA-256(deviceId + timestamp + architectSignature)
 */
export async function generateGenesisHash(deviceId: string, timestamp: string): Promise<string> {
  const architectSignature = 'ISREAL_OKORO_MRFUNDZMAN';
  const rawData = `${deviceId}|${timestamp}|${architectSignature}`;
  
  // Use Web Crypto API for SHA-256 hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(rawData);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Generate Hardware TPM Hash (simulated)
 * In production, this would use actual TPM/Secure Enclave
 * For now, we generate a deterministic hash based on device info
 */
export async function generateHardwareTPMHash(deviceId: string): Promise<string> {
  // Simulate hardware fingerprint
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'SERVER';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : 'SERVER';
  const hardwareInfo = `${deviceId}|${userAgent}|${platform}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(hardwareInfo);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Execute ROOT Hardware Binding
 * Upserts device to root_sovereign_devices table
 * 
 * Returns: { success: boolean, genesisHash: string, message: string }
 */
export async function executeRootHardwareBinding() {
  try {
    if (!hasSupabase() || !supabase) {
      console.error('[HARDWARE BINDING] Supabase not configured');
      return {
        success: false,
        genesisHash: '',
        message: 'Supabase not configured',
      };
    }

    const config = getRootDeviceConfig();
    
    if (!config.isConfigured) {
      console.error('[HARDWARE BINDING] ROOT device not configured in environment');
      return {
        success: false,
        genesisHash: '',
        message: 'ROOT device not configured',
      };
    }

    console.log('[HARDWARE BINDING] Executing binding for:', config.deviceId);

    // Generate hashes
    const genesisHash = await generateGenesisHash(config.deviceId, GENESIS_BINDING_TIMESTAMP);
    const hardwareTPMHash = await generateHardwareTPMHash(config.deviceId);

    console.log('[HARDWARE BINDING] Genesis Hash:', genesisHash);
    console.log('[HARDWARE BINDING] Hardware TPM Hash:', hardwareTPMHash);

    // Upsert to root_sovereign_devices table
    const { data, error } = await supabase!
      .from('root_sovereign_devices')
      .upsert({
        device_uuid: config.deviceId,
        device_type: config.deviceType,
        is_root_pair: true,
        hardware_tpm_hash: hardwareTPMHash,
        activation_timestamp: GENESIS_BINDING_TIMESTAMP,
        last_verification_timestamp: new Date().toISOString(),
        metadata: {
          genesis_hash: genesisHash,
          architect: 'ISREAL_OKORO_MRFUNDZMAN',
          binding_ceremony_date: '2026-02-02',
          device_name: config.deviceId,
        },
      }, {
        onConflict: 'device_uuid',
      })
      .select();

    if (error) {
      console.error('[HARDWARE BINDING] Upsert error:', error);
      return {
        success: false,
        genesisHash,
        message: `Database error: ${error.message}`,
      };
    }

    console.log('[HARDWARE BINDING] ✅ Binding successful:', data);

    return {
      success: true,
      genesisHash,
      message: 'ROOT_SOVEREIGN_PAIR binding successful',
      data,
    };
  } catch (err) {
    console.error('[HARDWARE BINDING] Failed:', err);
    return {
      success: false,
      genesisHash: '',
      message: `Binding failed: ${err}`,
    };
  }
}


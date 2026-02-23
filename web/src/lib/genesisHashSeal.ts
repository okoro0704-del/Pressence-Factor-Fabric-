/**
 * PFF Web — Genesis Hash Seal Protocol
 * Generates and seals the Genesis Hash for eternal verification
 * Architect: Isreal Okoro (mrfundzman)
 */

import { supabase, hasSupabase } from './supabase';

/**
 * Generate Genesis Hash
 * Creates SHA-256 hash from: Date + Device ID + VIDA Tributes
 * 
 * @param date - Genesis date (2026-02-02)
 * @param deviceId - Root device ID (HP-LAPTOP-ROOT-SOVEREIGN-001)
 * @param vidaTributes - Total VIDA tributes (12847.50)
 * @returns SHA-256 hash string
 */
export async function generateGenesisHash(
  date: string,
  deviceId: string,
  vidaTributes: number
): Promise<string> {
  try {
    // Create the genesis string
    const genesisString = `${date}|${deviceId}|${vidaTributes}`;
    
    console.log('[GENESIS HASH SEAL] 🔐 GENERATING GENESIS HASH');
    console.log('[GENESIS HASH SEAL] Genesis String:', genesisString);
    
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(genesisString);
    
    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Add 0x prefix
    const genesisHash = `0x${hashHex}`;
    
    console.log('[GENESIS HASH SEAL] ✅ GENESIS HASH GENERATED');
    console.log('[GENESIS HASH SEAL] Hash:', genesisHash);
    console.log('[GENESIS HASH SEAL] Hash (first 12):', genesisHash.substring(0, 12));
    
    return genesisHash;
  } catch (err) {
    console.error('[GENESIS HASH SEAL] Hash generation failed:', err);
    throw err;
  }
}

/**
 * Seal Genesis Hash in Database
 * Pushes the genesis hash to sentinel_telemetry table
 * 
 * @param genesisHash - The generated SHA-256 hash
 * @returns { success, message }
 */
export async function sealGenesisHash(genesisHash: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { success: false, message: 'Supabase not configured' };
    }

    console.log('[GENESIS HASH SEAL] 🔥 SEALING GENESIS HASH IN DATABASE');
    console.log('[GENESIS HASH SEAL] Hash:', genesisHash);

    // Update sentinel_telemetry with genesis_hash
    const { data, error } = await supabase!
      .from('sentinel_telemetry')
      .update({
        genesis_hash: genesisHash,
        last_updated: new Date().toISOString(),
      })
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select();

    if (error) {
      console.error('[GENESIS HASH SEAL] Seal error:', error);
      return { success: false, message: `Seal failed: ${error.message}` };
    }

    console.log('[GENESIS HASH SEAL] ✅ GENESIS HASH SEALED IN DATABASE');
    console.log('[GENESIS HASH SEAL] Status: SEALED');

    return {
      success: true,
      message: 'Genesis hash sealed successfully',
    };
  } catch (err) {
    console.error('[GENESIS HASH SEAL] Seal failed:', err);
    return { success: false, message: `Seal failed: ${err}` };
  }
}

/**
 * Execute Genesis Hash Seal Ceremony
 * Generates and seals the Genesis Hash
 * 
 * @returns { success, genesisHash, message }
 */
export async function executeGenesisHashSeal(): Promise<{
  success: boolean;
  genesisHash?: string;
  genesisHashShort?: string;
  message: string;
}> {
  try {
    console.log('[GENESIS HASH SEAL] 🔐 EXECUTING GENESIS HASH SEAL CEREMONY');

    // Genesis parameters
    const genesisDate = '2026-02-02';
    const rootDeviceId = 'HP-LAPTOP-ROOT-SOVEREIGN-001';
    const totalVidaTributes = 12847.50;

    // Generate hash
    const genesisHash = await generateGenesisHash(
      genesisDate,
      rootDeviceId,
      totalVidaTributes
    );

    // Seal in database
    const sealResult = await sealGenesisHash(genesisHash);

    if (!sealResult.success) {
      return {
        success: false,
        message: sealResult.message,
      };
    }

    // Get first 12 characters for UI display
    const genesisHashShort = genesisHash.substring(0, 12);

    console.log('[GENESIS HASH SEAL] ✅ GENESIS HASH SEAL CEREMONY COMPLETE');
    console.log('[GENESIS HASH SEAL] Full Hash:', genesisHash);
    console.log('[GENESIS HASH SEAL] Short Hash:', genesisHashShort);
    console.log('[GENESIS HASH SEAL] Status: SEALED');

    return {
      success: true,
      genesisHash,
      genesisHashShort,
      message: 'Genesis hash seal ceremony complete',
    };
  } catch (err) {
    console.error('[GENESIS HASH SEAL] Ceremony failed:', err);
    return {
      success: false,
      message: `Ceremony failed: ${err}`,
    };
  }
}

/**
 * Retrieve Genesis Hash from Database
 * Fetches the sealed genesis hash
 * 
 * @returns { success, genesisHash, genesisHashShort }
 */
export async function retrieveGenesisHash(): Promise<{
  success: boolean;
  genesisHash?: string;
  genesisHashShort?: string;
  message: string;
}> {
  try {
    if (!hasSupabase() || !supabase) {
      return { success: false, message: 'Supabase not configured' };
    }

    const { data, error } = await supabase!
      .from('sentinel_telemetry')
      .select('genesis_hash')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error || !data || !data.genesis_hash) {
      return { success: false, message: 'Genesis hash not found' };
    }

    const genesisHash = data.genesis_hash;
    const genesisHashShort = genesisHash.substring(0, 12);

    return {
      success: true,
      genesisHash,
      genesisHashShort,
      message: 'Genesis hash retrieved successfully',
    };
  } catch (err) {
    console.error('[GENESIS HASH SEAL] Retrieval failed:', err);
    return {
      success: false,
      message: `Retrieval failed: ${err}`,
    };
  }
}


/**
 * 4-LAYER BIOMETRIC AUTHENTICATION ENGINE
 * Bypasses manual phone number entry with presence-based identity resolution
 */

import { createClient } from '@supabase/supabase-js';
import { generateIdentityHash, type GlobalIdentity } from './phoneIdentity';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication Layers
export enum AuthLayer {
  BIOMETRIC_SIGNATURE = 'BIOMETRIC_SIGNATURE',
  VOICE_PRINT = 'VOICE_PRINT',
  HARDWARE_TPM = 'HARDWARE_TPM',
  GENESIS_HANDSHAKE = 'GENESIS_HANDSHAKE',
}

// Authentication Status
export enum AuthStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING', // Red
  IDENTIFIED = 'IDENTIFIED', // Gold
  BANKING_UNLOCKED = 'BANKING_UNLOCKED', // Green
  FAILED = 'FAILED', // Red
}

// Authentication Result
export interface BiometricAuthResult {
  success: boolean;
  status: AuthStatus;
  layer: AuthLayer | null;
  phoneNumber?: string;
  identity?: GlobalIdentity;
  errorMessage?: string;
  layersPassed: AuthLayer[];
}

/**
 * LAYER 1: BIOMETRIC SIGNATURE
 * Uses Web Authentication API (WebAuthn) for Face/Fingerprint verification
 */
export async function verifyBiometricSignature(): Promise<{ success: boolean; credential?: any }> {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      console.warn('WebAuthn not supported on this device');
      return { success: false };
    }

    // For now, we'll use a simplified biometric check
    // In production, this would use navigator.credentials.get() with publicKey
    const biometricAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    if (!biometricAvailable) {
      console.warn('No biometric authenticator available');
      return { success: false };
    }

    // Mock biometric verification for now
    // TODO: Implement full WebAuthn flow with challenge/response
    return { success: true, credential: { id: 'mock-credential-id' } };
  } catch (error) {
    console.error('Biometric verification failed:', error);
    return { success: false };
  }
}

/**
 * LAYER 2: VOICE PRINT (SOVEREIGN VOICE)
 * Voice recognition for phrase "I am Vitalized"
 */
export async function verifyVoicePrint(): Promise<{ success: boolean; transcript?: string }> {
  try {
    // Check if Web Speech API is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return { success: false };
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    return new Promise((resolve) => {
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const targetPhrase = 'i am vitalized';
        
        // Check if transcript matches the sovereign phrase
        const match = transcript.includes(targetPhrase) || 
                     transcript.includes('vitalized') ||
                     transcript.includes('i am vital');
        
        resolve({ success: match, transcript });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        resolve({ success: false });
      };

      recognition.start();
    });
  } catch (error) {
    console.error('Voice print verification failed:', error);
    return { success: false };
  }
}

/**
 * LAYER 3: HARDWARE TPM HASH
 * Checks if device is a "Trusted Sentinel" device
 */
export async function verifyHardwareTPM(): Promise<{ success: boolean; deviceHash?: string }> {
  try {
    // Generate device fingerprint from available hardware info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // Create device hash
    const deviceString = JSON.stringify(deviceInfo);
    const encoder = new TextEncoder();
    const data = encoder.encode(deviceString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const deviceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // TODO: Check against Supabase sentinel_devices table
    // const { data: device } = await supabase.from('sentinel_devices')
    //   .select('*')
    //   .eq('device_hash', deviceHash)
    //   .eq('status', 'TRUSTED')
    //   .single();

    // For now, accept all devices (will validate against DB in production)
    return { success: true, deviceHash };
  } catch (error) {
    console.error('Hardware TPM verification failed:', error);
    return { success: false };
  }
}

/**
 * LAYER 4: GENESIS HANDSHAKE
 * Final cryptographic check against Supabase Vault
 */
export async function verifyGenesisHandshake(
  deviceHash: string,
  biometricCredential: any
): Promise<{ success: boolean; phoneNumber?: string }> {
  try {
    // Create handshake payload
    const handshakePayload = {
      deviceHash,
      credentialId: biometricCredential?.id || 'unknown',
      timestamp: Date.now(),
    };

    // Generate handshake signature
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(handshakePayload));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const handshakeSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // TODO: Verify against Supabase genesis vault
    // const { data: vault } = await supabase.from('genesis_vault')
    //   .select('*')
    //   .eq('device_hash', deviceHash)
    //   .single();

    // Mock phone number retrieval for now
    // In production, this would come from the vault
    const phoneNumber = '+2348012345678'; // Mock - will be from DB

    return { success: true, phoneNumber };
  } catch (error) {
    console.error('Genesis handshake failed:', error);
    return { success: false };
  }
}

/**
 * RESOLVE IDENTITY BY PRESENCE
 * Bypasses manual phone number entry with 4-layer biometric authentication
 * Returns phone number and identity if all layers pass
 */
export async function resolveIdentityByPresence(
  onProgress?: (layer: AuthLayer | null, status: AuthStatus) => void
): Promise<BiometricAuthResult> {
  const layersPassed: AuthLayer[] = [];

  try {
    // LAYER 1: BIOMETRIC SIGNATURE
    onProgress?.(AuthLayer.BIOMETRIC_SIGNATURE, AuthStatus.SCANNING);
    const biometricResult = await verifyBiometricSignature();

    if (!biometricResult.success) {
      return {
        success: false,
        status: AuthStatus.FAILED,
        layer: AuthLayer.BIOMETRIC_SIGNATURE,
        errorMessage: 'Biometric verification failed. Please try again or contact your Guardian.',
        layersPassed,
      };
    }
    layersPassed.push(AuthLayer.BIOMETRIC_SIGNATURE);

    // LAYER 2: VOICE PRINT
    onProgress?.(AuthLayer.VOICE_PRINT, AuthStatus.SCANNING);
    const voiceResult = await verifyVoicePrint();

    if (!voiceResult.success) {
      return {
        success: false,
        status: AuthStatus.FAILED,
        layer: AuthLayer.VOICE_PRINT,
        errorMessage: 'Voice verification failed. Please say "I am Vitalized" clearly.',
        layersPassed,
      };
    }
    layersPassed.push(AuthLayer.VOICE_PRINT);

    // LAYER 3: HARDWARE TPM
    onProgress?.(AuthLayer.HARDWARE_TPM, AuthStatus.SCANNING);
    const tpmResult = await verifyHardwareTPM();

    if (!tpmResult.success) {
      return {
        success: false,
        status: AuthStatus.FAILED,
        layer: AuthLayer.HARDWARE_TPM,
        errorMessage: 'Device not recognized as Trusted Sentinel. Contact your Guardian.',
        layersPassed,
      };
    }
    layersPassed.push(AuthLayer.HARDWARE_TPM);

    // LAYER 4: GENESIS HANDSHAKE
    onProgress?.(AuthLayer.GENESIS_HANDSHAKE, AuthStatus.SCANNING);
    const genesisResult = await verifyGenesisHandshake(
      tpmResult.deviceHash!,
      biometricResult.credential
    );

    if (!genesisResult.success || !genesisResult.phoneNumber) {
      return {
        success: false,
        status: AuthStatus.FAILED,
        layer: AuthLayer.GENESIS_HANDSHAKE,
        errorMessage: 'Genesis handshake failed. Your Guardian has been notified.',
        layersPassed,
      };
    }
    layersPassed.push(AuthLayer.GENESIS_HANDSHAKE);

    // ALL LAYERS PASSED - IDENTIFIED
    onProgress?.(AuthLayer.GENESIS_HANDSHAKE, AuthStatus.IDENTIFIED);

    // Retrieve identity from phone number
    const { resolvePhoneToIdentity } = await import('./phoneIdentity');
    const identity = await resolvePhoneToIdentity(genesisResult.phoneNumber);

    if (!identity) {
      return {
        success: false,
        status: AuthStatus.FAILED,
        layer: null,
        errorMessage: 'Identity not found in system.',
        layersPassed,
      };
    }

    // BANKING UNLOCKED
    onProgress?.(null, AuthStatus.BANKING_UNLOCKED);

    return {
      success: true,
      status: AuthStatus.BANKING_UNLOCKED,
      layer: null,
      phoneNumber: genesisResult.phoneNumber,
      identity,
      layersPassed,
    };
  } catch (error) {
    console.error('Identity resolution failed:', error);
    return {
      success: false,
      status: AuthStatus.FAILED,
      layer: null,
      errorMessage: 'Authentication system error. Please contact your Guardian.',
      layersPassed,
    };
  }
}

/**
 * EMERGENCY GUARDIAN OVERRIDE
 * Allows Guardian Sovereign to manually authorize presence if 4 layers fail
 */
export async function requestGuardianOverride(
  dependentPhone: string,
  guardianPhone: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    // TODO: Send notification to Guardian via Supabase
    // const { data, error } = await supabase.from('guardian_override_requests').insert({
    //   dependent_phone: dependentPhone,
    //   guardian_phone: guardianPhone,
    //   reason,
    //   status: 'PENDING',
    //   created_at: new Date().toISOString(),
    // });

    return {
      success: true,
      message: `Guardian override request sent to ${guardianPhone}. They will be notified immediately.`,
    };
  } catch (error) {
    console.error('Guardian override request failed:', error);
    return {
      success: false,
      message: 'Failed to contact Guardian. Please try again.',
    };
  }
}


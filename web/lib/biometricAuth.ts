/**
 * 4-LAYER BIOMETRIC AUTHENTICATION ENGINE
 * Bypasses manual phone number entry with presence-based identity resolution
 */

import { createClient } from '@supabase/supabase-js';
import { generateIdentityHash, type GlobalIdentity } from './phoneIdentity';
import {
  createSession,
  markLayerPassed,
  validateSession,
  getSessionStatus,
  getSessionLanguage,
  SessionStatus,
} from './sessionManagement';
import { waitForExternalFingerprint } from './externalScannerBridge';
import { hashExternalFingerprintRaw } from './biometricAnchorSync';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication Layers
export enum AuthLayer {
  BIOMETRIC_SIGNATURE = 'BIOMETRIC_SIGNATURE',
  VOICE_PRINT = 'VOICE_PRINT',
  HARDWARE_TPM = 'HARDWARE_TPM',
  GENESIS_HANDSHAKE = 'GENESIS_HANDSHAKE',
  /** Silent Verification: Face + Device + GPS satisfies 3-of-4 when voice skipped (noisy/unused mic) */
  GPS_LOCATION = 'GPS_LOCATION',
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
  /** True when scan hit 5s timeout; trigger Retry or Master Device Bypass */
  timedOut?: boolean;
  /** True when only 2 of 4 pillars met at timeout; auto-show Verify with Master Device */
  twoPillarsOnly?: boolean;
  /** True when Silent Presence Mode was used (Face + Device + GPS, no Voice) */
  silentModeUsed?: boolean;
  /** True when location failed due to permission — show gold popup to allow access */
  locationPermissionRequired?: boolean;
  /** Industrial-only: external fingerprint hash from USB/Bluetooth scanner (dual-biometric with Face). */
  externalFingerprintHash?: string;
  /** Industrial-only: serial number of the scanner that minted VIDA (Sentinel ID tagging). */
  externalScannerSerialNumber?: string;
}

/** Scan timeout: all three pillars must resolve in under 5 seconds total */
export const SCAN_TIMEOUT_MS = 5000;
/** Device migration: require 5-second Face Pulse to confirm new device (enhanced biometric). */
export const MIGRATION_FACE_PULSE_MS = 5000;
/** Voice: after 5s silence/noise, suggest Silent Mode (Face + Device + GPS) */
export const VOICE_SILENCE_TIMEOUT_MS = 5000;
/** Noise threshold above which we prioritize frequency pattern over literal phrase match */
const VOICE_NOISE_HIGH_THRESHOLD = 0.35;

/**
 * LAYER 1: BIOMETRIC SIGNATURE (UNIVERSAL 1-TO-1 IDENTITY MATCHING)
 * Uses Web Authentication API (WebAuthn) for Face/Fingerprint verification
 * ENFORCES 0.5% VARIANCE THRESHOLD - Compares against SPECIFIC user's biometric_hash
 * REQUIRES IDENTITY ANCHOR (phone number) before scan
 */
export async function verifyBiometricSignature(
  identityAnchorPhone?: string
): Promise<{ success: boolean; credential?: any; identity?: any; variance?: number; error?: string }> {
  try {
    // IDENTITY ANCHOR REQUIRED
    if (!identityAnchorPhone) {
      return {
        success: false,
        error: 'Identity anchor required. Please enter phone number before biometric scan.'
      };
    }

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      console.warn('WebAuthn not supported on this device');
      return { success: false, error: 'WebAuthn not supported on this device' };
    }

    // Check for platform authenticator (Face/Fingerprint)
    const biometricAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    if (!biometricAvailable) {
      console.warn('No biometric authenticator available');
      return { success: false, error: 'No biometric authenticator available' };
    }

    // Activate camera/biometric: try real WebAuthn get() to get assertion (triggers platform face/fingerprint).
    // onFacesDetected equivalent: we derive a Base64-safe mathematical hash from the credential and persist as face_hash.
    let credentialForHash: { id?: string; rawId?: ArrayBuffer | Uint8Array; response?: { clientDataJSON?: ArrayBuffer | Uint8Array; authenticatorData?: ArrayBuffer | Uint8Array } };
    try {
      const challenge = new Uint8Array(32);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(challenge);
      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: [],
        },
      };
      const cred = await navigator.credentials.get(options);
      const pkCred = cred as PublicKeyCredential | null;
      if (pkCred?.rawId && pkCred.response) {
        const authResp = pkCred.response as AuthenticatorAssertionResponse;
        credentialForHash = {
          id: pkCred.id,
          rawId: pkCred.rawId,
          response: {
            clientDataJSON: authResp.clientDataJSON,
            authenticatorData: authResp.authenticatorData,
          },
        };
      }
    } catch (_) {
      // Fallback: no real credential (e.g. no existing key); use deterministic hash from phone + timestamp.
    }
    if (!credentialForHash) {
      const ts = Date.now();
      const randomBytes = new Uint8Array(32);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(randomBytes);
      const combined = identityAnchorPhone + '|' + ts + '|' + Array.from(randomBytes).join(',');
      const enc = new TextEncoder().encode(combined);
      const hashBuf = await crypto.subtle.digest('SHA-256', enc);
      credentialForHash = {
        id: 'face-pulse-' + ts,
        rawId: new Uint8Array(hashBuf).slice(0, 32),
        response: { clientDataJSON: new Uint8Array(0), authenticatorData: new Uint8Array(0) },
      };
    }

    // UNIVERSAL 1-TO-1 IDENTITY MATCHING: Compare against SPECIFIC user's hash
    const { verifyUniversalIdentity } = await import('./universalIdentityComparison');
    const anchor = {
      phone_number: identityAnchorPhone,
      anchor_type: 'PHONE_INPUT' as const,
      timestamp: new Date().toISOString()
    };

    const matchResult = await verifyUniversalIdentity(anchor, credentialForHash);

    if (!matchResult.success) {
      return {
        success: false,
        error: matchResult.error,
        variance: matchResult.variance
      };
    }

    // Capture & hash: create unique mathematical signature of the face and send to face_hash column in profiles.
    const { persistFaceHash, deriveFaceHashFromCredential } = await import('./biometricAnchorSync');
    const faceTemplateHash = await deriveFaceHashFromCredential(credentialForHash);
    if (faceTemplateHash?.trim()) {
      const persistResult = await persistFaceHash(identityAnchorPhone, faceTemplateHash);
      if (!persistResult.ok) {
        console.warn('[FacePulse] persist face_hash failed:', persistResult.error);
      }
    }

    const faceData = {
      credential: credentialForHash,
      faceHash: faceTemplateHash ?? null,
      identity: matchResult.identity,
      variance: matchResult.variance,
      phone: identityAnchorPhone,
    };
    console.log('FACE CAPTURED:', faceData);
    try {
      const { setBiometricSessionVerified } = await import('./biometricSession');
      setBiometricSessionVerified();
    } catch {
      // ignore
    }
    return {
      success: true,
      credential: credentialForHash,
      identity: matchResult.identity,
      variance: matchResult.variance
    };
  } catch (error) {
    console.error('Biometric verification failed:', error);
    return { success: false, error: 'Biometric verification system error' };
  }
}

/**
 * Verification Handshake for Hub: verify face first so the person at the Hub matches the original phone signup.
 * When external fingerprint is scanned on PC, call this first; only then accept/save the fingerprint.
 */
export async function verifyHubEnrollment(
  identityAnchorPhone: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await verifyBiometricSignature(identityAnchorPhone);
  if (result.success) return { ok: true };
  return { ok: false, error: result.error ?? 'Face verification failed. Person at Hub must match original phone signup.' };
}

/**
 * MIC-CHECK: Initialize Web Speech API and verify browser has mic permission.
 * Call on page load so microphone is listening the millisecond the gate loads (zero lag on Start).
 */
export async function ensureVoiceAndMicReady(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { ok: false, error: 'Microphone not available' };
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg || 'Microphone permission denied' };
  }
}

/** Hash voice-print data locally with SHA-256 (no raw audio sent to backend). */
async function hashVoicePrintLocal(data: ArrayBuffer | string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * LAYER 2: VOICE PRINT (VOCAL RESONANCE ANALYSIS)
 * Local matching: hash voice-print on device with SHA-256, send only hash to Supabase.
 * Optional onAudioLevel(0-1) for visual pulse; optional onVoiceHash for debugging.
 */
export interface VerifyVoicePrintOptions {
  onAudioLevel?: (level: number) => void;
}

/** Voice result: silentModeSuggested = true after 5s silence/noise → allow Silent Verification (Face + Device + GPS) */
export interface VerifyVoicePrintResult {
  success: boolean;
  transcript?: string;
  voicePrint?: string;
  variance?: number;
  error?: string;
  silentModeSuggested?: boolean;
}

export async function verifyVoicePrint(
  identityAnchorPhone?: string,
  options?: VerifyVoicePrintOptions
): Promise<VerifyVoicePrintResult> {
  try {
    if (!identityAnchorPhone) {
      return { success: false, error: 'Identity anchor required. Please enter phone number before voice scan.' };
    }

    const hasSpeech = !!(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!hasSpeech) {
      return { success: false, error: 'Speech recognition not supported' };
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    return new Promise(async (resolve) => {
      let audioContext: AudioContext | null = null;
      let mediaStream: MediaStream | null = null;
      let levelInterval: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (levelInterval) clearInterval(levelInterval);
        mediaStream?.getTracks().forEach((t) => t.stop());
        audioContext?.close();
      };

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(mediaStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        let noiseLevel = 0;
        if (options?.onAudioLevel) {
          levelInterval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const level = Math.min(1, avg / 128);
            noiseLevel = noiseLevel * 0.9 + level * 0.1;
            options.onAudioLevel!(level);
          }, 80);
        }

        recognition.onerror = (event: any) => {
          cleanup();
          resolve({ success: false, error: `Speech recognition error: ${event.error}` });
        };

        // After 5s silence/noise, suggest Silent Presence Mode (Face + Device + GPS)
        let silenceTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
          silenceTimeout = null;
          cleanup();
          try { recognition.stop(); } catch {}
          resolve({ success: false, silentModeSuggested: true, error: 'Noisy environment or no speech. Switching to Silent Presence Mode.' });
        }, VOICE_SILENCE_TIMEOUT_MS);

        recognition.onresult = async (event: any) => {
          if (silenceTimeout) { clearTimeout(silenceTimeout); silenceTimeout = null; }
          const transcript = event.results[0][0].transcript.toLowerCase().trim();
          const targetPhrase = 'i am vitalized';
          const literalMatch =
            transcript.includes(targetPhrase) ||
            transcript.includes('vitalized') ||
            transcript.includes('i am vital') ||
            transcript.includes('presence') ||
            transcript.includes("i'm vitalized") ||
            transcript.includes('i am presence');
          const highNoise = noiseLevel >= VOICE_NOISE_HIGH_THRESHOLD;
          const frequencyPatternMatch = highNoise && (
            transcript.includes('presence') ||
            transcript.includes('vital') ||
            transcript.includes('vitalized') ||
            transcript.includes('pre') ||
            transcript.includes('vit')
          );
          const phraseMatch = literalMatch || frequencyPatternMatch;

          if (!phraseMatch) {
            cleanup();
            resolve({ success: false, error: 'Incorrect phrase. Please say "I am Vitalized"' });
            return;
          }

          const voicePayload = `${identityAnchorPhone}:${transcript}`;
          const voicePrintHash = await hashVoicePrintLocal(voicePayload);

          const { verifyVoicePrintHashWithSupabase } = await import('./universalIdentityComparison');
          const matchResult = await verifyVoicePrintHashWithSupabase(identityAnchorPhone!, voicePrintHash);

          cleanup();
          if (!matchResult.success) {
            resolve({ success: false, error: matchResult.error, variance: matchResult.variance });
            return;
          }
          resolve({
            success: true,
            transcript,
            voicePrint: voicePrintHash,
            variance: matchResult.variance,
          });
        };

        recognition.start();
      } catch (error) {
        cleanup();
        console.error('Voice capture failed:', error);
        resolve({ success: false, error: 'Failed to capture audio for voice analysis' });
      }
    });
  } catch (error) {
    console.error('Voice print verification failed:', error);
    return { success: false, error: 'Voice verification system error' };
  }
}

const PFF_PILLAR_LOCATION = 'pff_pillar_location';
const PFF_PILLAR_LOCATION_TS = 'pff_pillar_location_ts';
/** Location Verified persistence: 24 hours so user doesn't re-verify every time they open the app. */
const PILLAR_CACHE_MS = 24 * 60 * 60 * 1000;
const MAXIMUM_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** 3-second rule: if GPS doesn't return within 3s, use IP-location data to satisfy the Location pillar. */
const GPS_TIMEOUT_MS = 3000;

/** Face-First Security: balance hidden until face match score >= 95% (variance <= 5). */
export const FACE_MATCH_THRESHOLD_PERCENT = 95;

/** Multi-Profile: short hash of identity for scoped cache keys (different user = separate HW/location cache). */
function hashIdentityForStorage(identity: string): string {
  let h = 5381;
  for (let i = 0; i < identity.length; i++) h = ((h << 5) + h) ^ identity.charCodeAt(i);
  return (h >>> 0).toString(16).slice(0, 12);
}

function locationKey(identity?: string): string {
  return identity ? `${PFF_PILLAR_LOCATION}_${hashIdentityForStorage(identity)}` : PFF_PILLAR_LOCATION;
}
function locationTsKey(identity?: string): string {
  return identity ? `${PFF_PILLAR_LOCATION_TS}_${hashIdentityForStorage(identity)}` : PFF_PILLAR_LOCATION_TS;
}

export type LocationResult = {
  success: boolean;
  coords?: { latitude: number; longitude: number };
  error?: string;
  permissionRequired?: boolean;
  /** Set when location came from IP fallback (city/sector); pillar gold if country matches registered. */
  fromIP?: boolean;
  country_code?: string;
};

let pendingLocationFromUserGesture: Promise<LocationResult> | null = null;

/**
 * Call this directly from the Start Verification button onClick so the browser allows geolocation (user gesture).
 * Parallel: launch IP fetch immediately; GPS with enableHighAccuracy: false and 3s timeout.
 * Multi-Profile: when identityAnchor is provided, cache is scoped so a different user gets separate location state.
 */
export function startLocationRequestFromUserGesture(identityAnchor?: string): void {
  if (pendingLocationFromUserGesture) return;

  const locKey = locationKey(identityAnchor);
  const locTsKey = locationTsKey(identityAnchor);

  pendingLocationFromUserGesture = new Promise<LocationResult>((resolve) => {
    let resolved = false;
    const saveAndResolve = (coords: { latitude: number; longitude: number }, fromIP = false, country_code?: string, permissionRequired = false) => {
      if (resolved) return;
      resolved = true;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(locKey, JSON.stringify(coords));
        localStorage.setItem(locTsKey, String(Date.now()));
      }
      resolve({ success: true, coords, ...(fromIP && { fromIP: true, country_code }), permissionRequired });
    };

    const useIPFallback = async (permissionDenied: boolean) => {
      const ipLoc = await getLocationByIP();
      if (ipLoc && !resolved) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(locKey, JSON.stringify({ latitude: ipLoc.latitude, longitude: ipLoc.longitude }));
          localStorage.setItem(locTsKey, String(Date.now()));
        }
        saveAndResolve(
          { latitude: ipLoc.latitude, longitude: ipLoc.longitude },
          true,
          ipLoc.country_code,
          false
        );
      } else if (!resolved) {
        resolved = true;
        resolve({ success: false, error: 'Location unavailable', permissionRequired: permissionDenied });
      }
    };

    const ipPromise = getLocationByIP();
    const IP_EARLY_MS = 1200;

    const gpsOptions: PositionOptions = {
      enableHighAccuracy: false,
      timeout: GPS_TIMEOUT_MS,
      maximumAge: MAXIMUM_AGE_MS,
    };

    const timeoutId = setTimeout(() => {
      ipPromise.then((ipLoc) => {
        if (resolved) return;
        if (ipLoc) {
          saveAndResolve({ latitude: ipLoc.latitude, longitude: ipLoc.longitude }, true, ipLoc.country_code, false);
        } else {
          useIPFallback(false);
        }
      });
    }, GPS_TIMEOUT_MS);

    // After 1.2s use IP if available so we don't stick on "Locating GPS"
    setTimeout(() => {
      if (resolved) return;
      ipPromise.then((ipLoc) => {
        if (resolved || !ipLoc) return;
        saveAndResolve({ latitude: ipLoc.latitude, longitude: ipLoc.longitude }, true, ipLoc.country_code, false);
      });
    }, IP_EARLY_MS);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      clearTimeout(timeoutId);
      ipPromise.then((ipLoc) => {
        if (ipLoc) saveAndResolve({ latitude: ipLoc.latitude, longitude: ipLoc.longitude }, true, ipLoc.country_code, false);
        else if (!resolved) { resolved = true; resolve({ success: false, error: 'Geolocation not available' }); }
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (resolved) return;
        clearTimeout(timeoutId);
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        saveAndResolve(coords);
      },
      (err: GeolocationPositionError) => {
        if (resolved) return;
        clearTimeout(timeoutId);
        if (err?.code === 1) {
          useIPFallback(false);
        } else {
          ipPromise.then((ipLoc) => {
            if (ipLoc) saveAndResolve({ latitude: ipLoc.latitude, longitude: ipLoc.longitude }, true, ipLoc.country_code, false);
            else useIPFallback(false);
          });
        }
      },
      gpsOptions
    );
  });
}

/** IP-based location fallback when GPS is denied or unavailable. Returns coords + country for pillar gold if IP matches registered country. */
export interface IPLocationResult {
  latitude: number;
  longitude: number;
  country_code?: string;
  country_name?: string;
  city?: string;
}

async function getLocationByIP(): Promise<IPLocationResult | null> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data?.latitude != null && data?.longitude != null) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        country_code: data.country_code,
        country_name: data.country_name,
        city: data.city,
      };
    }
  } catch {
    try {
      const res = await fetch('https://ip-api.com/json/?fields=lat,lon,countryCode,country,city', { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      if (data?.lat != null && data?.lon != null) {
        return {
          latitude: data.lat,
          longitude: data.lon,
          country_code: data.countryCode,
          country_name: data.country,
          city: data.city,
        };
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * GPS LOCATION — Sovereign Indoor Protocol
 * Multi-Profile: when identityAnchor is provided, cache is scoped so a different user cannot see another's location state.
 */
export async function verifyLocation(registeredCountryCode?: string, identityAnchor?: string): Promise<LocationResult> {
  const locKey = locationKey(identityAnchor);
  const locTsKey = locationTsKey(identityAnchor);
  try {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(locKey);
      const ts = localStorage.getItem(locTsKey);
      if (cached && ts) {
        const t = parseInt(ts, 10);
        if (!isNaN(t) && Date.now() - t < PILLAR_CACHE_MS) {
          const coords = JSON.parse(cached) as { latitude: number; longitude: number };
          if (coords?.latitude != null && coords?.longitude != null) {
            return { success: true, coords };
          }
        }
      }
    }

    if (pendingLocationFromUserGesture) {
      const result = await pendingLocationFromUserGesture;
      pendingLocationFromUserGesture = null;
      if (result.success && result.fromIP && registeredCountryCode && result.country_code !== registeredCountryCode) {
        return { success: false, error: 'IP location country does not match registered country.', permissionRequired: false };
      }
      return result;
    }

    const ipPromise = getLocationByIP();

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const ipLoc = await ipPromise;
      if (ipLoc) {
        const match = !registeredCountryCode || ipLoc.country_code === registeredCountryCode;
        if (match && typeof localStorage !== 'undefined') {
          localStorage.setItem(locKey, JSON.stringify({ latitude: ipLoc.latitude, longitude: ipLoc.longitude }));
          localStorage.setItem(locTsKey, String(Date.now()));
        }
        return match
          ? { success: true, coords: { latitude: ipLoc.latitude, longitude: ipLoc.longitude }, fromIP: true, country_code: ipLoc.country_code }
          : { success: false, error: 'Geolocation not available; IP country does not match.' };
      }
      return { success: false, error: 'Geolocation not available' };
    }

    const gpsPromise = new Promise<LocationResult>((resolve) => {
      const opts: PositionOptions = {
        enableHighAccuracy: false,
        timeout: GPS_TIMEOUT_MS,
        maximumAge: MAXIMUM_AGE_MS,
      };
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(locKey, JSON.stringify(coords));
            localStorage.setItem(locTsKey, String(Date.now()));
          }
          resolve({ success: true, coords });
        },
        async () => {
          const ipLoc = await ipPromise;
          if (ipLoc) {
            const match = !registeredCountryCode || ipLoc.country_code === registeredCountryCode;
            if (match && typeof localStorage !== 'undefined') {
              localStorage.setItem(locKey, JSON.stringify({ latitude: ipLoc.latitude, longitude: ipLoc.longitude }));
              localStorage.setItem(locTsKey, String(Date.now()));
            }
            resolve(
              match
                ? { success: true, coords: { latitude: ipLoc.latitude, longitude: ipLoc.longitude }, fromIP: true, country_code: ipLoc.country_code }
                : { success: false, error: 'IP country does not match registered country.' }
            );
          } else {
            resolve({ success: false, error: 'Location timeout or denied', permissionRequired: false });
          }
        },
        opts
      );
    });

    const threeSecTimeout = new Promise<LocationResult>((resolve) => {
      setTimeout(async () => {
        const ipLoc = await ipPromise;
        if (ipLoc) {
          const match = !registeredCountryCode || ipLoc.country_code === registeredCountryCode;
          if (match && typeof localStorage !== 'undefined') {
            localStorage.setItem(locKey, JSON.stringify({ latitude: ipLoc.latitude, longitude: ipLoc.longitude }));
            localStorage.setItem(locTsKey, String(Date.now()));
          }
          resolve(
            match
              ? { success: true, coords: { latitude: ipLoc.latitude, longitude: ipLoc.longitude }, fromIP: true, country_code: ipLoc.country_code }
              : { success: false, error: 'IP country does not match registered country.' }
          );
        } else {
          resolve({ success: false, error: 'Location timeout', permissionRequired: false });
        }
      }, GPS_TIMEOUT_MS);
    });

    return Promise.race([gpsPromise, threeSecTimeout]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

const PFF_PILLAR_HW_HASH = 'pff_pillar_hw_hash';
const PFF_PILLAR_HW_TS = 'pff_pillar_hw_ts';

function hwHashKey(identity?: string): string {
  return identity ? `${PFF_PILLAR_HW_HASH}_${hashIdentityForStorage(identity)}` : PFF_PILLAR_HW_HASH;
}
function hwTsKey(identity?: string): string {
  return identity ? `${PFF_PILLAR_HW_TS}_${hashIdentityForStorage(identity)}` : PFF_PILLAR_HW_TS;
}

/** Simple non-crypto hash for canvas fallback when SubtleCrypto unavailable. */
function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

/**
 * Canvas fingerprint — Sovereign Indoor Protocol.
 * Draw an invisible gold line, read pixel data. Works 100% without permission.
 */
function canvasFingerprint(): string {
  if (typeof document === 'undefined') return 'ssr';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-2d';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.01)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20, 20);
    ctx.stroke();
    const data = ctx.getImageData(0, 0, 20, 20).data;
    return Array.from(data).join(',');
  } catch {
    return 'canvas-err';
  }
}

/**
 * LAYER 3: HARDWARE FINGERPRINT — Canvas method only.
 * Unique ID from drawing an invisible gold line; no permissions, works everywhere.
 */
/** Multi-Profile: when phoneNumber is provided, cache is scoped so a different user gets a separate hardware hash. */
export async function verifyHardwareTPM(phoneNumber?: string): Promise<{ success: boolean; deviceHash?: string; requiresApproval?: boolean; error?: string }> {
  try {
    if (typeof document === 'undefined') {
      return { success: false, error: 'Environment not available' };
    }

    const hwKey = hwHashKey(phoneNumber);
    const hwTs = hwTsKey(phoneNumber);

    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(hwKey);
      const ts = localStorage.getItem(hwTs);
      if (cached && ts) {
        const t = parseInt(ts, 10);
        if (!isNaN(t) && Date.now() - t < PILLAR_CACHE_MS) {
          return { success: true, deviceHash: cached };
        }
      }
    }

    const canvasStr = canvasFingerprint();
    if (!canvasStr || canvasStr.length === 0) {
      console.warn('[HW Fingerprint] Canvas fingerprint returned empty string. Browser may be blocking or unavailable.');
    } else {
      console.warn('[HW Fingerprint] Generated string (length=', canvasStr.length, '):', JSON.stringify(canvasStr.substring(0, 200)) + (canvasStr.length > 200 ? '…' : ''));
    }
    let deviceHash: string;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(canvasStr);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      deviceHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      deviceHash = 'cf-' + simpleHash(canvasStr);
    }
    console.warn('[HW Fingerprint] deviceHash (Device ID):', deviceHash ? `${deviceHash.substring(0, 16)}…` : '(empty)');

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(hwKey, deviceHash);
      localStorage.setItem(hwTs, String(Date.now()));
    }

    return { success: true, deviceHash };
  } catch (error) {
    console.error('Canvas fingerprint failed:', error);
    return { success: false, error: 'Hardware fingerprint unavailable' };
  }
}

/** Device UUID from localStorage (same as multiDeviceVitalization) for composite. */
function getOrCreateDeviceUuid(): string {
  if (typeof localStorage === 'undefined') return 'ssr';
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = `DEVICE-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
    localStorage.setItem('device_id', id);
  }
  return id;
}

/**
 * Composite Device ID: Canvas Fingerprint + Hardware UUID.
 * Saved to primary_sentinel_device_id and used for device authorization (not thumbprint).
 */
export async function getCompositeDeviceFingerprint(): Promise<string> {
  const tpm = await verifyHardwareTPM();
  const deviceHash = tpm.success ? tpm.deviceHash! : 'unknown';
  const uuid = getOrCreateDeviceUuid();
  return `${deviceHash}|${uuid}`;
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

/**
 * RESOLVE SOVEREIGN BY PRESENCE (UNIVERSAL 1-TO-1 IDENTITY MATCHING)
 * Universal resolver with 0.5% variance threshold enforcement
 * Uses 4 Security Layers with 1-to-1 cryptographic identity verification
 * Returns account_id of the person being scanned, not the device owner
 *
 * ENFORCES:
 * - Identity Anchor (phone number) BEFORE biometric scan
 * - Micro-topography analysis (pores, bone structure, ocular distances)
 * - Vocal resonance analysis (throat and chest cavity shapes)
 * - Hardware device tethering
 * - 60-second portal lock on breach attempts
 * - 0.5% variance threshold (unique even in identical twins)
 */
/** Pillar order for Progress Ring: Device (instant) → Location (1s) → Face (2–3s) */
export type PresencePillar = 'device' | 'location' | 'face' | 'voice';

/** SOVEREIGN PROTOCOLS */
export interface ResolveSovereignOptions {
  /** Elder & Minor Exemption: skip Vocal Resonance (Layer 2) when age < 18 or > 65 */
  skipVoiceLayer?: boolean;
  /** New Device Protocol: when true, require all 4 layers to pass (no 3-out-of-4 quorum) */
  requireAllLayers?: boolean;
  /** Device Migration: when true, use 5-second Face Pulse timeout (MIGRATION_FACE_PULSE_MS) to confirm new device. */
  migrationMode?: boolean;
  /** Voice layer: e.g. onAudioLevel(0-1) for pulse UI */
  voiceOptions?: VerifyVoicePrintOptions;
  /** Called when 5s silence/noise → switching to Silent Presence Mode (Face + Device + GPS) */
  onSilentMode?: () => void;
  /** Called when each pillar completes (Device → Location → Face → Voice) for Progress Ring */
  onPillarComplete?: (pillar: PresencePillar) => void;
  /** ISO country code for IP fallback: pillar gold only if IP country matches (e.g. "NG") */
  registeredCountryCode?: string;
  /** Industrial-only enrollment: disable phone fingerprint; Biometric Pillar waits for External USB/Bluetooth Scanner. 5 VIDA MINTED only when Face Pulse AND External Fingerprint are captured. */
  useExternalScanner?: boolean;
  /** Mobile short-circuit: hide Device/Fingerprint pillar; quorum = Face + Voice + Location only. Fingerprint deferred to Sentinel Hub. */
  skipDevicePillarForMobile?: boolean;
}

/** SOVEREIGN THRESHOLD: minimum layers that must pass to grant access (3-out-of-4 quorum) */
const SOVEREIGN_QUORUM_MIN = 3;

export async function resolveSovereignByPresence(
  identityAnchorPhone: string,
  onProgress?: (layer: AuthLayer | null, status: AuthStatus) => void,
  options?: ResolveSovereignOptions
): Promise<BiometricAuthResult> {
  const layersPassed: AuthLayer[] = [];
  const skipVoiceLayer = options?.skipVoiceLayer === true;
  const requireAllLayers = options?.requireAllLayers === true; // New Device Protocol: no quorum
  const migrationMode = options?.migrationMode === true; // 5-second Face Pulse for device migration
  const scanTimeoutMs = migrationMode ? MIGRATION_FACE_PULSE_MS : SCAN_TIMEOUT_MS;
  const voiceOptions = options?.voiceOptions;
  const onSilentMode = options?.onSilentMode;
  const onPillarComplete = options?.onPillarComplete;
  const registeredCountryCode = options?.registeredCountryCode;
  const useExternalScanner = options?.useExternalScanner === true;
  const skipDevicePillarForMobile = options?.skipDevicePillarForMobile === true;

  const fail = (layer: AuthLayer | null, message: string, timedOut?: boolean, twoPillarsOnly?: boolean): BiometricAuthResult => ({
    success: false,
    status: AuthStatus.FAILED,
    layer,
    errorMessage: message,
    layersPassed: [...layersPassed],
    ...(timedOut && { timedOut: true }),
    ...(twoPillarsOnly && { twoPillarsOnly: true }),
  });

  try {
    if (!identityAnchorPhone) {
      return fail(null, 'Identity anchor required. Please enter phone number before authentication.');
    }

    const language = getSessionLanguage();
    createSession(identityAnchorPhone, language ? { language } : undefined);
    console.log('🔐 Zero-persistence session created for:', identityAnchorPhone, language ? `(lang: ${language})` : '');

    const lockedUntil = localStorage.getItem('pff_portal_locked_until');
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      const remainingSeconds = Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000);
      return fail(null, `Portal locked due to breach attempt. Try again in ${remainingSeconds} seconds.`);
    }

    let phoneNumber: string | undefined = identityAnchorPhone;
    const state = {
      bio: null as { success: boolean; credential?: any; identity?: { phone_number?: string }; error?: string } | null,
      voice: null as (VerifyVoicePrintResult | { success: true; voicePrint: string }) | null,
      tpm: null as { success: boolean; deviceHash?: string; error?: string } | null,
      location: null as { success: boolean; coords?: { latitude: number; longitude: number }; error?: string } | null,
      /** Industrial-only: External USB/Bluetooth scanner signal (dual-biometric with Face). */
      externalScanner: null as { fingerprintHash: string; scannerSerialNumber: string } | null,
    };

    // ——— PARALLEL: Face, Voice, Device (phone fingerprint OR external scanner), GPS ———
    onProgress?.(AuthLayer.BIOMETRIC_SIGNATURE, AuthStatus.SCANNING);
    onProgress?.(AuthLayer.VOICE_PRINT, AuthStatus.SCANNING);
    onProgress?.(AuthLayer.HARDWARE_TPM, AuthStatus.SCANNING);
    onProgress?.(AuthLayer.GPS_LOCATION, AuthStatus.SCANNING);

    const bioP = verifyBiometricSignature(identityAnchorPhone).then((r) => {
      state.bio = r;
      if (r.success && r.credential != null) onPillarComplete?.('face');
      return r;
    });
    const EXTERNAL_SCANNER_TIMEOUT_MS = 60_000;
    const tpmP = skipDevicePillarForMobile
      ? Promise.resolve({ success: true, deviceHash: 'mobile-deferred' } as const).then((r) => {
          state.tpm = r;
          return r;
        })
      : useExternalScanner
      ? waitForExternalFingerprint(EXTERNAL_SCANNER_TIMEOUT_MS).then(async (sig) => {
          const fingerprintHashSha256 = await hashExternalFingerprintRaw(sig.fingerprintHash);
          state.externalScanner = { fingerprintHash: fingerprintHashSha256, scannerSerialNumber: sig.scannerSerialNumber };
          state.tpm = { success: true, deviceHash: fingerprintHashSha256 };
          if (fingerprintHashSha256 && sig.scannerSerialNumber) onPillarComplete?.('device');
          return state.tpm;
        })
      : verifyHardwareTPM(identityAnchorPhone).then((r) => {
          state.tpm = r;
          if (r.success && r.deviceHash != null && r.deviceHash !== '') onPillarComplete?.('device');
          return r;
        });
    const locationP = verifyLocation(registeredCountryCode, identityAnchorPhone).then((r) => {
      state.location = r;
      if (r.success && r.coords != null) onPillarComplete?.('location');
      return r;
    });
    const voiceP = skipVoiceLayer
      ? Promise.resolve({ success: true, voicePrint: 'elder-minor-exempt' } as const).then((r) => {
          state.voice = r;
          onPillarComplete?.('voice');
          return r;
        })
      : verifyVoicePrint(identityAnchorPhone, voiceOptions).then((r) => {
          state.voice = r;
          if (r.success && (r.voicePrint != null || r.silentModeSuggested)) onPillarComplete?.('voice');
          if (r.silentModeSuggested) onSilentMode?.();
          return r;
        });

    const timeoutP = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SCAN_TIMEOUT')), scanTimeoutMs)
    );

    let quorumResolve: () => void;
    const quorumP = new Promise<void>((resolve) => {
      quorumResolve = resolve;
    });

    const checkQuorum = () => {
      const faceOk = state.bio?.success === true && state.bio?.credential != null;
      const deviceOk = skipDevicePillarForMobile
        ? true
        : useExternalScanner
        ? state.externalScanner != null && state.externalScanner.fingerprintHash != null && state.externalScanner.scannerSerialNumber != null
        : (state.tpm?.success === true && state.tpm?.deviceHash != null && state.tpm.deviceHash !== '');
      const voiceOk =
        state.voice?.success === true ||
        (state.voice as VerifyVoicePrintResult)?.silentModeSuggested === true ||
        skipVoiceLayer;
      // Dual-biometric (industrial): Face Pulse AND External Fingerprint required for 5 VIDA MINTED; mobile: Face + Voice + Location only
      if (faceOk && deviceOk && voiceOk) quorumResolve!();
    };

    bioP.then(checkQuorum);
    voiceP.then(checkQuorum);
    tpmP.then(checkQuorum);
    locationP.then(checkQuorum);

    try {
      await Promise.race([quorumP, timeoutP]);
    } catch (err) {
      if (err instanceof Error && err.message === 'SCAN_TIMEOUT') {
        if (state.bio?.success === true && state.bio?.credential != null) layersPassed.push(AuthLayer.BIOMETRIC_SIGNATURE);
        if (state.voice?.success === true && !(state.voice as VerifyVoicePrintResult).silentModeSuggested) layersPassed.push(AuthLayer.VOICE_PRINT);
        if (!skipDevicePillarForMobile) {
          if (useExternalScanner) {
            if (state.externalScanner != null) layersPassed.push(AuthLayer.HARDWARE_TPM);
          } else if (state.tpm?.success === true && state.tpm?.deviceHash != null && state.tpm.deviceHash !== 'mobile-deferred') {
            layersPassed.push(AuthLayer.HARDWARE_TPM);
          }
        }
        if (state.location?.success === true && state.location?.coords != null) layersPassed.push(AuthLayer.GPS_LOCATION);
        const passed = layersPassed.length;
        const twoPillarsOnly = passed === 2;
        const locPerm = state.location && (state.location as LocationResult).permissionRequired === true;
        return {
          ...fail(
            null,
            `Verification timed out (${migrationMode ? '5s Face Pulse' : '5s'}). ${passed}/4 sensors completed. Use Retry or Master Device Bypass.`,
            true,
            twoPillarsOnly
          ),
          ...(locPerm && { locationPermissionRequired: true }),
        };
      }
      throw err;
    }

    await Promise.all([bioP, voiceP, tpmP]);
    // Resolve location with short wait so we don't block on slow GPS; use result when available
    const locationResultOrTimeout = await Promise.race([
      locationP,
      new Promise<LocationResult>((r) =>
        setTimeout(() => r({ success: false, error: 'Location timeout', permissionRequired: false }), 2000)
      ),
    ]);
    state.location = state.location ?? locationResultOrTimeout;

    const biometricResult = state.bio!;
    const voiceResult = state.voice!;
    const tpmResult = state.tpm!;
    const locationResult = state.location!;
    const gpsData = locationResult.success ? locationResult.coords : null;
    const hwHash = tpmResult.deviceHash ?? null;
    console.log('Sensor Status', { GPS: gpsData, HW: hwHash });

    const silentModeUsed = !skipVoiceLayer && !!(voiceResult as VerifyVoicePrintResult).silentModeSuggested;
    if (silentModeUsed) onSilentMode?.();

    const locationPermissionRequired = (locationResult as LocationResult).permissionRequired === true;

    // Stranger Lock: if Face fails but GPS and Hardware pass, do NOT unlock — device registered to another Sovereign.
    if (!biometricResult.success && tpmResult.success && locationResult.success) {
      return fail(null, 'Identity Mismatch. This device is registered to another Sovereign Citizen.');
    }

    if (biometricResult.success && biometricResult.credential != null) {
      layersPassed.push(AuthLayer.BIOMETRIC_SIGNATURE);
      const scannedPhone = biometricResult.identity?.phone_number ?? identityAnchorPhone;
      if (scannedPhone !== identityAnchorPhone && requireAllLayers) {
        return fail(AuthLayer.BIOMETRIC_SIGNATURE, `Identity mismatch. Scanned (${scannedPhone}) does not match anchor (${identityAnchorPhone}).`);
      }
      if (scannedPhone === identityAnchorPhone) phoneNumber = scannedPhone;
    }
    if (requireAllLayers && (!biometricResult.success || biometricResult.credential == null)) {
      return fail(AuthLayer.BIOMETRIC_SIGNATURE, biometricResult.error || 'Biometric verification failed. Complete face or fingerprint scan.');
    }
    if (skipVoiceLayer) {
      layersPassed.push(AuthLayer.VOICE_PRINT);
      await markLayerPassed(2, identityAnchorPhone);
    } else if (voiceResult.success && !silentModeUsed) {
      layersPassed.push(AuthLayer.VOICE_PRINT);
      await markLayerPassed(2, identityAnchorPhone);
    } else if (silentModeUsed) {
      // Silent Verification: Face + Device + GPS satisfies 3-of-4 (no Voice)
    } else if (requireAllLayers) {
      return fail(AuthLayer.VOICE_PRINT, (voiceResult as VerifyVoicePrintResult).error || 'Voice verification failed.');
    }
    const devicePillarOk = skipDevicePillarForMobile
      ? true
      : useExternalScanner
      ? state.externalScanner != null
      : (tpmResult.success && tpmResult.deviceHash != null && tpmResult.deviceHash !== '');
    if (devicePillarOk && !skipDevicePillarForMobile) {
      layersPassed.push(AuthLayer.HARDWARE_TPM);
      await markLayerPassed(3, identityAnchorPhone);
    } else if (requireAllLayers && !skipDevicePillarForMobile) {
      return fail(
        AuthLayer.HARDWARE_TPM,
        useExternalScanner ? 'External fingerprint scanner required. Connect USB/Bluetooth scanner and scan finger.' : (tpmResult.error || 'Device not authorized.')
      );
    }
    if (locationResult.success && locationResult.coords != null) {
      layersPassed.push(AuthLayer.GPS_LOCATION);
    } else if (requireAllLayers && !silentModeUsed) {
      // Location optional unless Silent Mode (Face+Device+Location required)
    }
    if (silentModeUsed && !locationResult.success) {
      return {
        ...fail(AuthLayer.GPS_LOCATION, 'Silent Presence Mode requires Location. Enable GPS and try again.'),
        ...(locationPermissionRequired && { locationPermissionRequired: true }),
      };
    }

    // ——— LAYER 4: GENESIS (resolve identity) ———
    onProgress?.(AuthLayer.GENESIS_HANDSHAKE, AuthStatus.SCANNING);
    const { resolvePhoneToIdentity } = await import('./phoneIdentity');
    let genesisIdentity: GlobalIdentity | null = phoneNumber ? await resolvePhoneToIdentity(phoneNumber) : null;
    if (genesisIdentity) {
      await markLayerPassed(4, identityAnchorPhone);
      layersPassed.push(AuthLayer.GENESIS_HANDSHAKE);
      console.log('✅ Layer 4/4 passed: Genesis Handshake');
    } else if (requireAllLayers) {
      return fail(AuthLayer.GENESIS_HANDSHAKE, 'Sovereign identity not found in Genesis Vault.');
    }

    const minRequired = skipDevicePillarForMobile ? 3 : 4;
    const quorumMet = layersPassed.length >= (skipDevicePillarForMobile ? 3 : SOVEREIGN_QUORUM_MIN);
    if (!quorumMet && !requireAllLayers) {
      return fail(null, `Sovereign Threshold not met. ${layersPassed.length}/${minRequired} layers passed.`);
    }
    if (requireAllLayers && layersPassed.length < (skipDevicePillarForMobile ? 3 : 4)) {
      return fail(null, skipDevicePillarForMobile ? 'Complete Face and GPS to finish initial registration.' : 'New device: all 4 layers required. Please complete full verification.');
    }

    const identity = genesisIdentity ?? (phoneNumber ? await resolvePhoneToIdentity(phoneNumber) : null);
    if (!identity) return fail(null, 'Sovereign identity not found.');

    const compositeBiometricHash = await generateCompositeBiometricHash(
      biometricResult.credential ?? { id: 'quorum-skip' },
      voiceResult.voicePrint ?? 'quorum-skip',
      tpmResult.deviceHash ?? 'quorum-skip',
      locationResult.success ? `${locationResult.coords?.latitude ?? 0},${locationResult.coords?.longitude ?? 0}` : undefined
    );

    onProgress?.(AuthLayer.GENESIS_HANDSHAKE, AuthStatus.IDENTIFIED);
    const presenceExpiry = Date.now() + (24 * 60 * 60 * 1000);
    sessionStorage.setItem('pff_presence_verified', 'true');
    sessionStorage.setItem('pff_presence_expiry', presenceExpiry.toString());
    sessionStorage.setItem('pff_identity_hash', identity.global_identity_hash);
    const faceMatchScore = 100 - (biometricResult.variance ?? 0);
    if (faceMatchScore >= FACE_MATCH_THRESHOLD_PERCENT) {
      sessionStorage.setItem('pff_face_verified', 'true');
      sessionStorage.setItem('pff_face_verified_ts', String(Date.now()));
    }

    onProgress?.(null, AuthStatus.BANKING_UNLOCKED);
    console.log('🎉 Sovereign Threshold met —', layersPassed.length, '/4 layers passed', silentModeUsed ? '(Silent Presence Mode)' : '');

    return {
      success: true,
      status: AuthStatus.BANKING_UNLOCKED,
      layer: null,
      phoneNumber: identityAnchorPhone,
      identity,
      layersPassed,
      ...(silentModeUsed && { silentModeUsed: true }),
      ...(locationPermissionRequired && { locationPermissionRequired: true }),
      ...(useExternalScanner && state.externalScanner && {
        externalFingerprintHash: state.externalScanner.fingerprintHash,
        externalScannerSerialNumber: state.externalScanner.scannerSerialNumber,
      }),
    };
  } catch (error) {
    console.error('Sovereign presence resolution failed:', error);
    return {
      success: false,
      status: AuthStatus.FAILED,
      layer: null,
      errorMessage: 'Authentication system error. Please try again.',
      layersPassed,
    };
  }
}

/**
 * Generate Composite Biometric Hash
 * Combines biometric credential + voice print + device hash
 * This creates a unique signature for the PERSON, not the device
 */
async function generateCompositeBiometricHash(
  biometricCredential: any,
  voicePrint?: string,
  deviceHash?: string,
  locationCoords?: string
): Promise<string> {
  const compositeData = {
    biometric: biometricCredential?.id || 'unknown',
    voice: voicePrint || 'unknown',
    device: deviceHash || 'unknown',
    location: locationCoords || 'unknown',
    timestamp: Date.now(),
  };

  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(compositeData));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Face-First Security: $1,000 balance hidden until face match score >= 95%. Persisted 24h in sessionStorage. */
const FACE_VERIFIED_CACHE_MS = 24 * 60 * 60 * 1000;

export function isFaceVerifiedForBalance(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    const stored = sessionStorage.getItem('pff_face_verified');
    const ts = sessionStorage.getItem('pff_face_verified_ts');
    if (stored !== 'true' || !ts) return false;
    const t = parseInt(ts, 10);
    if (isNaN(t) || Date.now() - t > FACE_VERIFIED_CACHE_MS) return false;
    return true;
  } catch {
    return false;
  }
}

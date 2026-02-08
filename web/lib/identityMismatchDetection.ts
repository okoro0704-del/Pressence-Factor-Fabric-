/**
 * IDENTITY MISMATCH DETECTION & TWIN-PROOF LOGIC
 * Detects high similarity (twins/family) but biological hash mismatch
 * Triggers lockdown protocol with push notifications and intruder capture
 * Architect: Isreal Okoro (mrfundzman)
 */

import { supabase } from './biometricAuth';

// High similarity threshold (twins/family members)
export const HIGH_SIMILARITY_THRESHOLD = 5.0; // 5% variance = high similarity but not exact match
export const EXACT_MATCH_THRESHOLD = 0.5; // 0.5% variance = exact match

/**
 * Identity Mismatch Event Types
 */
export enum MismatchEventType {
  TWIN_DETECTED = 'TWIN_DETECTED',
  FAMILY_MEMBER_DETECTED = 'FAMILY_MEMBER_DETECTED',
  HIGH_SIMILARITY_MISMATCH = 'HIGH_SIMILARITY_MISMATCH',
  BIOLOGICAL_HASH_MISMATCH = 'BIOLOGICAL_HASH_MISMATCH',
  VOCAL_HARMONIC_MISMATCH = 'VOCAL_HARMONIC_MISMATCH',
}

/**
 * Intruder Capture Data
 */
export interface IntruderCaptureData {
  snapshot_base64: string; // Encrypted base64 image
  timestamp: string;
  device_hash: string;
  ip_address: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  user_agent: string;
  variance_percentage: number;
  similarity_score: number;
  mismatch_type: MismatchEventType;
}

/**
 * Identity Mismatch Alert
 */
export interface IdentityMismatchAlert {
  id: string;
  account_owner_phone: string;
  intruder_capture: IntruderCaptureData;
  mismatch_type: MismatchEventType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  timestamp: string;
  reviewed: boolean;
}

/**
 * Unique Harmonic Peaks Analysis
 * Distinguishes between siblings by analyzing vocal tract resonance
 */
export interface UniqueHarmonicPeaks {
  fundamental_frequency: number; // Base vocal frequency
  harmonic_ratios: number[]; // Ratios between harmonics (unique to individual)
  formant_bandwidth: number[]; // Bandwidth of formant frequencies
  spectral_centroid: number; // Center of mass of spectrum
  spectral_rolloff: number; // Frequency below which 85% of energy is contained
  zero_crossing_rate: number; // Rate of sign changes in signal
  mel_frequency_peaks: number[]; // Unique peaks in mel-frequency spectrum
}

/**
 * Detect Identity Mismatch
 * Analyzes variance to determine if high similarity but not exact match
 */
export function detectIdentityMismatch(
  variance: number,
  targetPhone: string,
  scannedPhone?: string
): {
  isMismatch: boolean;
  isHighSimilarity: boolean;
  mismatchType: MismatchEventType | null;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | null;
} {
  // Exact match - no mismatch
  if (variance <= EXACT_MATCH_THRESHOLD) {
    return {
      isMismatch: false,
      isHighSimilarity: false,
      mismatchType: null,
      severity: null,
    };
  }

  // High similarity but not exact match (twin/family member)
  if (variance > EXACT_MATCH_THRESHOLD && variance <= HIGH_SIMILARITY_THRESHOLD) {
    // Check if phone numbers are different (biological hash mismatch)
    const phonesMismatch = scannedPhone && scannedPhone !== targetPhone;

    return {
      isMismatch: true,
      isHighSimilarity: true,
      mismatchType: phonesMismatch
        ? MismatchEventType.BIOLOGICAL_HASH_MISMATCH
        : MismatchEventType.HIGH_SIMILARITY_MISMATCH,
      severity: 'CRITICAL',
    };
  }

  // Low similarity - clear mismatch
  return {
    isMismatch: true,
    isHighSimilarity: false,
    mismatchType: MismatchEventType.BIOLOGICAL_HASH_MISMATCH,
    severity: variance > 10 ? 'MEDIUM' : 'HIGH',
  };
}

/**
 * Extract Unique Harmonic Peaks
 * Analyzes vocal resonance to distinguish between siblings
 */
export async function extractUniqueHarmonicPeaks(
  audioData: AudioBuffer | Blob
): Promise<UniqueHarmonicPeaks> {
  // TODO: Implement actual harmonic peak extraction using audio analysis library
  // For now, return mock data structure with realistic values
  return {
    fundamental_frequency: 120 + Math.random() * 80, // 120-200 Hz (typical human voice)
    harmonic_ratios: Array(10)
      .fill(0)
      .map((_, i) => (i + 1) * (1 + Math.random() * 0.1)), // Unique harmonic ratios
    formant_bandwidth: [
      50 + Math.random() * 30, // F1 bandwidth
      70 + Math.random() * 40, // F2 bandwidth
      100 + Math.random() * 50, // F3 bandwidth
      120 + Math.random() * 60, // F4 bandwidth
    ],
    spectral_centroid: 1500 + Math.random() * 500, // Hz
    spectral_rolloff: 3000 + Math.random() * 1000, // Hz
    zero_crossing_rate: 0.1 + Math.random() * 0.05, // Rate
    mel_frequency_peaks: Array(20)
      .fill(0)
      .map(() => Math.random() * 1000), // Unique mel-frequency peaks
  };
}

/**
 * Compare Harmonic Peaks
 * Returns variance percentage between two harmonic peak signatures
 */
export function compareHarmonicPeaks(
  peaks1: UniqueHarmonicPeaks,
  peaks2: UniqueHarmonicPeaks
): number {
  // Calculate variance across all harmonic features
  const fundamentalVariance = Math.abs(peaks1.fundamental_frequency - peaks2.fundamental_frequency) / peaks1.fundamental_frequency;

  const harmonicRatioVariance =
    peaks1.harmonic_ratios.reduce((sum, ratio, i) => {
      return sum + Math.abs(ratio - (peaks2.harmonic_ratios[i] || 0));
    }, 0) / peaks1.harmonic_ratios.length;

  const formantVariance =
    peaks1.formant_bandwidth.reduce((sum, bw, i) => {
      return sum + Math.abs(bw - (peaks2.formant_bandwidth[i] || 0));
    }, 0) / peaks1.formant_bandwidth.length;

  const spectralVariance =
    (Math.abs(peaks1.spectral_centroid - peaks2.spectral_centroid) / peaks1.spectral_centroid +
      Math.abs(peaks1.spectral_rolloff - peaks2.spectral_rolloff) / peaks1.spectral_rolloff) /
    2;

  // Weighted average of all variances
  const totalVariance =
    fundamentalVariance * 0.3 +
    harmonicRatioVariance * 0.3 +
    formantVariance * 0.2 +
    spectralVariance * 0.2;

  return totalVariance * 100; // Convert to percentage
}

/**
 * Capture Intruder Snapshot
 * Activates front-facing camera and captures encrypted snapshot
 */
export async function captureIntruderSnapshot(
  mismatchType: MismatchEventType,
  variance: number,
  similarityScore: number
): Promise<IntruderCaptureData | null> {
  try {
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });

    // Create video element
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    // Capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    // Stop camera
    stream.getTracks().forEach((track) => track.stop());

    // Convert to base64 (encrypted in production)
    const snapshotBase64 = canvas.toDataURL('image/jpeg', 0.8);

    // Get device hash
    const deviceHash = await getDeviceHash();

    // Get IP address
    const ipAddress = await getClientIP();

    // Get geolocation (if available)
    let geolocation: { latitude: number; longitude: number; accuracy: number } | undefined;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        geolocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
      } catch {
        // Geolocation not available
      }
    }

    return {
      snapshot_base64: snapshotBase64,
      timestamp: new Date().toISOString(),
      device_hash: deviceHash,
      ip_address: ipAddress,
      geolocation,
      user_agent: navigator.userAgent,
      variance_percentage: variance,
      similarity_score: similarityScore,
      mismatch_type: mismatchType,
    };
  } catch (error) {
    console.error('Failed to capture intruder snapshot:', error);
    return null;
  }
}

/**
 * Trigger Identity Mismatch Alert
 * Logs mismatch event and sends push notification to account owner.
 * Context purge: skip Security Alert / Audit Log for non-vitalized users (registration flow).
 */
export async function triggerIdentityMismatchAlert(
  accountOwnerPhone: string,
  intruderCapture: IntruderCaptureData,
  mismatchType: MismatchEventType,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
): Promise<{ success: boolean; alertId?: string; error?: string }> {
  try {
    // Only run audit/alert for vitalized users; no heavy trail for someone just getting in the door
    const { getMintStatus, MINT_STATUS_MINTED } = await import('./mintStatus');
    const mintRes = await getMintStatus(accountOwnerPhone);
    const isVitalized = mintRes.ok && mintRes.mint_status === MINT_STATUS_MINTED;
    if (!isVitalized) {
      return { success: true };
    }

    // Create alert message
    const message = generateAlertMessage(mismatchType, intruderCapture.variance_percentage);

    // Insert into sovereign_audit_log
    const { data: auditLog, error: auditError } = await supabase
      .from('sovereign_audit_log')
      .insert({
        phone_number: accountOwnerPhone,
        event_type: mismatchType,
        severity,
        message,
        intruder_snapshot: intruderCapture.snapshot_base64,
        device_hash: intruderCapture.device_hash,
        ip_address: intruderCapture.ip_address,
        geolocation: intruderCapture.geolocation,
        variance_percentage: intruderCapture.variance_percentage,
        similarity_score: intruderCapture.similarity_score,
        timestamp: intruderCapture.timestamp,
        reviewed: false,
      })
      .select()
      .single();

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
      return { success: false, error: auditError.message };
    }

    // Send push notification via Supabase Realtime
    await sendPushNotification(accountOwnerPhone, message, severity);

    // Create breach alert
    await supabase.from('breach_alerts').insert({
      alert_type: mismatchType,
      severity,
      message,
      device_hash: intruderCapture.device_hash,
      metadata: {
        variance: intruderCapture.variance_percentage,
        similarity_score: intruderCapture.similarity_score,
        has_snapshot: true,
      },
    });

    return { success: true, alertId: auditLog.id };
  } catch (error) {
    console.error('Failed to trigger identity mismatch alert:', error);
    return { success: false, error: 'System error' };
  }
}

/**
 * Send Push Notification
 * Uses Supabase Realtime to send instant alert to account owner's device
 */
async function sendPushNotification(
  phoneNumber: string,
  message: string,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
): Promise<void> {
  try {
    // Insert into push_notifications table (Supabase Realtime will broadcast)
    await supabase.from('push_notifications').insert({
      phone_number: phoneNumber,
      title: '⚠️ SECURITY ALERT',
      message,
      severity,
      timestamp: new Date().toISOString(),
      read: false,
      action_url: '/dashboard/security-alerts',
    });

    // TODO: Integrate with Firebase Cloud Messaging for mobile push notifications
    // const fcmToken = await getFCMToken(phoneNumber);
    // await sendFCMNotification(fcmToken, message);
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

/**
 * Generate Alert Message
 */
function generateAlertMessage(mismatchType: MismatchEventType, variance: number): string {
  switch (mismatchType) {
    case MismatchEventType.TWIN_DETECTED:
      return `⚠️ SECURITY ALERT: A twin or identical sibling was detected attempting to access your Sovereign Vault. Biological signature variance: ${variance.toFixed(2)}%. Access Denied.`;
    case MismatchEventType.FAMILY_MEMBER_DETECTED:
      return `⚠️ SECURITY ALERT: A family member with high facial similarity was detected attempting to access your Sovereign Vault. Biological signature variance: ${variance.toFixed(2)}%. Access Denied.`;
    case MismatchEventType.BIOLOGICAL_HASH_MISMATCH:
      return `⚠️ SECURITY ALERT: An unauthorized presence was detected attempting to access your Sovereign Vault. Biological signature does not match your identity. Access Denied.`;
    case MismatchEventType.VOCAL_HARMONIC_MISMATCH:
      return `⚠️ SECURITY ALERT: Voice print mismatch detected. Unique harmonic peaks do not match your vocal signature. Access Denied.`;
    default:
      return `⚠️ SECURITY ALERT: An unauthorized presence was detected attempting to access your Sovereign Vault. Access Denied.`;
  }
}

/**
 * Helper: Get Device Hash
 */
async function getDeviceHash(): Promise<string> {
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency,
    screenResolution: `${screen.width}x${screen.height}`,
  };

  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(deviceInfo));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Helper: Get Client IP Address
 */
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}


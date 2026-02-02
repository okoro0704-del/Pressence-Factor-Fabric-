/**
 * PFF Core — OEM Hardware Binding & Certification Protocol
 * Device-bound licensing with pre-install detection and certification signatures
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Hardcode device-bound licensing (isLicenseTransferable = FALSE)
 * - Pre-install detection to skip download phase
 * - Hardware certification hook for OEM sensor specs
 * - Enforce $10 Sovereign Fee even on pre-installed devices
 * - Sentinel Certified branding for OEM-partnered builds
 */

// ============================================================================
// DEVICE-BOUND LICENSING CONSTANTS
// ============================================================================

/**
 * License Transferability Flag
 * HARDCODED to FALSE - Sentinel activation is unique to Device_UUID and Hardware_TPM_Hash
 * License CANNOT be transferred to another device
 */
export const IS_LICENSE_TRANSFERABLE = false;

/**
 * Sentinel Activation Fee (USD)
 * MANDATORY for all activations, including pre-installed devices
 */
export const SENTINEL_ACTIVATION_FEE_USD = 10.0;

/**
 * Pre-Install Detection Flag
 * If TRUE, Sentinel skips 'Download' phase and goes straight to 'Handshake & Activate'
 */
export type PreInstallStatus = 'PRE_INSTALLED' | 'USER_INSTALLED';

// ============================================================================
// HARDWARE CERTIFICATION TYPES
// ============================================================================

/**
 * OEM Sensor Specifications
 * Submitted by OEM for 'Sentinel Certified' digital signature
 */
export interface OEMSensorSpecs {
  /** OEM manufacturer name */
  manufacturer: string;
  
  /** Device model */
  deviceModel: string;
  
  /** Camera specifications for Visual Liveness (Phase 1) */
  camera: {
    resolution: string; // e.g., "12MP", "48MP"
    fps: number; // Frames per second for liveness detection
    hasInfraredSensor: boolean; // For depth/liveness detection
    hasTrueDepthCamera: boolean; // iOS TrueDepth or equivalent
    apiVersion: string; // Camera API version
  };
  
  /** Fingerprint sensor specifications for Tactile Identity (Phase 2) */
  fingerprint: {
    sensorType: 'OPTICAL' | 'CAPACITIVE' | 'ULTRASONIC';
    resolution: number; // DPI
    hasLivenesDetection: boolean;
    apiVersion: string; // Fingerprint API version
  };
  
  /** Heart rate sensor specifications for Vital Pulse (Phase 3) */
  heartRate: {
    sensorType: 'PPG' | 'ECG' | 'CAMERA_PPG'; // Photoplethysmography, Electrocardiogram, or Camera-based
    samplingRate: number; // Hz
    accuracy: string; // e.g., "±2 BPM"
    apiVersion: string; // Heart rate API version
  };
  
  /** Voice/microphone specifications for Vital Pulse (Phase 3) */
  voice: {
    microphoneType: string; // e.g., "MEMS", "Condenser"
    samplingRate: number; // Hz (e.g., 48000)
    bitDepth: number; // bits (e.g., 16, 24)
    hasNoiseReduction: boolean;
    apiVersion: string; // Audio API version
  };
  
  /** Secure enclave/TPM specifications */
  secureHardware: {
    hasSecureEnclave: boolean; // iOS Secure Enclave
    hasTPM: boolean; // Trusted Platform Module
    hasTEE: boolean; // Trusted Execution Environment (Android)
    tpmVersion?: string; // e.g., "TPM 2.0"
    attestationSupported: boolean;
  };
}

/**
 * Hardware Certification Request
 * Submitted by OEM to PFF Protocol for certification
 */
export interface HardwareCertificationRequest {
  /** OEM company information */
  oemInfo: {
    companyName: string;
    contactEmail: string;
    website: string;
    registrationNumber: string; // Business registration number
  };
  
  /** Device sensor specifications */
  sensorSpecs: OEMSensorSpecs;
  
  /** Pre-install configuration */
  preInstallConfig: {
    isPreInstalled: boolean;
    buildVersion: string;
    buildDate: string;
  };
  
  /** Submission timestamp */
  submittedAt: Date;
}

/**
 * Hardware Certification Signature
 * Digital signature issued by PFF Protocol for 'Sentinel Certified' devices
 */
export interface HardwareCertificationSignature {
  /** Certification ID */
  certificationId: string;
  
  /** OEM manufacturer name */
  manufacturer: string;
  
  /** Device model */
  deviceModel: string;
  
  /** Certification status */
  status: 'PENDING' | 'CERTIFIED' | 'REJECTED' | 'REVOKED';
  
  /** Certification level */
  certificationLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  
  /** Digital signature (SHA-256 hash of certification data) */
  signature: string;
  
  /** Issued date */
  issuedAt: Date;
  
  /** Expiry date (certifications valid for 2 years) */
  expiresAt: Date;
  
  /** Certification badge URL */
  badgeUrl: string;
  
  /** Watermark text for boot screen */
  watermarkText: string; // e.g., "Sentinel Certified - Gold"
}

/**
 * Device Binding Information
 * Unique identifiers that bind Sentinel license to specific device
 */
export interface DeviceBindingInfo {
  /** Device UUID (iOS: identifierForVendor, Android: androidId) */
  deviceUUID: string;
  
  /** Hardware TPM Hash (SHA-256 hash of TPM attestation) */
  hardwareTPMHash: string;
  
  /** Device fingerprint (from existing implementation) */
  deviceFingerprint: string;
  
  /** License transferability flag (always FALSE) */
  isLicenseTransferable: boolean; // Always false
  
  /** Pre-install status */
  preInstallStatus: PreInstallStatus;
  
  /** OEM certification ID (if device is OEM-certified) */
  oemCertificationId?: string;
}

/**
 * Sentinel Activation Metadata
 * Extended metadata for OEM-certified devices
 */
export interface SentinelActivationMetadata {
  /** Device binding information */
  deviceBinding: DeviceBindingInfo;
  
  /** Activation fee paid (always $10 USD, even for pre-installed) */
  activationFeePaid: number;
  
  /** Pre-install detection result */
  isPreInstalled: boolean;
  
  /** OEM certification signature (if applicable) */
  oemCertification?: HardwareCertificationSignature;
  
  /** Boot screen watermark enabled */
  bootScreenWatermarkEnabled: boolean;
}


/**
 * PFF Backend — OEM Hardware Certification Service
 * Process OEM certification requests and issue digital signatures
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Process OEM sensor spec submissions
 * - Validate hardware capabilities
 * - Issue 'Sentinel Certified' digital signatures
 * - Manage certification lifecycle (issue, renew, revoke)
 */

import * as crypto from 'crypto';
import { query, pool } from '../db/client';
import type {
  HardwareCertificationRequest,
  HardwareCertificationSignature,
  OEMSensorSpecs,
} from '../../../core/oemCertification';

// ============================================================================
// CERTIFICATION VALIDATION LOGIC
// ============================================================================

/**
 * Certification Level Criteria
 * Determines certification level based on sensor capabilities
 */
interface CertificationCriteria {
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  requirements: {
    cameraMinResolution: number; // Megapixels
    cameraMinFPS: number;
    requiresInfraredSensor: boolean;
    fingerprintMinDPI: number;
    requiresFingerprintLiveness: boolean;
    requiresHeartRateSensor: boolean;
    requiresSecureEnclave: boolean;
    requiresTPM: boolean;
    requiresAttestation: boolean;
  };
}

const CERTIFICATION_LEVELS: CertificationCriteria[] = [
  {
    level: 'PLATINUM',
    requirements: {
      cameraMinResolution: 48,
      cameraMinFPS: 60,
      requiresInfraredSensor: true,
      fingerprintMinDPI: 508,
      requiresFingerprintLiveness: true,
      requiresHeartRateSensor: true,
      requiresSecureEnclave: true,
      requiresTPM: true,
      requiresAttestation: true,
    },
  },
  {
    level: 'GOLD',
    requirements: {
      cameraMinResolution: 12,
      cameraMinFPS: 30,
      requiresInfraredSensor: true,
      fingerprintMinDPI: 508,
      requiresFingerprintLiveness: true,
      requiresHeartRateSensor: true,
      requiresSecureEnclave: true,
      requiresTPM: false,
      requiresAttestation: true,
    },
  },
  {
    level: 'SILVER',
    requirements: {
      cameraMinResolution: 8,
      cameraMinFPS: 30,
      requiresInfraredSensor: false,
      fingerprintMinDPI: 500,
      requiresFingerprintLiveness: false,
      requiresHeartRateSensor: true,
      requiresSecureEnclave: true,
      requiresTPM: false,
      requiresAttestation: false,
    },
  },
  {
    level: 'BRONZE',
    requirements: {
      cameraMinResolution: 5,
      cameraMinFPS: 24,
      requiresInfraredSensor: false,
      fingerprintMinDPI: 400,
      requiresFingerprintLiveness: false,
      requiresHeartRateSensor: false,
      requiresSecureEnclave: true,
      requiresTPM: false,
      requiresAttestation: false,
    },
  },
];

/**
 * Determine certification level based on sensor specs
 */
function determineCertificationLevel(specs: OEMSensorSpecs): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | null {
  // Parse camera resolution (e.g., "12MP" -> 12)
  const cameraResolution = parseInt(specs.camera.resolution.replace(/[^0-9]/g, ''), 10);
  
  // Check each level from highest to lowest
  for (const criteria of CERTIFICATION_LEVELS) {
    const meetsRequirements =
      cameraResolution >= criteria.requirements.cameraMinResolution &&
      specs.camera.fps >= criteria.requirements.cameraMinFPS &&
      (!criteria.requirements.requiresInfraredSensor || specs.camera.hasInfraredSensor) &&
      specs.fingerprint.resolution >= criteria.requirements.fingerprintMinDPI &&
      (!criteria.requirements.requiresFingerprintLiveness || specs.fingerprint.hasLivenesDetection) &&
      (!criteria.requirements.requiresHeartRateSensor || specs.heartRate.sensorType !== 'CAMERA_PPG') &&
      (!criteria.requirements.requiresSecureEnclave || specs.secureHardware.hasSecureEnclave) &&
      (!criteria.requirements.requiresTPM || specs.secureHardware.hasTPM) &&
      (!criteria.requirements.requiresAttestation || specs.secureHardware.attestationSupported);
    
    if (meetsRequirements) {
      return criteria.level;
    }
  }
  
  return null; // Does not meet minimum requirements
}

/**
 * Generate certification signature
 * SHA-256 hash of certification data
 */
function generateCertificationSignature(
  certificationId: string,
  manufacturer: string,
  deviceModel: string,
  level: string,
  issuedAt: Date
): string {
  const dataToSign = JSON.stringify({
    certificationId,
    manufacturer,
    deviceModel,
    level,
    issuedAt: issuedAt.toISOString(),
  });
  
  return crypto
    .createHash('sha256')
    .update(dataToSign)
    .digest('hex');
}

/**
 * Generate watermark text for boot screen
 */
function generateWatermarkText(level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'): string {
  const levelEmojis = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎',
  };
  
  return `${levelEmojis[level]} Sentinel Certified - ${level}`;
}

// ============================================================================
// CERTIFICATION PROCESSING
// ============================================================================

/**
 * Process OEM hardware certification request
 * Validates sensor specs and issues digital signature
 */
export async function processHardwareCertification(
  request: HardwareCertificationRequest
): Promise<HardwareCertificationSignature> {
  const certificationId = crypto.randomBytes(16).toString('hex');
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years
  
  // Determine certification level
  const certificationLevel = determineCertificationLevel(request.sensorSpecs);
  
  if (!certificationLevel) {
    throw new Error('Device does not meet minimum certification requirements');
  }
  
  // Generate signature
  const signature = generateCertificationSignature(
    certificationId,
    request.sensorSpecs.manufacturer,
    request.sensorSpecs.deviceModel,
    certificationLevel,
    issuedAt
  );
  
  // Generate watermark text
  const watermarkText = generateWatermarkText(certificationLevel);
  
  // Generate badge URL
  const badgeUrl = `https://pff.sentinel.certified/badges/${certificationId}.png`;
  
  // Store certification in database
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `INSERT INTO oem_certifications
       (certification_id, manufacturer, device_model, status, certification_level,
        signature, issued_at, expires_at, badge_url, watermark_text,
        sensor_specs, oem_info, pre_install_config)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        certificationId,
        request.sensorSpecs.manufacturer,
        request.sensorSpecs.deviceModel,
        'CERTIFIED',
        certificationLevel,
        signature,
        issuedAt,
        expiresAt,
        badgeUrl,
        watermarkText,
        JSON.stringify(request.sensorSpecs),
        JSON.stringify(request.oemInfo),
        JSON.stringify(request.preInstallConfig),
      ]
    );
    
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  
  return {
    certificationId,
    manufacturer: request.sensorSpecs.manufacturer,
    deviceModel: request.sensorSpecs.deviceModel,
    status: 'CERTIFIED',
    certificationLevel,
    signature,
    issuedAt,
    expiresAt,
    badgeUrl,
    watermarkText,
  };
}


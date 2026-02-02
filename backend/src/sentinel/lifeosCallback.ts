/**
 * PFF Backend — LifeOS Security Status Callback
 * Encrypted callback to LifeOS interface for Security Status badge
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * Purpose:
 * - Provide encrypted callback to LifeOS interface
 * - Update 'Security Status' badge without exposing biometric data
 * - Track security level (STANDARD, SENTINEL, FORTRESS)
 * - Maintain zero-knowledge principle (no raw biometric data)
 */

import * as crypto from 'crypto';
import { query } from '../db/client';
import type { LifeOSSecurityStatusCallback } from '../../../core/sentinelOptIn';

export type SecurityLevel = 'STANDARD' | 'SENTINEL' | 'FORTRESS';

export interface SecurityStatusBadge {
  level: SecurityLevel;
  color: string;
  icon: string;
  description: string;
}

/**
 * Get security badge configuration based on level
 */
function getSecurityBadge(level: SecurityLevel): SecurityStatusBadge {
  switch (level) {
    case 'FORTRESS':
      return {
        level: 'FORTRESS',
        color: '#c9a227', // Gold
        icon: '🏛️',
        description: 'Maximum security with Sentinel system-level wrapping',
      };
    case 'SENTINEL':
      return {
        level: 'SENTINEL',
        color: '#4ade80', // Green
        icon: '🛡️',
        description: 'Enhanced security with Sentinel daemon active',
      };
    case 'STANDARD':
    default:
      return {
        level: 'STANDARD',
        color: '#6b6b70', // Gray
        icon: '🔒',
        description: 'Standard PFF biometric security',
      };
  }
}

/**
 * Encrypt metadata for LifeOS callback
 * Ensures no biometric data is exposed
 */
function encryptMetadata(
  citizenId: string,
  metadata: Record<string, unknown>
): string {
  // Generate encryption key from citizen ID (in production, use proper key management)
  const encryptionKey = crypto
    .createHash('sha256')
    .update(`lifeos-${citizenId}`)
    .digest();
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  
  const metadataJson = JSON.stringify(metadata);
  let encrypted = cipher.update(metadataJson, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Determine security level based on citizen's security configuration
 */
async function determineSecurityLevel(citizenId: string): Promise<SecurityLevel> {
  // Check if Sentinel is active
  const sentinelResult = await query<{ status: string }>(
    `SELECT status FROM sentinel_activations
     WHERE citizen_id = $1 AND status = 'ACTIVE'
     ORDER BY activated_at DESC
     LIMIT 1`,
    [citizenId]
  );
  
  if (sentinelResult.rows.length > 0) {
    // Check if Fortress mode is enabled (future enhancement)
    // For now, Sentinel activation = SENTINEL level
    return 'SENTINEL';
  }
  
  return 'STANDARD';
}

/**
 * Generate LifeOS Security Status Callback
 * Returns encrypted callback data for LifeOS interface
 */
export async function generateLifeOSCallback(
  citizenId: string
): Promise<LifeOSSecurityStatusCallback> {
  const securityLevel = await determineSecurityLevel(citizenId);
  const badge = getSecurityBadge(securityLevel);
  const lastUpdated = new Date();
  
  // Prepare metadata (no biometric data)
  const metadata = {
    securityLevel,
    lastVerified: lastUpdated.toISOString(),
    pffActive: true,
    // No biometric templates, no raw sensor data, no fingerprints, no face data
  };
  
  // Encrypt metadata
  const encryptedMetadata = encryptMetadata(citizenId, metadata);
  
  // Determine security status
  let securityStatus: LifeOSSecurityStatusCallback['securityStatus'];
  switch (securityLevel) {
    case 'FORTRESS':
    case 'SENTINEL':
      securityStatus = 'SENTINEL_ACTIVE';
      break;
    default:
      securityStatus = 'SENTINEL_INACTIVE';
  }
  
  return {
    citizenId,
    securityStatus,
    statusBadge: {
      level: badge.level,
      color: badge.color,
      icon: badge.icon,
    },
    lastUpdated,
    encryptedMetadata,
  };
}

/**
 * Send callback to LifeOS interface
 * In production, this would POST to LifeOS webhook endpoint
 */
export async function sendLifeOSCallback(
  citizenId: string,
  callbackUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const callback = await generateLifeOSCallback(citizenId);
    
    // Log callback event
    await query(
      `INSERT INTO system_events (event_type, event_data, created_at)
       VALUES ($1, $2, $3)`,
      [
        'LIFEOS_SECURITY_CALLBACK',
        JSON.stringify({
          citizenId,
          securityStatus: callback.securityStatus,
          securityLevel: callback.statusBadge.level,
          timestamp: callback.lastUpdated.toISOString(),
        }),
        new Date(),
      ]
    );
    
    // In production, send to LifeOS webhook
    if (callbackUrl) {
      // TODO: Implement actual HTTP POST to LifeOS
      // await fetch(callbackUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(callback),
      // });
    }
    
    return { success: true };
  } catch (e) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}


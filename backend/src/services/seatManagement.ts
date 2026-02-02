/**
 * PFF Backend — Seat Management Service
 * Manage device bindings for Tier 2 & Tier 3 Sentinel licenses
 * Architect: Isreal Okoro (mrfundzman)
 *
 * Purpose:
 * - Bind new devices to multi-device licenses
 * - Revoke device bindings
 * - Check available seats
 * - Get active seats for a license
 */

import { query, pool } from '../db/client';
import * as crypto from 'crypto';

export interface SeatBindingRequest {
  licenseId: string;
  hardwareTpmHash: string;
  deviceId: string;
  deviceFingerprint: string;
  devicePlatform?: string;
  deviceModel?: string;
  masterSecurityToken?: string;
}

export interface SeatBindingResult {
  success: boolean;
  seatId?: string;
  error?: string;
  seatsUsed?: number;
  seatsAvailable?: number;
}

export interface SeatRevocationRequest {
  seatId: string;
  revokedBy: string; // PFF ID of user revoking
  revocationReason?: string;
}

export interface SeatRevocationResult {
  success: boolean;
  error?: string;
  seatsUsed?: number;
  seatsAvailable?: number;
}

export interface LicenseSeat {
  id: string;
  licenseId: string;
  hardwareTpmHash: string;
  deviceId: string;
  deviceFingerprint: string;
  devicePlatform?: string;
  deviceModel?: string;
  boundAt: Date;
  lastActiveAt?: Date;
  status: string;
}

/**
 * Check if a license has available seats
 */
export async function canBindNewDevice(licenseId: string): Promise<{ canBind: boolean; seatsUsed: number; maxDevices: number; seatsAvailable: number }> {
  const result = await query<{
    max_devices: number;
    seats_used: string;
  }>(
    `SELECT 
       l.max_devices,
       COUNT(s.id) as seats_used
     FROM sentinel_licenses l
     LEFT JOIN sentinel_license_seats s ON l.id = s.license_id AND s.status = 'ACTIVE'
     WHERE l.id = $1 AND l.status = 'ACTIVE'
     GROUP BY l.id, l.max_devices`,
    [licenseId]
  );

  if (result.rows.length === 0) {
    return { canBind: false, seatsUsed: 0, maxDevices: 0, seatsAvailable: 0 };
  }

  const maxDevices = result.rows[0].max_devices;
  const seatsUsed = parseInt(result.rows[0].seats_used);
  const seatsAvailable = maxDevices - seatsUsed;

  return {
    canBind: seatsAvailable > 0,
    seatsUsed,
    maxDevices,
    seatsAvailable,
  };
}

/**
 * Bind a new device to a license
 */
export async function bindDeviceToLicense(request: SeatBindingRequest): Promise<SeatBindingResult> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if license has available seats
    const availability = await canBindNewDevice(request.licenseId);
    
    if (!availability.canBind) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: `No available seats. ${availability.seatsUsed}/${availability.maxDevices} seats used.`,
        seatsUsed: availability.seatsUsed,
        seatsAvailable: availability.seatsAvailable,
      };
    }

    // Check if hardware TPM hash is already bound to this license
    const existingResult = await client.query(
      `SELECT id FROM sentinel_license_seats 
       WHERE license_id = $1 AND hardware_tpm_hash = $2`,
      [request.licenseId, request.hardwareTpmHash]
    );

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Device already bound to this license',
        seatsUsed: availability.seatsUsed,
        seatsAvailable: availability.seatsAvailable,
      };
    }

    // Bind new device
    const insertResult = await client.query<{ id: string }>(
      `INSERT INTO sentinel_license_seats 
       (license_id, hardware_tpm_hash, device_id, device_fingerprint, device_platform, device_model, master_security_token, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
       RETURNING id`,
      [
        request.licenseId,
        request.hardwareTpmHash,
        request.deviceId,
        request.deviceFingerprint,
        request.devicePlatform || null,
        request.deviceModel || null,
        request.masterSecurityToken || null,
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      seatId: insertResult.rows[0].id,
      seatsUsed: availability.seatsUsed + 1,
      seatsAvailable: availability.seatsAvailable - 1,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    const err = e as Error;
    return {
      success: false,
      error: err.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Revoke a device binding from a license
 */
export async function revokeDeviceFromLicense(request: SeatRevocationRequest): Promise<SeatRevocationResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get seat information
    const seatResult = await client.query<{
      license_id: string;
      hardware_tpm_hash: string;
      device_id: string;
      status: string;
    }>(
      `SELECT license_id, hardware_tpm_hash, device_id, status
       FROM sentinel_license_seats
       WHERE id = $1`,
      [request.seatId]
    );

    if (seatResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Seat not found',
      };
    }

    const seat = seatResult.rows[0];

    if (seat.status === 'REVOKED') {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Seat already revoked',
      };
    }

    // Update seat status to REVOKED
    await client.query(
      `UPDATE sentinel_license_seats
       SET status = 'REVOKED', revoked_at = NOW(), revoked_by = $1, revocation_reason = $2, updated_at = NOW()
       WHERE id = $3`,
      [request.revokedBy, request.revocationReason || null, request.seatId]
    );

    // Get citizen info for audit trail
    const licenseResult = await client.query<{
      citizen_id: string;
      pff_id: string;
    }>(
      `SELECT citizen_id, pff_id FROM sentinel_licenses WHERE id = $1`,
      [seat.license_id]
    );

    const license = licenseResult.rows[0];

    // Log revocation to audit trail
    await client.query(
      `INSERT INTO sentinel_seat_revocations
       (seat_id, license_id, citizen_id, pff_id, hardware_tpm_hash, device_id, revoked_by, revocation_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        request.seatId,
        seat.license_id,
        license.citizen_id,
        license.pff_id,
        seat.hardware_tpm_hash,
        seat.device_id,
        request.revokedBy,
        request.revocationReason || null,
      ]
    );

    await client.query('COMMIT');

    // Get updated seat counts
    const availability = await canBindNewDevice(seat.license_id);

    return {
      success: true,
      seatsUsed: availability.seatsUsed,
      seatsAvailable: availability.seatsAvailable,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    const err = e as Error;
    return {
      success: false,
      error: err.message,
    };
  } finally {
    client.release();
  }
}

/**
 * Get all active seats for a license
 */
export async function getActiveSeatsByLicense(licenseId: string): Promise<LicenseSeat[]> {
  const result = await query<{
    id: string;
    license_id: string;
    hardware_tpm_hash: string;
    device_id: string;
    device_fingerprint: string;
    device_platform: string;
    device_model: string;
    bound_at: Date;
    last_active_at: Date;
    status: string;
  }>(
    `SELECT
       id,
       license_id,
       hardware_tpm_hash,
       device_id,
       device_fingerprint,
       device_platform,
       device_model,
       bound_at,
       last_active_at,
       status
     FROM sentinel_license_seats
     WHERE license_id = $1 AND status = 'ACTIVE'
     ORDER BY bound_at ASC`,
    [licenseId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    licenseId: row.license_id,
    hardwareTpmHash: row.hardware_tpm_hash,
    deviceId: row.device_id,
    deviceFingerprint: row.device_fingerprint,
    devicePlatform: row.device_platform,
    deviceModel: row.device_model,
    boundAt: row.bound_at,
    lastActiveAt: row.last_active_at,
    status: row.status,
  }));
}

/**
 * Update last active timestamp for a seat
 */
export async function updateSeatLastActive(seatId: string): Promise<void> {
  await query(
    `UPDATE sentinel_license_seats
     SET last_active_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [seatId]
  );
}


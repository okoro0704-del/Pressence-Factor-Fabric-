/**
 * PFF Backend — Seat Management Routes
 * API endpoints for managing device bindings in Tier 2 & 3 licenses
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import {
  bindDeviceToLicense,
  revokeDeviceFromLicense,
  getActiveSeatsByLicense,
  canBindNewDevice,
  updateSeatLastActive,
} from '../services/seatManagement';
import { query } from '../db/client';

const router = Router();

/**
 * POST /api/seat-management/bind-device
 * Bind a new device to a multi-device license (Tier 2 or Tier 3)
 */
router.post('/bind-device', async (req: Request, res: Response) => {
  try {
    const {
      licenseId,
      hardwareTpmHash,
      deviceId,
      deviceFingerprint,
      devicePlatform,
      deviceModel,
      masterSecurityToken,
    } = req.body;

    if (!licenseId || !hardwareTpmHash || !deviceId || !deviceFingerprint) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: licenseId, hardwareTpmHash, deviceId, deviceFingerprint',
      });
      return;
    }

    const result = await bindDeviceToLicense({
      licenseId,
      hardwareTpmHash,
      deviceId,
      deviceFingerprint,
      devicePlatform,
      deviceModel,
      masterSecurityToken,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        seatId: result.seatId,
        seatsUsed: result.seatsUsed,
        seatsAvailable: result.seatsAvailable,
        message: 'Device bound successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        seatsUsed: result.seatsUsed,
        seatsAvailable: result.seatsAvailable,
      });
    }
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * DELETE /api/seat-management/revoke-device/:seatId
 * Revoke a device binding from a license
 */
router.delete('/revoke-device/:seatId', async (req: Request, res: Response) => {
  try {
    const { seatId } = req.params;
    const { revokedBy, revocationReason } = req.body;

    if (!revokedBy) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: revokedBy (PFF ID)',
      });
      return;
    }

    const result = await revokeDeviceFromLicense({
      seatId,
      revokedBy,
      revocationReason,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        seatsUsed: result.seatsUsed,
        seatsAvailable: result.seatsAvailable,
        message: 'Device revoked successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/seat-management/seats/:licenseId
 * Get all active seats for a license
 */
router.get('/seats/:licenseId', async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;

    const seats = await getActiveSeatsByLicense(licenseId);

    res.status(200).json({
      success: true,
      seats,
      totalSeats: seats.length,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/seat-management/available-seats/:licenseId
 * Check available seats for a license
 */
router.get('/available-seats/:licenseId', async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;

    const availability = await canBindNewDevice(licenseId);

    res.status(200).json({
      success: true,
      canBind: availability.canBind,
      seatsUsed: availability.seatsUsed,
      maxDevices: availability.maxDevices,
      seatsAvailable: availability.seatsAvailable,
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;


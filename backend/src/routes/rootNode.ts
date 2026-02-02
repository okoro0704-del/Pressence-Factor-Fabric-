/**
 * PFF Backend — Root Sentinel Node Routes
 * API endpoints for Root Node activation, verification, and emergency stasis
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import { executeRootNodeActivation } from '../sentinel/rootNodeActivation';
import {
  triggerEmergencyStasis,
  resolveEmergencyStasis,
  isStasisActive,
  getStasisStatus,
  verifyRootPairIntegrity,
  verifyGenesisAuthority,
} from '../sentinel/emergencyStasis';
import { query } from '../db/client';

const router = Router();

/**
 * POST /api/root-node/activate
 * Execute Root Sentinel Node Activation (The Architect's Seal)
 * This should ONLY be called ONCE during initial system setup
 */
router.post('/activate', async (req: Request, res: Response) => {
  try {
    const {
      laptopDeviceId,
      mobileDeviceId,
      laptopPlatformInfo,
      mobilePlatformInfo,
      laptopTPMAttestation,
      mobileSecureEnclaveAttestation,
      faceSignature,
      fingerSignature,
      heartSignature,
      voiceSignature,
      architectPffId,
      architectCitizenId,
    } = req.body;

    // Validate required fields
    if (
      !laptopDeviceId ||
      !mobileDeviceId ||
      !laptopPlatformInfo ||
      !mobilePlatformInfo ||
      !laptopTPMAttestation ||
      !mobileSecureEnclaveAttestation ||
      !faceSignature ||
      !fingerSignature ||
      !heartSignature ||
      !voiceSignature ||
      !architectPffId ||
      !architectCitizenId
    ) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required for Root Node activation',
      });
    }

    // Check if Root Node already exists
    const existingNode = await query(
      `SELECT node_id FROM alpha_node_status WHERE status != 'ALPHA_NODE_COMPROMISED' LIMIT 1`
    );

    if (existingNode.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Root Node already exists. Only one Root Node can be activated.',
      });
    }

    const result = await executeRootNodeActivation(
      laptopDeviceId,
      mobileDeviceId,
      laptopPlatformInfo,
      mobilePlatformInfo,
      laptopTPMAttestation,
      mobileSecureEnclaveAttestation,
      faceSignature,
      fingerSignature,
      heartSignature,
      voiceSignature,
      architectPffId,
      architectCitizenId
    );

    if (result.success) {
      res.json({
        success: true,
        result,
        message: 'ROOT_NODE_ESTABLISHED. THE ARCHITECT IS VITALIZED. WE ARE LIVE.',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Root Node activation failed',
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[ROOT NODE] Activation failed:', err);
    res.status(500).json({
      success: false,
      error: 'Root Node activation failed',
      details: err.message,
    });
  }
});

/**
 * POST /api/root-node/verify-pair
 * Verify Root Sovereign Pair integrity
 */
router.post('/verify-pair', async (req: Request, res: Response) => {
  try {
    const { laptopDeviceUUID, mobileDeviceUUID, pairBindingHash } = req.body;

    if (!laptopDeviceUUID || !mobileDeviceUUID || !pairBindingHash) {
      return res.status(400).json({
        success: false,
        error: 'laptopDeviceUUID, mobileDeviceUUID, and pairBindingHash are required',
      });
    }

    const verification = await verifyRootPairIntegrity(
      laptopDeviceUUID,
      mobileDeviceUUID,
      pairBindingHash
    );

    res.json({
      success: verification.valid,
      valid: verification.valid,
      reason: verification.reason,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[ROOT NODE] Pair verification failed:', err);
    res.status(500).json({
      success: false,
      error: 'Pair verification failed',
      details: err.message,
    });
  }
});

/**
 * POST /api/root-node/verify-genesis
 * Verify Genesis Authority Hash
 */
router.post('/verify-genesis', async (req: Request, res: Response) => {
  try {
    const { faceSignature, fingerSignature, heartSignature, voiceSignature } = req.body;

    if (!faceSignature || !fingerSignature || !heartSignature || !voiceSignature) {
      return res.status(400).json({
        success: false,
        error: 'All biometric signatures (face, finger, heart, voice) are required',
      });
    }

    const verification = await verifyGenesisAuthority(
      faceSignature,
      fingerSignature,
      heartSignature,
      voiceSignature
    );

    res.json({
      success: verification.valid,
      valid: verification.valid,
      reason: verification.reason,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[ROOT NODE] Genesis verification failed:', err);
    res.status(500).json({
      success: false,
      error: 'Genesis verification failed',
      details: err.message,
    });
  }
});

/**
 * POST /api/root-node/trigger-stasis
 * Trigger Emergency Stasis (freezes all revenue flows)
 */
router.post('/trigger-stasis', async (req: Request, res: Response) => {
  try {
    const { nodeId, triggerReason } = req.body;

    if (!nodeId || !triggerReason) {
      return res.status(400).json({
        success: false,
        error: 'nodeId and triggerReason are required',
      });
    }

    const result = await triggerEmergencyStasis(nodeId, triggerReason);

    if (result.success) {
      res.json({
        success: true,
        result,
        message: '⚠️ EMERGENCY STASIS ACTIVATED. ALL REVENUE FLOWS FROZEN.',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Emergency stasis activation failed',
        result,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[ROOT NODE] Stasis trigger failed:', err);
    res.status(500).json({
      success: false,
      error: 'Emergency stasis activation failed',
      details: err.message,
    });
  }
});

/**
 * POST /api/root-node/resolve-stasis
 * Resolve Emergency Stasis (requires Architect re-verification)
 */
router.post('/resolve-stasis', async (req: Request, res: Response) => {
  try {
    const {
      stasisId,
      nodeId,
      faceSignature,
      fingerSignature,
      heartSignature,
      voiceSignature,
      laptopDeviceUUID,
      mobileDeviceUUID,
      pairBindingHash,
    } = req.body;

    if (
      !stasisId ||
      !nodeId ||
      !faceSignature ||
      !fingerSignature ||
      !heartSignature ||
      !voiceSignature ||
      !laptopDeviceUUID ||
      !mobileDeviceUUID ||
      !pairBindingHash
    ) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required for stasis resolution',
      });
    }

    const result = await resolveEmergencyStasis(
      stasisId,
      nodeId,
      faceSignature,
      fingerSignature,
      heartSignature,
      voiceSignature,
      laptopDeviceUUID,
      mobileDeviceUUID,
      pairBindingHash
    );

    if (result.success) {
      res.json({
        success: true,
        message: '✅ EMERGENCY STASIS RESOLVED. REVENUE FLOWS RESTORED.',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Stasis resolution failed',
        message: result.message,
      });
    }
  } catch (e) {
    const err = e as Error;
    console.error('[ROOT NODE] Stasis resolution failed:', err);
    res.status(500).json({
      success: false,
      error: 'Stasis resolution failed',
      details: err.message,
    });
  }
});

/**
 * GET /api/root-node/stasis-status
 * Get current Emergency Stasis status
 */
router.get('/stasis-status', async (req: Request, res: Response) => {
  try {
    const status = await getStasisStatus();

    res.json({
      success: true,
      status,
    });
  } catch (e) {
    const err = e as Error;
    console.error('[ROOT NODE] Failed to get stasis status:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get stasis status',
      details: err.message,
    });
  }
});

/**
 * GET /api/root-node/status
 * Get Alpha Node status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const result = await query<{
      node_id: string;
      status: string;
      revenue_oversight_enabled: boolean;
      sovereign_movement_validator_enabled: boolean;
      last_verification_timestamp: Date;
    }>(
      `SELECT node_id, status, revenue_oversight_enabled, sovereign_movement_validator_enabled, last_verification_timestamp
       FROM alpha_node_status
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        exists: false,
        message: 'No Root Node activated',
      });
    }

    const node = result.rows[0];

    res.json({
      success: true,
      exists: true,
      node: {
        nodeId: node.node_id,
        status: node.status,
        revenueOversightEnabled: node.revenue_oversight_enabled,
        sovereignMovementValidatorEnabled: node.sovereign_movement_validator_enabled,
        lastVerificationTimestamp: node.last_verification_timestamp,
      },
    });
  } catch (e) {
    const err = e as Error;
    console.error('[ROOT NODE] Failed to get status:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get Root Node status',
      details: err.message,
    });
  }
});

export default router;


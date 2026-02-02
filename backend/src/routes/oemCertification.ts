/**
 * PFF Backend — OEM Certification Routes
 * API endpoints for OEM hardware certification
 * Architect: Isreal Okoro (mrfundzman)
 */

import { Router, Request, Response } from 'express';
import { processHardwareCertification } from '../sentinel/oemCertification';
import { createDeviceBinding, detectPreInstallStatus, hasExistingActivation } from '../sentinel/deviceBinding';
import { query } from '../db/client';
import type { HardwareCertificationRequest } from '../../../core/oemCertification';

export const oemCertificationRouter = Router();

/**
 * POST /oem/certify
 * Submit OEM hardware certification request
 * Returns digital signature for 'Sentinel Certified' devices
 */
oemCertificationRouter.post(
  '/certify',
  async (req: Request, res: Response) => {
    try {
      const certificationRequest = req.body as HardwareCertificationRequest;
      
      if (!certificationRequest.oemInfo || !certificationRequest.sensorSpecs) {
        res.status(400).json({
          success: false,
          error: 'oemInfo and sensorSpecs are required',
        });
        return;
      }
      
      // Process certification request
      const certificationSignature = await processHardwareCertification(certificationRequest);
      
      res.status(200).json({
        success: true,
        certification: certificationSignature,
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * GET /oem/certification/:certificationId
 * Get certification details by ID
 */
oemCertificationRouter.get(
  '/certification/:certificationId',
  async (req: Request, res: Response) => {
    try {
      const { certificationId } = req.params;
      
      const result = await query<{
        certification_id: string;
        manufacturer: string;
        device_model: string;
        status: string;
        certification_level: string;
        signature: string;
        issued_at: Date;
        expires_at: Date;
        badge_url: string;
        watermark_text: string;
      }>(
        `SELECT certification_id, manufacturer, device_model, status, certification_level,
                signature, issued_at, expires_at, badge_url, watermark_text
         FROM oem_certifications
         WHERE certification_id = $1
         LIMIT 1`,
        [certificationId]
      );
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Certification not found',
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        certification: result.rows[0],
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * POST /oem/detect-preinstall
 * Detect if Sentinel is pre-installed on device
 */
oemCertificationRouter.post(
  '/detect-preinstall',
  async (req: Request, res: Response) => {
    try {
      const { deviceId, manufacturer, deviceModel, platformOS, platformVersion, architecture } = req.body;
      
      if (!deviceId || !manufacturer || !deviceModel || !platformOS || !platformVersion || !architecture) {
        res.status(400).json({
          success: false,
          error: 'deviceId, manufacturer, deviceModel, platformOS, platformVersion, and architecture are required',
        });
        return;
      }
      
      // Generate device UUID
      const crypto = await import('crypto');
      const deviceUUID = crypto
        .createHash('sha256')
        .update(`${deviceId}-${platformOS}-${platformVersion}-${architecture}`)
        .digest('hex');
      
      // Detect pre-install status
      const preInstallStatus = await detectPreInstallStatus(
        deviceUUID,
        manufacturer,
        deviceModel
      );
      
      // Check if device already has activation
      const hasActivation = await hasExistingActivation(deviceUUID);
      
      res.status(200).json({
        success: true,
        preInstallStatus,
        isPreInstalled: preInstallStatus === 'PRE_INSTALLED',
        hasExistingActivation: hasActivation,
        skipDownloadPhase: preInstallStatus === 'PRE_INSTALLED',
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/**
 * GET /oem/certifications
 * List all OEM certifications (paginated)
 */
oemCertificationRouter.get(
  '/certifications',
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const offset = (page - 1) * limit;
      
      const result = await query<{
        certification_id: string;
        manufacturer: string;
        device_model: string;
        status: string;
        certification_level: string;
        issued_at: Date;
        expires_at: Date;
      }>(
        `SELECT certification_id, manufacturer, device_model, status, certification_level,
                issued_at, expires_at
         FROM oem_certifications
         ORDER BY issued_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM oem_certifications`
      );
      
      const totalCount = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(totalCount / limit);
      
      res.status(200).json({
        success: true,
        certifications: result.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      });
    } catch (e) {
      const err = e as Error;
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);


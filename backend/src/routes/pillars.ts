/**
 * PFF Backend — Pillars routes (DOORKEEPER PROTOCOL)
 * /pillars/save-at-75 (save pillars at 75% completion)
 * /pillars/save-all (save complete 4-pillar data)
 */

import { Router, Request, Response } from 'express';
import { query } from '../db/client';

export const pillarsRouter = Router();

/**
 * POST /pillars/save-at-75 (DOORKEEPER PROTOCOL)
 * 
 * Save 4-pillar biometric data at 75% completion.
 * Frontend is FORBIDDEN from writing to database - it only forwards data here.
 * 
 * Body: {
 *   phoneNumber: string,
 *   pillarData: {
 *     face?: { hash: string, confidence: number },
 *     palm?: { hash: string, confidence: number },
 *     device?: { id: string, fingerprint: string },
 *     geolocation?: { latitude: number, longitude: number, accuracy: number }
 *   }
 * }
 */
pillarsRouter.post('/save-at-75', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, pillarData } = req.body;

    // 1. Validate input
    if (!phoneNumber || !pillarData) {
      res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'phoneNumber and pillarData required',
      });
      return;
    }

    // 2. Check if user exists
    const { rows: profileRows } = await query<{ phone_number: string }>(
      `SELECT phone_number FROM user_profiles WHERE phone_number = $1 LIMIT 1`,
      [phoneNumber]
    );

    if (profileRows.length === 0) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User profile not found',
      });
      return;
    }

    // 3. Calculate completion percentage
    const pillarsCompleted = [
      pillarData.face,
      pillarData.palm,
      pillarData.device,
      pillarData.geolocation,
    ].filter(Boolean).length;

    const completionPercentage = (pillarsCompleted / 4) * 100;

    // 4. Update user_profiles with pillar data
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (pillarData.face?.hash) {
      updateFields.push(`face_hash = $${paramIndex++}`);
      updateValues.push(pillarData.face.hash);
    }

    if (pillarData.palm?.hash) {
      updateFields.push(`palm_hash = $${paramIndex++}`);
      updateValues.push(pillarData.palm.hash);
    }

    if (pillarData.device?.id) {
      updateFields.push(`device_id = $${paramIndex++}`);
      updateValues.push(pillarData.device.id);
    }

    if (pillarData.geolocation) {
      updateFields.push(`geolocation = $${paramIndex++}`);
      updateValues.push(JSON.stringify(pillarData.geolocation));
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(phoneNumber);

    const updateQuery = `
      UPDATE user_profiles 
      SET ${updateFields.join(', ')}
      WHERE phone_number = $${paramIndex}
      RETURNING phone_number
    `;

    await query(updateQuery, updateValues);

    // 5. Return success response
    res.status(200).json({
      success: true,
      data: {
        phoneNumber,
        pillarsCompleted,
        completionPercentage,
        message: `${pillarsCompleted}/4 pillars saved (${completionPercentage}% complete)`,
      },
    });
  } catch (e) {
    const err = e as Error;
    console.error('[PILLARS/SAVE-AT-75 ERROR]', err);
    res.status(500).json({
      success: false,
      code: 'SAVE_FAILED',
      message: err.message || 'Failed to save pillar data',
    });
  }
});

/**
 * POST /pillars/save-all (DOORKEEPER PROTOCOL)
 * 
 * Save complete 4-pillar biometric data (100% completion).
 * Frontend is FORBIDDEN from writing to database - it only forwards data here.
 * 
 * Body: {
 *   phoneNumber: string,
 *   pillarData: {
 *     face: { hash: string, confidence: number },
 *     palm: { hash: string, confidence: number },
 *     device: { id: string, fingerprint: string },
 *     geolocation: { latitude: number, longitude: number, accuracy: number }
 *   }
 * }
 */
pillarsRouter.post('/save-all', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, pillarData } = req.body;

    // 1. Validate input
    if (!phoneNumber || !pillarData) {
      res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'phoneNumber and pillarData required',
      });
      return;
    }

    // 2. Validate all 4 pillars are present
    if (!pillarData.face || !pillarData.palm || !pillarData.device || !pillarData.geolocation) {
      res.status(400).json({
        success: false,
        code: 'INCOMPLETE_PILLARS',
        message: 'All 4 pillars (face, palm, device, geolocation) required',
      });
      return;
    }

    // 3. Check if user exists
    const { rows: profileRows } = await query<{ phone_number: string; vitalization_status: string }>(
      `SELECT phone_number, vitalization_status FROM user_profiles WHERE phone_number = $1 LIMIT 1`,
      [phoneNumber]
    );

    if (profileRows.length === 0) {
      res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User profile not found',
      });
      return;
    }

    // 4. Update user_profiles with complete pillar data
    const { rows: updatedRows } = await query<{ phone_number: string; vitalization_status: string }>(
      `UPDATE user_profiles
       SET face_hash = $1,
           palm_hash = $2,
           device_id = $3,
           geolocation = $4,
           humanity_score = 1.0,
           updated_at = NOW()
       WHERE phone_number = $5
       RETURNING phone_number, vitalization_status`,
      [
        pillarData.face.hash,
        pillarData.palm.hash,
        pillarData.device.id,
        JSON.stringify(pillarData.geolocation),
        phoneNumber,
      ]
    );

    // 5. Return success response
    res.status(200).json({
      success: true,
      data: {
        phoneNumber,
        pillarsCompleted: 4,
        completionPercentage: 100,
        vitalizationStatus: updatedRows[0].vitalization_status,
        message: 'All 4 pillars saved successfully (100% complete)',
        readyForVitalization: updatedRows[0].vitalization_status !== 'VITALIZED',
      },
    });
  } catch (e) {
    const err = e as Error;
    console.error('[PILLARS/SAVE-ALL ERROR]', err);
    res.status(500).json({
      success: false,
      code: 'SAVE_FAILED',
      message: err.message || 'Failed to save pillar data',
    });
  }
});


/**
 * PFF Backend — Guardian Anchor.
 * Child ID tethered to Parent PFF for sanctuary rights.
 */

import { Router, Request, Response } from 'express';
import { requirePresenceToken, type PffLocals } from '../middleware/pffAuth';
import { query } from '../db/client';

export const guardianRouter = Router();

function getPff(req: Request): PffLocals {
  const pff = (req as Request & { pff?: PffLocals }).pff;
  if (!pff) throw new Error('PFF auth required');
  return pff;
}

/** POST /guardian/tether — Tether child to parent PFF. Requires Presence Token. */
guardianRouter.post('/tether', requirePresenceToken, async (req: Request, res: Response) => {
  try {
    const { pffId } = getPff(req);
    const { childId, permissions, constraints } = req.body as {
      childId?: string;
      permissions?: string[];
      constraints?: { maxUsageCount?: number; expiresAt?: number; allowedActions?: string[] };
    };
    if (!childId) {
      res.status(400).json({ success: false, code: 'MISSING_CHILD_ID', message: 'childId required' });
      return;
    }
    await query(
      `INSERT INTO guardian_anchor (parent_pff_id, child_id, permissions, constraints, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (parent_pff_id, child_id) DO UPDATE SET
         permissions = EXCLUDED.permissions,
         constraints = EXCLUDED.constraints,
         updated_at = NOW()`,
      [
        pffId,
        childId,
        JSON.stringify(permissions ?? []),
        constraints ? JSON.stringify(constraints) : null,
      ]
    );
    res.status(201).json({ success: true, parentPffId: pffId, childId });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      code: 'TETHER_FAILED',
      message: err.message,
    });
  }
});

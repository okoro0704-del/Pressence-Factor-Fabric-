/**
 * PFF Backend — The Living Record vault.
 * AES-256 field-level encryption. Decrypt gated by real-time Presence Proof.
 */

import { Router, Request, Response } from 'express';
import { requirePresenceToken, type PffLocals } from '../middleware/pffAuth';
import {
  upsertEncrypted,
  decryptWithProof,
  logAccess,
} from '../vault/livingRecord';
import type { SignedPresenceProof } from '../types';

export const vaultRouter = Router();

function getPff(req: Request): PffLocals {
  const pff = (req as Request & { pff?: PffLocals }).pff;
  if (!pff) throw new Error('PFF auth required');
  return pff;
}

/** PUT /vault — Store encrypted medical/financial. Requires Presence Token. */
vaultRouter.put('/', requirePresenceToken, async (req: Request, res: Response) => {
  try {
    const { citizenId } = getPff(req);
    const { medical, financial } = req.body as {
      medical?: Record<string, unknown>;
      financial?: Record<string, unknown>;
    };
    await upsertEncrypted(citizenId, { medical, financial });
    res.status(200).json({ success: true });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({ success: false, code: 'VAULT_UPSERT_FAILED', message: err.message });
  }
});

/** POST /vault/decrypt — Decrypt with real-time Presence Proof (Heartbeat). No token. */
vaultRouter.post('/decrypt', async (req: Request, res: Response) => {
  try {
    const { signedProof } = req.body as { signedProof?: SignedPresenceProof };
    if (!signedProof?.payload || !signedProof?.signature) {
      res.status(400).json({
        success: false,
        code: 'MISSING_PROOF',
        message: 'signedProof required for decrypt',
      });
      return;
    }
    const out = await decryptWithProof(signedProof);
    if ('error' in out) {
      res.status(401).json({ success: false, code: 'DECRYPT_DENIED', message: out.error });
      return;
    }
    await logAccess(out.citizenId, 'decrypt_granted');
    res.status(200).json({
      success: true,
      medical: out.medical ?? {},
      financial: out.financial ?? {},
    });
  } catch (e) {
    const err = e as Error;
    res.status(500).json({ success: false, code: 'VAULT_DECRYPT_FAILED', message: err.message });
  }
});

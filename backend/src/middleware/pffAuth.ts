/**
 * PFF Backend — Require verified Presence Token.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyPresenceToken } from '../lib/jwt';

export interface PffLocals {
  citizenId: string;
  pffId: string;
}

export function requirePresenceToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({
      success: false,
      code: 'NO_TOKEN',
      message: 'Presence Token required',
    });
    return;
  }
  const payload = verifyPresenceToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired Presence Token',
    });
    return;
  }
  (req as Request & { pff?: PffLocals }).pff = {
    citizenId: payload.sub,
    pffId: payload.pffId,
  };
  next();
}

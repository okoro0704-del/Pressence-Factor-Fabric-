/**
 * PFF Backend — Presence Token (JWT).
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  sub: string;
  pffId: string;
  iat?: number;
  exp?: number;
}

export function signPresenceToken(payload: TokenPayload): string {
  return jwt.sign(
    { sub: payload.sub, pffId: payload.pffId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function verifyPresenceToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

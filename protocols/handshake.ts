/**
 * PFF Protocols — Digital Handshake.
 * Client: signed Presence Proof. Server: verify → issue Presence Token.
 * Target <1.5s. Offline-first: proof created on-device, verified when online.
 */

import type { SignedPresenceProof } from '../core/types';
import { PRESENCE_PROOF_REPLAY_MS, HANDSHAKE_TARGET_MS } from '../core/constants';

export interface HandshakeRequest {
  signedProof: SignedPresenceProof;
}

export interface HandshakeSuccess {
  success: true;
  presenceToken: string;
  expiresAt: number;
}

export interface HandshakeFailure {
  success: false;
  code: string;
  message: string;
}

export type HandshakeResult = HandshakeSuccess | HandshakeFailure;

/** Replay window (ms) for proof timestamp. */
export const REPLAY_WINDOW_MS = PRESENCE_PROOF_REPLAY_MS;

/** Target handshake latency (ms). */
export const TARGET_HANDSHAKE_MS = HANDSHAKE_TARGET_MS;

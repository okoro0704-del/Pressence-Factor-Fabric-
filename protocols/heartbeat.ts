/**
 * PFF Protocols — Heartbeat.
 * Real-time Presence Proof for sensitive actions (e.g. Living Record decrypt).
 * Backend enforces freshness window.
 */

import type { SignedPresenceProof } from '../core/types';

export interface HeartbeatRequest {
  signedProof: SignedPresenceProof;
  action: string;
}

export interface HeartbeatSuccess {
  success: true;
  granted: true;
}

export interface HeartbeatDenied {
  success: true;
  granted: false;
  reason: string;
}

export interface HeartbeatFailure {
  success: false;
  code: string;
  message: string;
}

export type HeartbeatResult = HeartbeatSuccess | HeartbeatDenied | HeartbeatFailure;

/** Max age (ms) of proof for heartbeat to be accepted. */
export { HEARTBEAT_FRESHNESS_MS } from '../core/constants';

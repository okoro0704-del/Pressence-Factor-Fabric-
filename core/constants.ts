/**
 * PFF Core — Protocol constants.
 */

/** Replay window for Presence Proof timestamp (ms). */
export const PRESENCE_PROOF_REPLAY_MS = 30_000;

/** Target Digital Handshake completion (ms). Lagos-tested. */
export const HANDSHAKE_TARGET_MS = 1_500;

/** Heartbeat freshness window for Living Record decrypt (ms). */
export const HEARTBEAT_FRESHNESS_MS = 60_000;

export const PFF_SIGNING_KEY_ALIAS = 'pff_presence_signing_key';

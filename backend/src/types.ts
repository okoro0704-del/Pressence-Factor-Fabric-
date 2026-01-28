/**
 * PFF Backend — Types (mirrors core where needed).
 */

export interface PresenceProofPayload {
  nonce: string;
  timestamp: number;
  keyId: string;
  deviceId: string;
  attestationCertChain?: string;
  livenessOk?: boolean;
  livenessScore?: number;
}

export interface SignedPresenceProof {
  payload: PresenceProofPayload;
  signature: string;
}

export interface VitalizeVerifyRequest {
  signedProof: SignedPresenceProof;
}

/**
 * PFF Guardian — Sub-identity tethering (Guardian Anchor).
 * Primary signs tether; sub-identity has no separate keys.
 */

export interface GuardianTetherPayload {
  primaryPffId: string;
  subIdentityId: string;
  permissions: SubIdentityPermission[];
  constraints?: TetherConstraints;
  createdAt: number;
}

export type SubIdentityPermission =
  | 'read_vault'
  | 'request_decrypt'
  | 'manage_consent'
  | 'revoke';

export interface TetherConstraints {
  maxUsageCount?: number;
  expiresAt?: number;
  allowedActions?: string[];
}

export interface SignedGuardianTether {
  payload: GuardianTetherPayload;
  signature: string;
}

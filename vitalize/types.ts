/**
 * PFF Vitalize — Vitalization flow contract.
 */

export interface LegalIdentityForm {
  fullName: string;
  idType: string;
  idNumber: string;
}

export interface VitalizationKeyResult {
  publicKey: string;
  keyId: string;
  biometryType: 'TouchID' | 'FaceID' | 'Biometrics';
}

export interface VitalizationResult {
  legalIdentity: LegalIdentityForm;
  keyResult: VitalizationKeyResult;
  deviceId: string;
}

export type VitalizationStep = 'welcome' | 'legal' | 'device' | 'complete';

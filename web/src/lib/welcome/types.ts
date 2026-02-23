/**
 * @file Sovereign Welcome Flow Types
 * @description Type definitions for the welcome onboarding flow
 */

export type WelcomeStep = "genesis" | "guardian" | "vitalize";

export interface BiometricCaptureResult {
  imageData: string; // Base64 encoded image
  timestamp: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
  };
}

export interface SBTMintResult {
  success: boolean;
  tokenId?: string;
  transactionHash?: string;
  error?: string;
}

export interface SentinelLinkResult {
  success: boolean;
  sentinelId?: string;
  deviceId?: string;
  error?: string;
}

export interface VIDADistributionResult {
  success: boolean;
  amount?: string;
  transactionHash?: string;
  error?: string;
}

export interface WelcomeFlowState {
  currentStep: WelcomeStep;
  completedSteps: WelcomeStep[];
  biometricCaptured: boolean;
  sbtMinted: boolean;
  sentinelLinked: boolean;
  vidaDistributed: boolean;
  sovereignId?: string;
}


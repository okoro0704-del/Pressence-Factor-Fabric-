/**
 * @file Guardian Types
 * @description Type definitions for Guardian Integrations
 */

export type SentinelSensitivity = "standard" | "high_alert" | "maximum";

export interface LinkedIntegration {
  id: string;
  serviceId: string;
  serviceName: string;
  maskedAccount: string;
  linkedAt: number;
  sentinelActive: boolean;
  panicMode: boolean;
  sensitivity: SentinelSensitivity;
  lastChecked?: number;
  status: "active" | "error" | "paused";
}

export interface GuardianSettings {
  defaultSensitivity: SentinelSensitivity;
  autoEnableSentinel: boolean;
  notifyOnSuspiciousActivity: boolean;
  panicModeTimeout: number; // minutes
}

export const SENSITIVITY_LEVELS: Record<
  SentinelSensitivity,
  {
    label: string;
    description: string;
    color: string;
  }
> = {
  standard: {
    label: "Standard",
    description: "Normal monitoring - alerts on obvious threats",
    color: "#10b981",
  },
  high_alert: {
    label: "High Alert",
    description: "Increased sensitivity - alerts on suspicious patterns",
    color: "#f59e0b",
  },
  maximum: {
    label: "Maximum",
    description: "Maximum protection - alerts on any unusual activity",
    color: "#ef4444",
  },
};


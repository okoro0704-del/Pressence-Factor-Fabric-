/**
 * @file Sovereign Welcome API Integration
 * @description API utilities for welcome flow operations
 */

import {
  BiometricCaptureResult,
  SBTMintResult,
  SentinelLinkResult,
  VIDADistributionResult,
} from "./types";

/**
 * Mint PFF Verified SBT for new sovereign
 */
export async function mintSovereignSBT(
  sovereignId: string,
  biometricData: BiometricCaptureResult
): Promise<SBTMintResult> {
  try {
    const response = await fetch("/api/identity/mint-sbt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sovereignId,
        biometricData,
      }),
    });

    if (!response.ok) {
      throw new Error(`SBT minting failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      tokenId: data.tokenId,
      transactionHash: data.transactionHash,
    };
  } catch (error: any) {
    console.error("[SBT MINT ERROR]", error);
    return {
      success: false,
      error: error.message || "Failed to mint SBT",
    };
  }
}

/**
 * Link device to Sentinel Cloud-Proxy
 */
export async function linkSentinelProxy(
  sovereignId: string,
  oauthProvider: "google" | "apple",
  oauthToken: string
): Promise<SentinelLinkResult> {
  try {
    const response = await fetch("/api/sentinel/link-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sovereignId,
        oauthProvider,
        oauthToken,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: Date.now(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Sentinel linking failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      sentinelId: data.sentinelId,
      deviceId: data.deviceId,
    };
  } catch (error: any) {
    console.error("[SENTINEL LINK ERROR]", error);
    return {
      success: false,
      error: error.message || "Failed to link Sentinel",
    };
  }
}

/**
 * Distribute VIDA tokens from Treasury (gasless)
 */
export async function distributeVIDA(
  sovereignId: string
): Promise<VIDADistributionResult> {
  try {
    const response = await fetch("/api/treasury/distribute-vida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sovereignId,
        gasless: true, // Treasury pays gas
      }),
    });

    if (!response.ok) {
      throw new Error(`VIDA distribution failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      amount: data.amount,
      transactionHash: data.transactionHash,
    };
  } catch (error: any) {
    console.error("[VIDA DISTRIBUTION ERROR]", error);
    return {
      success: false,
      error: error.message || "Failed to distribute VIDA",
    };
  }
}

/**
 * Capture biometric data from camera
 */
export async function captureBiometric(
  videoElement: HTMLVideoElement
): Promise<BiometricCaptureResult> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      ctx.drawImage(videoElement, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      resolve({
        imageData,
        timestamp: Date.now(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}


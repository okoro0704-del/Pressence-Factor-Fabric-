/**
 * PFF Sentinel API Client
 * 
 * THE DOORKEEPER PROTOCOL:
 * This is the ONLY authorized way for the frontend to communicate with the Sentinel.
 * 
 * RULES:
 * 1. Frontend NEVER executes business logic
 * 2. Frontend NEVER calculates token splits
 * 3. Frontend NEVER writes to database directly
 * 4. Frontend ONLY collects data and forwards to Sentinel
 * 5. Frontend ONLY renders Sentinel responses
 * 
 * The Sentinel is the SINGLE SOURCE OF TRUTH for all vitalization logic.
 */

// Sentinel Backend URL (from environment)
const SENTINEL_URL = 
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PFF_BACKEND_URL?.trim()) ||
  (typeof process !== 'undefined' && process.env.PFF_BACKEND_URL?.trim()) ||
  '';

/**
 * Four-Pillar Biometric Data
 * Collected by frontend, sent to Sentinel for validation
 */
export interface FourPillarData {
  faceHash: string;
  palmHash?: string;
  deviceId: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

/**
 * Vitalization Request
 * Frontend collects this data and forwards to Sentinel
 */
export interface VitalizationRequest {
  phoneNumber: string;
  sovereignId: string;
  biometricData: FourPillarData;
  walletAddress?: string;
}

/**
 * Sentinel Response
 * Frontend ONLY renders this - does NOT interpret or modify
 */
export interface SentinelResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Vitalization Result (from Sentinel)
 * Frontend displays this exactly as received
 */
export interface VitalizationResult {
  vitalizationStatus: 'VITALIZED' | 'PENDING' | 'FAILED';
  vitalizedAt?: string;
  vidaDistribution?: {
    citizen: number;
    treasury: number;
    foundation: number;
    total: number;
  };
  transactionHash?: string;
  pffId?: string;
}

/**
 * Sentinel API Client
 * All methods are STATELESS - they only forward data and return responses
 */
export class SentinelClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || SENTINEL_URL;
    
    if (!this.baseUrl) {
      console.warn('[SENTINEL CLIENT] No backend URL configured. Set NEXT_PUBLIC_PFF_BACKEND_URL in environment.');
    }
  }

  /**
   * Check if Sentinel is configured
   */
  isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  /**
   * Execute Vitalization
   * 
   * THE DOORKEEPER PROTOCOL:
   * - Frontend collects biometric data
   * - Frontend forwards to Sentinel
   * - Sentinel validates, executes 5-5-1 split, updates database
   * - Frontend receives response and renders result
   * 
   * Frontend does NOT:
   * - Calculate VIDA splits
   * - Update database
   * - Execute blockchain transactions
   * - Validate biometric data
   */
  async executeVitalization(request: VitalizationRequest): Promise<SentinelResponse<VitalizationResult>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Sentinel backend not configured. Cannot execute vitalization.',
        code: 'SENTINEL_NOT_CONFIGURED',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/vitalize/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: request.phoneNumber,
          sovereignId: request.sovereignId,
          biometricData: request.biometricData,
          walletAddress: request.walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Sentinel returned ${response.status}`,
          code: errorData.code || 'SENTINEL_ERROR',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Sentinel',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Get Vitalization Status
   * Frontend ONLY reads - does NOT modify
   */
  async getVitalizationStatus(phoneNumber: string): Promise<SentinelResponse<any>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Sentinel backend not configured',
        code: 'SENTINEL_NOT_CONFIGURED',
      };
    }

    // Implementation will be added when backend endpoint is ready
    return {
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED',
    };
  }

  /**
   * Save Pillars at 75% Completion
   *
   * THE DOORKEEPER PROTOCOL:
   * - Frontend collects partial pillar data (3 out of 4 pillars)
   * - Frontend forwards to Sentinel
   * - Sentinel validates and saves to database
   * - Frontend receives response and renders result
   */
  async savePillarsAt75(request: {
    phoneNumber: string;
    pillarData: {
      face?: { hash: string; confidence: number };
      palm?: { hash: string; confidence: number };
      device?: { id: string; fingerprint: string };
      geolocation?: { latitude: number; longitude: number; accuracy: number };
    };
  }): Promise<SentinelResponse<any>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Sentinel backend not configured',
        code: 'SENTINEL_NOT_CONFIGURED',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/pillars/save-at-75`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Sentinel returned ${response.status}`,
          code: errorData.code || 'SENTINEL_ERROR',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Sentinel',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Save All Pillars (100% Completion)
   *
   * THE DOORKEEPER PROTOCOL:
   * - Frontend collects complete pillar data (all 4 pillars)
   * - Frontend forwards to Sentinel
   * - Sentinel validates and saves to database
   * - Frontend receives response and renders result
   */
  async savePillarsAll(request: {
    phoneNumber: string;
    pillarData: {
      face: { hash: string; confidence: number };
      palm: { hash: string; confidence: number };
      device: { id: string; fingerprint: string };
      geolocation: { latitude: number; longitude: number; accuracy: number };
    };
  }): Promise<SentinelResponse<any>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Sentinel backend not configured',
        code: 'SENTINEL_NOT_CONFIGURED',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/pillars/save-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Sentinel returned ${response.status}`,
          code: errorData.code || 'SENTINEL_ERROR',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Sentinel',
        code: 'NETWORK_ERROR',
      };
    }
  }
}

// Singleton instance
export const sentinelClient = new SentinelClient();


/**
 * PFF Express API client — canonical HTTP layer for NEXT_PUBLIC_PFF_BACKEND_URL.
 * Structured domain errors: { error, code, message }
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = 'http://localhost:3001';

export function getSentinelBaseUrl(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PFF_BACKEND_URL?.trim()) ||
    (typeof process !== 'undefined' && process.env.PFF_BACKEND_URL?.trim()) ||
    '';
  return (fromEnv || DEFAULT_BASE_URL).replace(/\/$/, '');
}

// ---------------------------------------------------------------------------
// Error model
// ---------------------------------------------------------------------------

export interface SentinelDomainErrorBody {
  error: string;
  code: string;
  message: string;
}

export class SentinelApiError extends Error {
  readonly error: string;
  readonly code: string;

  constructor(body: SentinelDomainErrorBody, httpStatus?: number) {
    const msg = body.message || body.error || 'Request failed';
    super(msg);
    this.name = 'SentinelApiError';
    this.error = body.error || msg;
    this.code = body.code || (httpStatus === 409 ? 'CONFLICT' : 'SENTINEL_ERROR');
    this.message = msg;
  }

  static isConflict(err: unknown): boolean {
    return err instanceof SentinelApiError && err.code === 'CONFLICT';
  }
}

// ---------------------------------------------------------------------------
// Identity union types (Express contract)
// ---------------------------------------------------------------------------

export interface LegalProfile {
  fullName?: string;
  phoneNumber?: string;
  bvnMasked?: string;
  [key: string]: unknown;
}

export interface RegisterGenesisRequest {
  bvn: string;
  phoneNumber: string;
}

export interface RegisterGenesisResponse {
  sessionId: string;
  legalProfile: LegalProfile;
  nextStep: string;
}

export interface StageUnionRequest {
  genesisSessionId: string;
  biometricMathematicalFeatures: string;
  deviceRawIdentifier: string;
}

export interface StageUnionResponse {
  registrationChallenge: string;
}

export interface SealUnionRequest {
  phoneNumber: string;
  sessionId: string;
  credentialId: string;
  hardwarePublicKey: string;
  attestationObject: string;
  clientDataJSON: string;
}

export interface SealUnionResponse {
  citizenId: string;
  unionSealedAt: string;
}

// ---------------------------------------------------------------------------
// Legacy vitalization types (backward compatible)
// ---------------------------------------------------------------------------

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

export interface VitalizationRequest {
  phoneNumber: string;
  sovereignId: string;
  biometricData: FourPillarData;
  walletAddress?: string;
}

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

export interface SentinelResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SentinelRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** Expected success status (default 200). Use 201 for seal-union. */
  successStatus?: number;
  traceLabel?: string;
}

function parseDomainErrorBody(raw: unknown): SentinelDomainErrorBody {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    return {
      error: typeof o.error === 'string' ? o.error : '',
      code: typeof o.code === 'string' ? o.code : '',
      message: typeof o.message === 'string' ? o.message : '',
    };
  }
  return { error: '', code: '', message: '' };
}

/**
 * Native fetch to Express with structured error handling.
 * Logs explicit trace on failure and re-throws SentinelApiError.
 */
export async function sentinelRequest<T>(
  path: string,
  options: SentinelRequestOptions = {}
): Promise<T> {
  const baseUrl = getSentinelBaseUrl();
  const method = options.method ?? 'POST';
  const successStatus = options.successStatus ?? 200;
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const trace = options.traceLabel ?? `${method} ${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (networkErr) {
    const message = networkErr instanceof Error ? networkErr.message : String(networkErr);
    console.error(`[SENTINEL TRACE] ${trace} — network failure`, { url, message });
    throw new SentinelApiError({
      error: 'NETWORK_ERROR',
      code: 'NETWORK_ERROR',
      message: message || 'Failed to reach PFF Express backend',
    });
  }

  const text = await response.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = { message: text };
    }
  }

  if (response.status !== successStatus) {
    const domain = parseDomainErrorBody(parsed);
    if (!domain.message && !domain.error) {
      domain.message = `HTTP ${response.status}`;
      domain.error = domain.message;
    }
    if (!domain.code) {
      domain.code = response.status === 409 ? 'CONFLICT' : `HTTP_${response.status}`;
    }
    console.error(`[SENTINEL TRACE] ${trace} — non-2xx`, {
      status: response.status,
      expected: successStatus,
      body: parsed,
    });
    throw new SentinelApiError(domain, response.status);
  }

  return parsed as T;
}

// ---------------------------------------------------------------------------
// Identity union API (3-phase immutable pipeline)
// ---------------------------------------------------------------------------

export async function registerGenesis(
  payload: RegisterGenesisRequest
): Promise<RegisterGenesisResponse> {
  return sentinelRequest<RegisterGenesisResponse>('/api/v1/identity/register-genesis', {
    body: payload,
    traceLabel: 'register-genesis',
  });
}

export async function stageUnion(payload: StageUnionRequest): Promise<StageUnionResponse> {
  return sentinelRequest<StageUnionResponse>('/api/v1/identity/stage-union', {
    body: payload,
    traceLabel: 'stage-union',
  });
}

export async function sealUnion(payload: SealUnionRequest): Promise<SealUnionResponse> {
  return sentinelRequest<SealUnionResponse>('/api/v1/identity/seal-union', {
    body: payload,
    successStatus: 201,
    traceLabel: 'seal-union',
  });
}

// ---------------------------------------------------------------------------
// SentinelClient class (legacy callers)
// ---------------------------------------------------------------------------

export class SentinelClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || getSentinelBaseUrl()).replace(/\/$/, '');
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }

  async executeVitalization(
    request: VitalizationRequest
  ): Promise<SentinelResponse<VitalizationResult>> {
    try {
      const data = await sentinelRequest<VitalizationResult>('/vitalize/register', {
        body: {
          phoneNumber: request.phoneNumber,
          sovereignId: request.sovereignId,
          biometricData: request.biometricData,
          walletAddress: request.walletAddress,
        },
        traceLabel: 'executeVitalization',
      });
      return { success: true, data };
    } catch (e) {
      if (e instanceof SentinelApiError) {
        return { success: false, error: e.message, code: e.code };
      }
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
        code: 'NETWORK_ERROR',
      };
    }
  }

  async getVitalizationStatus(_phoneNumber: string): Promise<SentinelResponse<unknown>> {
    return { success: false, error: 'Not implemented yet', code: 'NOT_IMPLEMENTED' };
  }

  async savePillarsAt75(request: {
    phoneNumber: string;
    pillarData: Record<string, unknown>;
  }): Promise<SentinelResponse<unknown>> {
    try {
      const data = await sentinelRequest<unknown>('/pillars/save-at-75', {
        body: request,
        traceLabel: 'savePillarsAt-75',
      });
      return { success: true, data };
    } catch (e) {
      if (e instanceof SentinelApiError) {
        return { success: false, error: e.message, code: e.code };
      }
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error', code: 'NETWORK_ERROR' };
    }
  }

  async savePillarsAll(request: {
    phoneNumber: string;
    pillarData: Record<string, unknown>;
  }): Promise<SentinelResponse<unknown>> {
    try {
      const data = await sentinelRequest<unknown>('/pillars/save-all', {
        body: request,
        traceLabel: 'savePillarsAll',
      });
      return { success: true, data };
    } catch (e) {
      if (e instanceof SentinelApiError) {
        return { success: false, error: e.message, code: e.code };
      }
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error', code: 'NETWORK_ERROR' };
    }
  }
}

export const sentinelClient = new SentinelClient();

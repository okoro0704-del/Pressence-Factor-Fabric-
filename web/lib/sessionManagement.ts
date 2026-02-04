// web/lib/sessionManagement.ts

export enum SessionStatus {
  NO_SESSION = 'NO_SESSION',
  INITIALIZING = 'INITIALIZING',
  LAYER_1 = 'LAYER_1',
  LAYER_2 = 'LAYER_2',
  LAYER_3 = 'LAYER_3',
  LAYER_4 = 'LAYER_4',
  LAYER_2_PENDING = 'LAYER_2_PENDING',
  LAYER_3_PENDING = 'LAYER_3_PENDING',
  LAYER_4_PENDING = 'LAYER_4_PENDING',
  LAYER_1_VERIFIED = 'LAYER_1_VERIFIED',
  LAYER_2_VERIFIED = 'LAYER_2_VERIFIED',
  LAYER_3_VERIFIED = 'LAYER_3_VERIFIED',
  ALL_LAYERS_VERIFIED = 'ALL_LAYERS_VERIFIED',
  AUTHENTICATED = 'AUTHENTICATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  BREACH_DETECTED = 'BREACH_DETECTED',
}

/** Session metadata for Supabase / audit (e.g. user's selected language) */
export interface SessionMetadata {
  language?: string;
  [key: string]: unknown;
}

let currentStatus: SessionStatus = SessionStatus.NO_SESSION;
let passedLayers: number[] = [];
let currentSessionLanguage: string | null = null;
let sessionMetadata: SessionMetadata = {};

export const getSessionStatus = () => {
  return currentStatus;
};

export const initializeZeroPersistenceSession = () => {
  currentStatus = SessionStatus.NO_SESSION;
  passedLayers = [];
  sessionMetadata = {};
  currentSessionLanguage = null;
  console.log("Vault Session Initialized: Memory Wiped.");
};

/** Store selected language in session (called when user confirms language before Identity Anchor). */
export function setSessionLanguage(languageCode: string): void {
  currentSessionLanguage = languageCode;
  sessionMetadata = { ...sessionMetadata, language: languageCode };
}

/** Get current session language (ISO 639-1). */
export function getSessionLanguage(): string | null {
  return currentSessionLanguage;
}

/** Get session metadata for Supabase / audit (includes language). Use when inserting presence_handshakes or session records. */
export function getSessionMetadata(): SessionMetadata {
  return { ...sessionMetadata };
}

export const markLayerPassed = async (layerNumber: number) => {
  if (!passedLayers.includes(layerNumber)) {
    passedLayers.push(layerNumber);
  }
  
  // SOVEREIGN QUORUM: 3 out of 4 layers = Total Success
  if (passedLayers.length >= 3) {
    currentStatus = SessionStatus.ALL_LAYERS_VERIFIED;
  } else if (passedLayers.length === 1) {
    currentStatus = SessionStatus.LAYER_1_VERIFIED;
  } else if (passedLayers.length === 2) {
    currentStatus = SessionStatus.LAYER_2_VERIFIED;
  }
  
  console.log(`Layer ${layerNumber} Secured. Total Layers: ${passedLayers.length}/4`);
};

export const resetSessionToLayer1 = () => {
  passedLayers = [];
  currentStatus = SessionStatus.LAYER_1;
  console.log("Protocol Reset: Returning to Anchor Handshake.");
};

/** Create session; optional metadata (e.g. language) is stored for Supabase record. */
export const createSession = async (identity: any, metadata?: SessionMetadata) => {
  initializeZeroPersistenceSession();
  if (metadata?.language) {
    currentSessionLanguage = metadata.language;
    sessionMetadata = { ...sessionMetadata, ...metadata };
  } else if (currentSessionLanguage) {
    sessionMetadata = { ...sessionMetadata, language: currentSessionLanguage };
  }
};

export const validateSession = async () => currentStatus === SessionStatus.ALL_LAYERS_VERIFIED;
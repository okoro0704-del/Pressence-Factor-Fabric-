/**
 * PFF Core — Sequential Handshake Protocol (The Unbending Gate)
 * Section CLVII: Sequential Integrity
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * The 4-Phase Sequential Handshake:
 * Phase 1: Visual Liveness (Face) — 127-point geometric mesh + blood flow micro-fluctuations
 * Phase 2: Tactile Identity (Finger) — Fingerprint match against Sovereign Template
 * Phase 3: Vital Pulse (Heart & Voice) — Spectral resonance + heartbeat frequency
 * Phase 4: Cohesion Verification — All phases must complete within 1,500ms
 * 
 * The Fail-Safe: Sequential execution prevents hardware choking on multiple data streams
 * The Speed of Trust: 1.5s is fast enough to feel like magic, slow enough for VLT verification
 * The Anti-Fraud Wall: Hardcoded sequence prevents layer bypass; all four required in exact order
 */

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

/** The 1.5s Cohesion Rule: Maximum time for all phases to complete */
export const COHESION_TIMEOUT_MS = 1500;

/** Individual phase timeouts (must sum to less than COHESION_TIMEOUT_MS) */
export const PHASE_TIMEOUTS = {
  VISUAL_LIVENESS: 600,    // Phase 1: Face scan (127-point mesh)
  TACTILE_IDENTITY: 400,   // Phase 2: Fingerprint match
  VITAL_PULSE: 400,        // Phase 3: Heart + Voice capture
  BUFFER_MARGIN: 100,      // Safety margin for processing
} as const;

// ============================================================================
// PHASE DEFINITIONS
// ============================================================================

export type HandshakePhase = 
  | 'IDLE'
  | 'PHASE_1_VISUAL_LIVENESS'
  | 'PHASE_2_TACTILE_IDENTITY'
  | 'PHASE_3_VITAL_PULSE'
  | 'PHASE_4_COHESION_VERIFY'
  | 'SUCCESS'
  | 'FAILED';

export type PhaseStatus = 'pending' | 'active' | 'complete' | 'failed';

export interface PhaseResult {
  phase: HandshakePhase;
  status: PhaseStatus;
  timestamp: number;
  duration: number;
  data?: unknown;
  error?: HandshakeError;
}

// ============================================================================
// LIVENESS DETECTION (Phase 1)
// ============================================================================

export interface VisualLivenessData {
  meshPoints: number;           // Should be 127
  bloodFlowDetected: boolean;   // Micro-fluctuation detection
  livenessScore: number;        // 0.0 - 1.0
  faceGeometry: FaceGeometry;
}

export interface FaceGeometry {
  landmarks: number[][];        // 127-point geometric mesh
  boundingBox: BoundingBox;
  orientation: FaceOrientation;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceOrientation {
  pitch: number;  // Head tilt up/down
  yaw: number;    // Head turn left/right
  roll: number;   // Head tilt side-to-side
}

// ============================================================================
// FINGERPRINT MATCHING (Phase 2)
// ============================================================================

export interface TactileIdentityData {
  fingerprintMatched: boolean;
  matchConfidence: number;      // 0.0 - 1.0
  templateId: string;           // Sovereign Template ID
  sensorType: 'optical' | 'capacitive' | 'ultrasonic';
}

// ============================================================================
// VITAL PULSE (Phase 3)
// ============================================================================

export interface VitalPulseData {
  heartbeatFrequency: number;   // BPM
  voiceSpectralHash: string;    // Spectral resonance signature
  pulseDetected: boolean;
  voiceDetected: boolean;
}

// ============================================================================
// SEQUENTIAL HANDSHAKE STATE
// ============================================================================

export interface SequentialHandshakeState {
  sessionId: string;
  startTime: number;
  currentPhase: HandshakePhase;
  phases: {
    phase1: PhaseResult | null;
    phase2: PhaseResult | null;
    phase3: PhaseResult | null;
  };
  totalDuration: number;
  cohesionPassed: boolean;
  sovereignAuthSignal: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type HandshakeErrorCode =
  | 'COHESION_TIMEOUT'           // Failed to complete within 1.5s
  | 'PHASE_1_FAILED'             // Visual liveness failed
  | 'PHASE_2_FAILED'             // Fingerprint match failed
  | 'PHASE_3_FAILED'             // Vital pulse failed
  | 'LIVENESS_NOT_DETECTED'      // No blood flow micro-fluctuations
  | 'FACE_NOT_DETECTED'          // No face found
  | 'FINGERPRINT_MISMATCH'       // Fingerprint doesn't match template
  | 'SENSOR_HARDWARE_ERROR'      // Hardware sensor failure
  | 'CAMERA_PERMISSION_DENIED'   // Camera access denied
  | 'FINGERPRINT_SENSOR_UNAVAILABLE' // Fingerprint sensor not available
  | 'VOICE_CAPTURE_FAILED'       // Voice capture failed
  | 'HEARTBEAT_NOT_DETECTED'     // Heartbeat not detected
  | 'SEQUENCE_INTERRUPTED'       // User interrupted the sequence
  | 'BUFFER_FLUSH_REQUIRED';     // Buffer must be flushed and reset

export interface HandshakeError {
  code: HandshakeErrorCode;
  message: string;
  phase: HandshakePhase;
  timestamp: number;
  hardwareError?: boolean;       // true = driver issue, false = fraud attempt
  sensorDetails?: string;        // Specific hardware error details
}

// ============================================================================
// HANDSHAKE RESULT
// ============================================================================

export interface SequentialHandshakeResult {
  success: boolean;
  sessionId: string;
  totalDuration: number;
  phases: {
    phase1: PhaseResult | null;
    phase2: PhaseResult | null;
    phase3: PhaseResult | null;
  };
  sovereignAuthSignal: boolean;  // Only true if all phases passed within 1.5s
  error?: HandshakeError;
  vltErrorLogId?: string;        // Reference to VLT_ERROR_LOG entry
}


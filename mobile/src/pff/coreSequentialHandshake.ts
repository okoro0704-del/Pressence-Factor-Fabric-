/**
 * PFF Core — Sequential Handshake Protocol (The Unbending Gate)
 * Local copy for mobile bundle (EAS has no access to monorepo core/).
 */

export const COHESION_TIMEOUT_MS = 1500;
export const PHASE_TIMEOUTS = {
  VISUAL_LIVENESS: 600,
  TACTILE_IDENTITY: 400,
  VITAL_PULSE: 400,
  BUFFER_MARGIN: 100,
} as const;

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

export interface VisualLivenessData {
  meshPoints: number;
  bloodFlowDetected: boolean;
  livenessScore: number;
  faceGeometry: FaceGeometry;
}

export interface FaceGeometry {
  landmarks: number[][];
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
  pitch: number;
  yaw: number;
  roll: number;
}

export interface TactileIdentityData {
  fingerprintMatched: boolean;
  matchConfidence: number;
  templateId: string;
  sensorType: 'optical' | 'capacitive' | 'ultrasonic' | 'none';
}

export interface VitalPulseData {
  heartbeatFrequency: number;
  voiceSpectralHash: string;
  pulseDetected: boolean;
  voiceDetected: boolean;
}

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

export type HandshakeErrorCode =
  | 'COHESION_TIMEOUT'
  | 'PHASE_1_FAILED'
  | 'PHASE_2_FAILED'
  | 'PHASE_3_FAILED'
  | 'LIVENESS_NOT_DETECTED'
  | 'FACE_NOT_DETECTED'
  | 'FINGERPRINT_MISMATCH'
  | 'SENSOR_HARDWARE_ERROR'
  | 'CAMERA_PERMISSION_DENIED'
  | 'FINGERPRINT_SENSOR_UNAVAILABLE'
  | 'VOICE_CAPTURE_FAILED'
  | 'HEARTBEAT_NOT_DETECTED'
  | 'SEQUENCE_INTERRUPTED'
  | 'BUFFER_FLUSH_REQUIRED';

export interface HandshakeError {
  code: HandshakeErrorCode;
  message: string;
  phase: HandshakePhase;
  timestamp: number;
  hardwareError?: boolean;
  sensorDetails?: string;
}

export interface SequentialHandshakeResult {
  success: boolean;
  sessionId: string;
  totalDuration: number;
  phases: {
    phase1: PhaseResult | null;
    phase2: PhaseResult | null;
    phase3: PhaseResult | null;
  };
  sovereignAuthSignal: boolean;
  error?: HandshakeError;
  vltErrorLogId?: string;
}

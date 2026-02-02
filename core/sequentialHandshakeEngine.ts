/**
 * PFF Core — Sequential Handshake Engine
 * The Unbending Gate: 4-Phase Sequential Authentication with 1.5s Cohesion Rule
 * Architect: Isreal Okoro (mrfundzman)
 */

import {
  COHESION_TIMEOUT_MS,
  PHASE_TIMEOUTS,
  type HandshakePhase,
  type PhaseStatus,
  type PhaseResult,
  type SequentialHandshakeState,
  type SequentialHandshakeResult,
  type HandshakeError,
  type VisualLivenessData,
  type TactileIdentityData,
  type VitalPulseData,
} from './sequentialHandshake';

/**
 * Generate unique session ID for handshake tracking
 */
export function generateSessionId(): string {
  return `HS-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Initialize sequential handshake state
 */
export function initializeHandshakeState(): SequentialHandshakeState {
  return {
    sessionId: generateSessionId(),
    startTime: Date.now(),
    currentPhase: 'IDLE',
    phases: {
      phase1: null,
      phase2: null,
      phase3: null,
    },
    totalDuration: 0,
    cohesionPassed: false,
    sovereignAuthSignal: false,
  };
}

/**
 * Check if cohesion timeout has been exceeded
 */
export function checkCohesionTimeout(startTime: number): boolean {
  const elapsed = Date.now() - startTime;
  return elapsed > COHESION_TIMEOUT_MS;
}

/**
 * Validate Phase 1: Visual Liveness (Face)
 * - 127-point geometric mesh scan
 * - Blood flow micro-fluctuation detection
 */
export function validateVisualLiveness(data: VisualLivenessData): PhaseResult {
  const startTime = Date.now();
  
  // Validate 127-point mesh
  if (data.meshPoints !== 127) {
    return {
      phase: 'PHASE_1_VISUAL_LIVENESS',
      status: 'failed',
      timestamp: startTime,
      duration: Date.now() - startTime,
      error: {
        code: 'FACE_NOT_DETECTED',
        message: `Invalid mesh points: expected 127, got ${data.meshPoints}`,
        phase: 'PHASE_1_VISUAL_LIVENESS',
        timestamp: Date.now(),
        hardwareError: false,
      },
    };
  }
  
  // Validate blood flow detection (liveness)
  if (!data.bloodFlowDetected || data.livenessScore < 0.99) {
    return {
      phase: 'PHASE_1_VISUAL_LIVENESS',
      status: 'failed',
      timestamp: startTime,
      duration: Date.now() - startTime,
      error: {
        code: 'LIVENESS_NOT_DETECTED',
        message: `Liveness score too low: ${data.livenessScore.toFixed(3)} (required: 0.99)`,
        phase: 'PHASE_1_VISUAL_LIVENESS',
        timestamp: Date.now(),
        hardwareError: false, // Likely fraud attempt
      },
    };
  }
  
  return {
    phase: 'PHASE_1_VISUAL_LIVENESS',
    status: 'complete',
    timestamp: startTime,
    duration: Date.now() - startTime,
    data,
  };
}

/**
 * Validate Phase 2: Tactile Identity (Fingerprint)
 * - Match against Sovereign Template
 * - Triggered immediately upon Face-Lock
 */
export function validateTactileIdentity(data: TactileIdentityData): PhaseResult {
  const startTime = Date.now();
  
  // Validate fingerprint match
  if (!data.fingerprintMatched || data.matchConfidence < 0.95) {
    return {
      phase: 'PHASE_2_TACTILE_IDENTITY',
      status: 'failed',
      timestamp: startTime,
      duration: Date.now() - startTime,
      error: {
        code: 'FINGERPRINT_MISMATCH',
        message: `Fingerprint match confidence too low: ${data.matchConfidence.toFixed(3)} (required: 0.95)`,
        phase: 'PHASE_2_TACTILE_IDENTITY',
        timestamp: Date.now(),
        hardwareError: false, // Likely fraud attempt
      },
    };
  }
  
  return {
    phase: 'PHASE_2_TACTILE_IDENTITY',
    status: 'complete',
    timestamp: startTime,
    duration: Date.now() - startTime,
    data,
  };
}

/**
 * Validate Phase 3: Vital Pulse (Heart & Voice)
 * - Simultaneous capture of spectral resonance and heartbeat frequency
 */
export function validateVitalPulse(data: VitalPulseData): PhaseResult {
  const startTime = Date.now();
  
  // Validate heartbeat detection
  if (!data.pulseDetected || data.heartbeatFrequency < 40 || data.heartbeatFrequency > 200) {
    return {
      phase: 'PHASE_3_VITAL_PULSE',
      status: 'failed',
      timestamp: startTime,
      duration: Date.now() - startTime,
      error: {
        code: 'HEARTBEAT_NOT_DETECTED',
        message: `Invalid heartbeat: ${data.heartbeatFrequency} BPM (expected: 40-200)`,
        phase: 'PHASE_3_VITAL_PULSE',
        timestamp: Date.now(),
        hardwareError: true, // Likely sensor issue
      },
    };
  }
  
  // Validate voice capture
  if (!data.voiceDetected || !data.voiceSpectralHash) {
    return {
      phase: 'PHASE_3_VITAL_PULSE',
      status: 'failed',
      timestamp: startTime,
      duration: Date.now() - startTime,
      error: {
        code: 'VOICE_CAPTURE_FAILED',
        message: 'Voice spectral resonance not captured',
        phase: 'PHASE_3_VITAL_PULSE',
        timestamp: Date.now(),
        hardwareError: true, // Likely microphone issue
      },
    };
  }
  
  return {
    phase: 'PHASE_3_VITAL_PULSE',
    status: 'complete',
    timestamp: startTime,
    duration: Date.now() - startTime,
    data,
  };
}

/**
 * Verify cohesion: All phases must complete within 1,500ms
 * If cohesion fails, flush buffer and reset
 */
export function verifyCohesion(state: SequentialHandshakeState): SequentialHandshakeResult {
  const totalDuration = Date.now() - state.startTime;

  // Check if all phases completed
  const allPhasesComplete =
    state.phases.phase1?.status === 'complete' &&
    state.phases.phase2?.status === 'complete' &&
    state.phases.phase3?.status === 'complete';

  // Check cohesion timeout
  if (totalDuration > COHESION_TIMEOUT_MS) {
    return {
      success: false,
      sessionId: state.sessionId,
      totalDuration,
      phases: state.phases,
      sovereignAuthSignal: false,
      error: {
        code: 'COHESION_TIMEOUT',
        message: `Handshake exceeded 1.5s cohesion rule: ${totalDuration}ms`,
        phase: 'PHASE_4_COHESION_VERIFY',
        timestamp: Date.now(),
        hardwareError: false,
      },
    };
  }

  // Check if any phase failed
  if (!allPhasesComplete) {
    const failedPhase =
      state.phases.phase1?.status === 'failed' ? state.phases.phase1 :
      state.phases.phase2?.status === 'failed' ? state.phases.phase2 :
      state.phases.phase3?.status === 'failed' ? state.phases.phase3 :
      null;

    return {
      success: false,
      sessionId: state.sessionId,
      totalDuration,
      phases: state.phases,
      sovereignAuthSignal: false,
      error: failedPhase?.error || {
        code: 'BUFFER_FLUSH_REQUIRED',
        message: 'One or more phases incomplete',
        phase: 'PHASE_4_COHESION_VERIFY',
        timestamp: Date.now(),
        hardwareError: false,
      },
    };
  }

  // SUCCESS: All phases passed within 1.5s
  return {
    success: true,
    sessionId: state.sessionId,
    totalDuration,
    phases: state.phases,
    sovereignAuthSignal: true, // Send SOVEREIGN_AUTH signal to SOVRYN Chain
  };
}

/**
 * Flush buffer and reset handshake state
 * Called when cohesion fails or sequence is interrupted
 */
export function flushBuffer(state: SequentialHandshakeState): SequentialHandshakeState {
  return initializeHandshakeState();
}

/**
 * Execute sequential handshake with all 4 phases
 * Returns result with SOVEREIGN_AUTH signal only if all phases pass within 1.5s
 */
export async function executeSequentialHandshake(
  phase1Executor: () => Promise<VisualLivenessData>,
  phase2Executor: () => Promise<TactileIdentityData>,
  phase3Executor: () => Promise<VitalPulseData>
): Promise<SequentialHandshakeResult> {
  const state = initializeHandshakeState();

  try {
    // Phase 1: Visual Liveness (Face)
    state.currentPhase = 'PHASE_1_VISUAL_LIVENESS';
    const phase1Data = await Promise.race([
      phase1Executor(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Phase 1 timeout')), PHASE_TIMEOUTS.VISUAL_LIVENESS)
      ),
    ]);
    state.phases.phase1 = validateVisualLiveness(phase1Data);

    if (state.phases.phase1.status === 'failed') {
      return verifyCohesion(state);
    }

    // Check cohesion timeout after Phase 1
    if (checkCohesionTimeout(state.startTime)) {
      return verifyCohesion(state);
    }

    // Phase 2: Tactile Identity (Finger) — Triggered immediately upon Face-Lock
    state.currentPhase = 'PHASE_2_TACTILE_IDENTITY';
    const phase2Data = await Promise.race([
      phase2Executor(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Phase 2 timeout')), PHASE_TIMEOUTS.TACTILE_IDENTITY)
      ),
    ]);
    state.phases.phase2 = validateTactileIdentity(phase2Data);

    if (state.phases.phase2.status === 'failed') {
      return verifyCohesion(state);
    }

    // Check cohesion timeout after Phase 2
    if (checkCohesionTimeout(state.startTime)) {
      return verifyCohesion(state);
    }

    // Phase 3: Vital Pulse (Heart & Voice) — Simultaneous capture
    state.currentPhase = 'PHASE_3_VITAL_PULSE';
    const phase3Data = await Promise.race([
      phase3Executor(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Phase 3 timeout')), PHASE_TIMEOUTS.VITAL_PULSE)
      ),
    ]);
    state.phases.phase3 = validateVitalPulse(phase3Data);

    if (state.phases.phase3.status === 'failed') {
      return verifyCohesion(state);
    }

    // Phase 4: Cohesion Verification
    state.currentPhase = 'PHASE_4_COHESION_VERIFY';
    return verifyCohesion(state);

  } catch (error) {
    // Handle any unexpected errors
    return {
      success: false,
      sessionId: state.sessionId,
      totalDuration: Date.now() - state.startTime,
      phases: state.phases,
      sovereignAuthSignal: false,
      error: {
        code: 'SEQUENCE_INTERRUPTED',
        message: error instanceof Error ? error.message : 'Unknown error',
        phase: state.currentPhase,
        timestamp: Date.now(),
        hardwareError: true,
      },
    };
  }
}


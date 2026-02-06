/**
 * PFF Mobile — Sequential Handshake UI Overlay
 * The Unbending Gate: Processing overlay with double-tap prevention
 * Architect: Isreal Okoro (mrfundzman)
 * 
 * UI Stabilization:
 * - Responsive processing overlay during hardware-level handshake
 * - Prevents user from double-tapping or interrupting the sequence
 * - Shows real-time phase progress
 * - Displays errors with specific hardware details
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import type { HandshakePhase, PhaseStatus } from './coreSequentialHandshake';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SequentialHandshakeOverlayProps {
  visible: boolean;
  currentPhase: HandshakePhase;
  phase1Status: PhaseStatus;
  phase2Status: PhaseStatus;
  phase3Status: PhaseStatus;
  elapsedTime: number;
  onCancel?: () => void; // Optional cancel handler (not recommended during active scan)
}

const PHASE_LABELS = {
  IDLE: 'Initializing...',
  PHASE_1_VISUAL_LIVENESS: 'Phase 1: Visual Liveness',
  PHASE_2_TACTILE_IDENTITY: 'Phase 2: Tactile Identity',
  PHASE_3_VITAL_PULSE: 'Phase 3: Vital Pulse',
  PHASE_4_COHESION_VERIFY: 'Verifying Cohesion...',
  SUCCESS: 'Handshake Complete',
  FAILED: 'Handshake Failed',
} as const;

const PHASE_DESCRIPTIONS = {
  IDLE: 'Preparing sensors...',
  PHASE_1_VISUAL_LIVENESS: '127-point face mesh + liveness detection',
  PHASE_2_TACTILE_IDENTITY: 'Fingerprint match against Sovereign Template',
  PHASE_3_VITAL_PULSE: 'Heart rate + voice spectral resonance',
  PHASE_4_COHESION_VERIFY: 'Validating 1.5s cohesion rule...',
  SUCCESS: 'SOVEREIGN_AUTH signal ready',
  FAILED: 'Buffer flushed. Please retry.',
} as const;

export function SequentialHandshakeOverlay({
  visible,
  currentPhase,
  phase1Status,
  phase2Status,
  phase3Status,
  elapsedTime,
  onCancel,
}: SequentialHandshakeOverlayProps) {
  const pulse = useSharedValue(1);
  const [showCancelWarning, setShowCancelWarning] = useState(false);

  // Pulse animation for active phase indicator
  useEffect(() => {
    if (visible && currentPhase !== 'SUCCESS' && currentPhase !== 'FAILED') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 300 });
    }
  }, [visible, currentPhase, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!visible) return null;

  const cohesionProgress = Math.min(100, (elapsedTime / 1500) * 100);
  const cohesionColor = cohesionProgress < 80 ? '#c9a227' : cohesionProgress < 95 ? '#e8c547' : '#ff6b6b';

  // Prevent interaction during active handshake
  const handleBackdropPress = () => {
    if (currentPhase !== 'SUCCESS' && currentPhase !== 'FAILED') {
      setShowCancelWarning(true);
      setTimeout(() => setShowCancelWarning(false), 2000);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <Text style={styles.title}>Sequential Handshake</Text>
              <Text style={styles.subtitle}>The Unbending Gate</Text>

              {/* Phase Progress */}
              <View style={styles.phaseContainer}>
                <PhaseIndicator
                  label="Phase 1: Face"
                  status={phase1Status}
                  active={currentPhase === 'PHASE_1_VISUAL_LIVENESS'}
                  pulseStyle={pulseStyle}
                />
                <PhaseIndicator
                  label="Phase 2: Finger"
                  status={phase2Status}
                  active={currentPhase === 'PHASE_2_TACTILE_IDENTITY'}
                  pulseStyle={pulseStyle}
                />
                <PhaseIndicator
                  label="Phase 3: Pulse"
                  status={phase3Status}
                  active={currentPhase === 'PHASE_3_VITAL_PULSE'}
                  pulseStyle={pulseStyle}
                />
              </View>

              {/* Current Phase Info */}
              <View style={styles.currentPhaseContainer}>
                <Text style={styles.currentPhaseLabel}>
                  {PHASE_LABELS[currentPhase]}
                </Text>
                <Text style={styles.currentPhaseDescription}>
                  {PHASE_DESCRIPTIONS[currentPhase]}
                </Text>
              </View>

              {/* Cohesion Timer */}
              <View style={styles.cohesionContainer}>
                <View style={styles.cohesionBar}>
                  <View
                    style={[
                      styles.cohesionProgress,
                      { width: `${cohesionProgress}%`, backgroundColor: cohesionColor },
                    ]}
                  />
                </View>
                <Text style={styles.cohesionText}>
                  {elapsedTime}ms / 1500ms
                </Text>
              </View>

              {/* Cancel Warning */}
              {showCancelWarning && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    ⚠️ Do not interrupt the handshake sequence
                  </Text>
                </View>
              )}

              {/* Processing Indicator */}
              {currentPhase !== 'SUCCESS' && currentPhase !== 'FAILED' && (
                <ActivityIndicator size="large" color="#c9a227" style={styles.spinner} />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/**
 * Phase Indicator Component
 * Shows status of each phase with visual feedback
 */
function PhaseIndicator({
  label,
  status,
  active,
  pulseStyle,
}: {
  label: string;
  status: PhaseStatus;
  active: boolean;
  pulseStyle: any;
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return '✓';
      case 'failed':
        return '✗';
      case 'active':
        return '●';
      default:
        return '○';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'complete':
        return '#4ade80'; // Green
      case 'failed':
        return '#ff6b6b'; // Red
      case 'active':
        return '#c9a227'; // Gold
      default:
        return '#6b6b70'; // Gray
    }
  };

  const Wrapper = active ? Animated.View : View;
  const wrapperStyle = active ? pulseStyle : {};

  return (
    <Wrapper style={[styles.phaseIndicator, wrapperStyle]}>
      <Text style={[styles.phaseIcon, { color: getStatusColor() }]}>
        {getStatusIcon()}
      </Text>
      <Text style={[styles.phaseLabel, { color: getStatusColor() }]}>
        {label}
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    backgroundColor: '#16161a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e8c547',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b6b70',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  phaseContainer: {
    width: '100%',
    marginBottom: 24,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#0d0d0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2e',
  },
  phaseIcon: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentPhaseContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  currentPhaseLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c9a227',
    marginBottom: 4,
    textAlign: 'center',
  },
  currentPhaseDescription: {
    fontSize: 12,
    color: '#6b6b70',
    textAlign: 'center',
  },
  cohesionContainer: {
    width: '100%',
    marginBottom: 20,
  },
  cohesionBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#2a2a2e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cohesionProgress: {
    height: '100%',
    borderRadius: 4,
  },
  cohesionText: {
    fontSize: 12,
    color: '#6b6b70',
    textAlign: 'center',
    fontWeight: '600',
  },
  warningContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: '#ff6b6b20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: '#ff6b6b',
    textAlign: 'center',
    fontWeight: '600',
  },
  spinner: {
    marginTop: 8,
  },
});


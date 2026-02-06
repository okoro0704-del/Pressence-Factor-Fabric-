/**
 * PFF — Presence Verification Overlay
 * Triggered by "Vitalize My Nation." Face [F] viewfinder, liveness HUD, progress ring,
 * success seal → QR Presence Proof. Integrates with core PFF handshake.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Vibration,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Rect, Mask } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { performHandshake } from '../pff';
import type { HandshakeResult, SignedPresenceProof } from '../pff/types';
import { theme } from '../vote/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIEWFINDER_SIZE = Math.min(SCREEN_WIDTH * 0.7, 280);
const PROGRESS_RING_SIZE = VIEWFINDER_SIZE + 48;
const LIVENESS_DURATION_MS = 3400;
const FEEDBACK_STAGES = [
  'Detecting Liveness...',
  'Verifying Presence...',
  'Hardware Anchor Secure.',
] as const;

type Phase = 'camera' | 'scanning' | 'verifying' | 'success' | 'error';
type ErrorKind = 'face_not_detected' | 'lighting' | 'camera_denied' | 'handshake_failed';

export interface PresenceVerificationOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PresenceVerificationOverlay({
  visible,
  onClose,
  onSuccess,
}: PresenceVerificationOverlayProps): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('camera');
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [proofForQr, setProofForQr] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const sealScale = useSharedValue(0);
  const sealToQr = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const advanceFeedback = useCallback(() => {
    setFeedbackIndex((i) => (i + 1) % FEEDBACK_STAGES.length);
  }, []);

  useEffect(() => {
    if (!visible) return;
    setPhase('camera');
    setErrorKind(null);
    setFeedbackIndex(0);
    setProofForQr(null);
    setDemoMode(false);
    progress.value = 0;
    sealScale.value = 0;
    sealToQr.value = 0;
    pulse.value = 1;
  }, [visible, progress, sealScale, sealToQr, pulse]);

  useEffect(() => {
    if (!visible) return;
    const canStart = (hasPermission && device) || demoMode;
    if (!canStart) return;
    const t = setTimeout(() => {
      setPhase('scanning');
      progress.value = withTiming(1, {
        duration: LIVENESS_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
      });
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, 400);
    return () => clearTimeout(t);
  }, [visible, hasPermission, device, demoMode, progress, pulse]);

  useEffect(() => {
    if (phase !== 'scanning' && phase !== 'verifying') return;
    timerRef.current = setInterval(advanceFeedback, 1100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, advanceFeedback]);

  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const earlyFailRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible || phase !== 'scanning') return;
    const failChance = Math.random();
    const earlyFail = failChance < 0.05 ? 'face_not_detected' : failChance < 0.08 ? 'lighting' : null;

    earlyFailRef.current = setTimeout(() => {
      if (earlyFail) {
        if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
        doneTimeoutRef.current = null;
        setErrorKind(earlyFail);
        setPhase('error');
        return;
      }
    }, 1500);

    doneTimeoutRef.current = setTimeout(async () => {
      earlyFailRef.current = null;
      setPhase('verifying');
      let result: HandshakeResult;
      try {
        result = await performHandshake();
      } catch (e) {
        setErrorKind('handshake_failed');
        setPhase('error');
        return;
      }
      if (!result.success) {
        setErrorKind('handshake_failed');
        setPhase('error');
        return;
      }
      const sig = (result as { signedProof: SignedPresenceProof }).signedProof;
      const payload = JSON.stringify({
        p: sig.payload,
        s: sig.signature,
      });
      setProofForQr(payload);
      setPhase('success');
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Vibration.vibrate([0, 50, 50, 80, 50, 80]);
      }
      sealScale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
      });
      sealToQr.value = withDelay(
        1400,
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.cubic) })
      );
      onSuccess?.();
    }, LIVENESS_DURATION_MS);

    return () => {
      if (earlyFailRef.current) clearTimeout(earlyFailRef.current);
      if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
    };
  }, [visible, phase, onSuccess, sealScale, sealToQr, progress]);

  const handleRetry = useCallback(() => {
    setPhase('camera');
    setErrorKind(null);
    setFeedbackIndex(0);
    progress.value = 0;
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission, progress]);

  if (!visible) return null;

  const noCamera = !device || !hasPermission;
  const showCamera = !demoMode && hasPermission && device && (phase === 'camera' || phase === 'scanning' || phase === 'verifying');
  const showPlaceholder = (noCamera || demoMode) && (phase === 'camera' || phase === 'scanning' || phase === 'verifying');

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {showCamera && (
          <View style={StyleSheet.absoluteFill}>
            <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
            <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
              <Defs>
                <Mask id="vf">
                  <Rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="white" />
                  <Circle
                    cx={SCREEN_WIDTH / 2}
                    cy={SCREEN_HEIGHT * 0.38}
                    r={VIEWFINDER_SIZE / 2}
                    fill="black"
                  />
                </Mask>
              </Defs>
              <Rect
                width={SCREEN_WIDTH}
                height={SCREEN_HEIGHT}
                fill="rgba(0,0,0,0.6)"
                mask="url(#vf)"
              />
            </Svg>
          </View>
        )}

        {showPlaceholder && (
          <View style={[StyleSheet.absoluteFill, styles.placeholderBg]} />
        )}

        {(phase === 'camera' || phase === 'scanning' || phase === 'verifying') && (
          <>
            <ViewFinder pulse={pulse} size={VIEWFINDER_SIZE} />
            <ProgressRing progress={progress} size={PROGRESS_RING_SIZE} />
            <LivenessHud feedbackIndex={feedbackIndex} pulse={pulse} />
          </>
        )}

        {phase === 'success' && (
          <SuccessView
            sealScale={sealScale}
            sealToQr={sealToQr}
            proofForQr={proofForQr}
            onClose={onClose}
          />
        )}

        {phase === 'error' && (
          <ErrorView
            errorKind={errorKind ?? 'face_not_detected'}
            onRetry={handleRetry}
            onClose={onClose}
          />
        )}

        {(phase === 'camera' || phase === 'scanning' || phase === 'verifying') && (
          <TouchableOpacity style={[styles.closeBtn, { top: insets.top + 8 }]} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        )}

        {noCamera && phase === 'camera' && !demoMode && (
          <View style={styles.noCameraWrap}>
            <Text style={styles.noCameraTitle}>Camera required</Text>
            <Text style={styles.noCameraSub}>
              Allow camera access to verify your presence with the Face [F] layer.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => requestPermission()}>
              <Text style={styles.primaryBtnText}>Allow camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setDemoMode(true)}>
              <Text style={styles.secondaryBtnText}>Continue without camera (demo)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

function ViewFinder({ pulse, size }: { pulse: Animated.SharedValue<number>; size: number }) {
  const r = size / 2;
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <Animated.View style={[styles.viewfinderWrap, { width: size, height: size, borderRadius: r }, animated]}>
      <View style={[styles.viewfinderRing, { width: size, height: size, borderRadius: r }]} />
      <Text style={styles.viewfinderLabel}>Face [F]</Text>
    </Animated.View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ProgressRing({ progress, size }: { progress: Animated.SharedValue<number>; size: number }) {
  const r = (size - 8) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={[styles.progressRingWrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cx} r={r} stroke={theme.obsidian.border} strokeWidth={4} fill="none" />
        <AnimatedCircle
          cx={cx}
          cy={cx}
          r={r}
          stroke={theme.gold.primary}
          strokeWidth={4}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

function LivenessHud({ feedbackIndex, pulse }: { feedbackIndex: number; pulse: Animated.SharedValue<number> }) {
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <View style={styles.hud}>
      <Animated.View style={[styles.pulse, dotStyle]} />
      <Text style={styles.hudText}>{FEEDBACK_STAGES[feedbackIndex]}</Text>
    </View>
  );
}

function SuccessView({
  sealScale,
  sealToQr,
  proofForQr,
  onClose,
}: {
  sealScale: Animated.SharedValue<number>;
  sealToQr: Animated.SharedValue<number>;
  proofForQr: string | null;
  onClose: () => void;
}) {
  const sealStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sealToQr.value, [0, 0.5, 1], [1, 0, 0]),
    transform: [{ scale: sealScale.value * interpolate(sealToQr.value, [0, 1], [1, 0.6]) }],
  }));
  const qrStyle = useAnimatedStyle(() => ({
    opacity: sealToQr.value,
    transform: [{ scale: interpolate(sealToQr.value, [0, 1], [0.8, 1]) }],
  }));

  return (
    <View style={styles.successWrap}>
      <View style={styles.sealQrOverlay}>
        <Animated.View style={[styles.seal, sealStyle]} pointerEvents="none">
          <Text style={styles.sealText}>PFF</Text>
          <Text style={styles.sealSub}>Vitalization Seal</Text>
        </Animated.View>
        {proofForQr && (
          <Animated.View style={[styles.qrWrap, qrStyle]} pointerEvents="none">
            <QRCode value={proofForQr} size={160} color={theme.obsidian.bg} backgroundColor={theme.white} />
            <Text style={styles.qrLabel}>Presence Proof</Text>
          </Animated.View>
        )}
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
        <Text style={styles.primaryBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const ERROR_COPY: Record<ErrorKind, { title: string; sub: string }> = {
  face_not_detected: {
    title: 'Face not detected',
    sub: 'Center your face in the circle and try again. Ensure you’re in a well-lit area.',
  },
  lighting: {
    title: 'Move to better lighting',
    sub: 'Lighting is too low for verification. Move to a brighter spot and retry.',
  },
  camera_denied: {
    title: 'Camera access needed',
    sub: 'Allow camera access in settings to verify your presence.',
  },
  handshake_failed: {
    title: 'Verification didn’t complete',
    sub: 'Complete Vitalization first to create your secure key, then try again.',
  },
};

function ErrorView({
  errorKind,
  onRetry,
  onClose,
}: {
  errorKind: ErrorKind;
  onRetry: () => void;
  onClose: () => void;
}) {
  const { title, sub } = ERROR_COPY[errorKind];
  return (
    <View style={styles.errorWrap}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorSub}>{sub}</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onRetry}>
        <Text style={styles.primaryBtnText}>Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
        <Text style={styles.secondaryBtnText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.obsidian.bg,
  },
  placeholderBg: {
    backgroundColor: theme.obsidian.surface,
  },
  viewfinderWrap: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - VIEWFINDER_SIZE / 2,
    top: SCREEN_HEIGHT * 0.38 - VIEWFINDER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: theme.gold.primary,
  },
  viewfinderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.gold.primary,
    letterSpacing: 1,
  },
  progressRingWrap: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - PROGRESS_RING_SIZE / 2,
    top: SCREEN_HEIGHT * 0.38 - PROGRESS_RING_SIZE / 2,
  },
  hud: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.2,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.gold.primary,
    marginBottom: 12,
    opacity: 0.9,
  },
  hudText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.white,
  },
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sealQrOverlay: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  seal: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.gold.primary,
    borderWidth: 3,
    borderColor: theme.gold.bright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.obsidian.bg,
    letterSpacing: 2,
  },
  sealSub: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.obsidian.bg,
    letterSpacing: 1,
    marginTop: 4,
  },
  qrWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.obsidian.muted,
    marginTop: 12,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 14,
    color: theme.obsidian.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  noCameraWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noCameraTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  noCameraSub: {
    fontSize: 14,
    color: theme.obsidian.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: theme.gold.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.obsidian.bg,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.obsidian.muted,
  },
  closeBtn: {
    position: 'absolute',
    right: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.white,
  },
});

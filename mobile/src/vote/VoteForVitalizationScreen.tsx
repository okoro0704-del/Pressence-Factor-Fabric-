/**
 * PFF — Vote for Vitalization Portal
 * High-authority, dark mode, minimalist gold & obsidian.
 * Born in Lagos. Built for the World.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { PresenceVerificationOverlay } from '../presence/PresenceVerificationOverlay';
import { theme } from './theme';

const DURATION = 600;
const STAGGER = 120;

// Mock; replace with API
const MOCK_TOTAL_VOTES = 2_847_391;

function PffLogo() {
  return (
    <View style={styles.logo}>
      <Text style={styles.logoText}>PFF</Text>
    </View>
  );
}

function Header() {
  const insets = useSafeAreaInsets();
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) });
  }, [o]);
  const animated = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: interpolate(o.value, [0, 1], [12, 0]) }],
  }));

  return (
    <Animated.View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }, animated]}>
      <PffLogo />
      <Text style={styles.tagline}>Born in Lagos. Built for the World.</Text>
    </Animated.View>
  );
}

function LiveCounter() {
  const [display, setDisplay] = useState(0);
  const o = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    o.value = withDelay(
      STAGGER,
      withTiming(1, { duration: DURATION * 1.2, easing: Easing.out(Easing.cubic) })
    );
    scale.value = withDelay(
      STAGGER,
      withSequence(
        withTiming(1.02, { duration: 200 }),
        withTiming(1, { duration: 300 })
      )
    );
  }, [o, scale]);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const step = MOCK_TOTAL_VOTES / steps;
    const interval = duration / steps;
    let v = 0;
    const id = setInterval(() => {
      v += step;
      if (v >= MOCK_TOTAL_VOTES) {
        setDisplay(MOCK_TOTAL_VOTES);
        clearInterval(id);
        return;
      }
      setDisplay(Math.floor(v));
    }, interval);
    return () => clearInterval(id);
  }, []);

  const animated = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [
      { translateY: interpolate(o.value, [0, 1], [16, 0]) },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.counterSection, animated]}>
      <Text style={styles.counterLabel}>Total Global Presence Votes</Text>
      <Text style={styles.counterValue}>{display.toLocaleString()}</Text>
    </Animated.View>
  );
}

function GreatDivergenceCard() {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withDelay(
      STAGGER * 2,
      withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) })
    );
  }, [o]);
  const animated = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: interpolate(o.value, [0, 1], [20, 0]) }],
  }));

  return (
    <Animated.View style={[styles.divergenceCard, animated]}>
      <Text style={styles.divergenceTitle}>The Great Divergence</Text>
      <View style={styles.divergenceSplit}>
        <View style={[styles.divergenceHalf, styles.shadowHalf]}>
          <Text style={[styles.divergenceHalfTitle, styles.shadowHalfTitle]}>The Shadow Economy</Text>
          <Text style={styles.shadowBlur} numberOfLines={3}>
            Unverified identities. Fraud. No presence-based reality. The old world.
          </Text>
        </View>
        <View style={[styles.divergenceHalf, styles.vitalizedHalf]}>
          <Text style={[styles.divergenceHalfTitle, styles.vitalizedHalfTitle]}>The Vitalized State</Text>
          <Text style={styles.vitalizedSharp} numberOfLines={3}>
            Hardware-bound proof. Zero-knowledge. Presence-only. The future.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function PledgeCard({
  pledged,
  onToggle,
}: {
  pledged: boolean;
  onToggle: () => void;
}) {
  const o = useSharedValue(0);
  const thumbX = useSharedValue(0);
  useEffect(() => {
    o.value = withDelay(
      STAGGER * 3,
      withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) })
    );
  }, [o]);
  useEffect(() => {
    thumbX.value = withTiming(pledged ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [pledged, thumbX]);
  const animated = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: interpolate(o.value, [0, 1], [20, 0]) }],
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(thumbX.value, [0, 1], [0, 24]) }],
  }));

  return (
    <Animated.View style={[styles.pledgeCard, animated]}>
      <Text style={styles.pledgeTitle}>Terms of Vitalization</Text>
      <View style={styles.scannable}>
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>PFF</Text>
          <Text style={styles.qrHint}>Scan to verify</Text>
        </View>
        <View style={styles.pledgeToggleRow}>
          <Text style={styles.pledgeLabel}>I Pledge My Presence</Text>
          <TouchableOpacity
            style={[styles.toggle, pledged && styles.toggleOn]}
            onPress={onToggle}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.toggleThumb, pledged && styles.toggleThumbOn, thumbStyle]} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

function VitalizeButton({
  disabled,
  onPress,
  onVitalize,
}: {
  disabled: boolean;
  onPress: () => void;
  onVitalize?: () => void;
}) {
  const o = useSharedValue(0);
  const scale = useSharedValue(1);
  useEffect(() => {
    o.value = withDelay(
      STAGGER * 4,
      withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) })
    );
  }, [o]);

  const animated = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: interpolate(o.value, [0, 1], [24, 0]) }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 80 });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  const buttonAnimated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.buttonWrap, animated]}>
      <TouchableOpacity
        style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
        onPress={() => {
          if (disabled) return;
          Vibration.vibrate(50);
          onPress();
          onVitalize?.();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <Animated.View style={buttonAnimated}>
          <Text style={[styles.primaryButtonText, disabled && styles.primaryButtonTextDisabled]}>
            VITALIZE MY NATION
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

type VoteNav = NativeStackNavigationProp<RootStackParamList, 'Vote'>;

export function VoteForVitalizationScreen(): React.JSX.Element {
  const [pledged, setPledged] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const verifiedRef = React.useRef(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<VoteNav>();

  const handleVitalize = () => {
    verifiedRef.current = false;
    setOverlayVisible(true);
  };

  const handleOverlaySuccess = () => {
    verifiedRef.current = true;
  };

  const handleOverlayClose = () => {
    setOverlayVisible(false);
    if (verifiedRef.current) navigation.navigate('Vitalization');
  };

  return (
    <View style={styles.container}>
      <PresenceVerificationOverlay
        visible={overlayVisible}
        onClose={handleOverlayClose}
        onSuccess={handleOverlaySuccess}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <LiveCounter />
        <GreatDivergenceCard />
        <PledgeCard pledged={pledged} onToggle={() => setPledged((p) => !p)} />
        <VitalizeButton
          disabled={!pledged}
          onPress={() => {}}
          onVitalize={handleVitalize}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.obsidian.bg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: theme.obsidian.surface,
    borderWidth: 1,
    borderColor: theme.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.gold.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.obsidian.muted,
    letterSpacing: 0.5,
  },
  counterSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: theme.obsidian.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.obsidian.border,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.obsidian.muted,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  counterValue: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.gold.primary,
    letterSpacing: 1,
  },
  divergenceCard: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.obsidian.border,
  },
  divergenceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.obsidian.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.obsidian.surface,
  },
  divergenceSplit: {
    flexDirection: 'row',
  },
  divergenceHalf: {
    flex: 1,
    padding: 16,
    minHeight: 120,
  },
  shadowHalf: {
    backgroundColor: 'rgba(139, 38, 53, 0.15)',
    borderRightWidth: 1,
    borderRightColor: theme.obsidian.border,
  },
  vitalizedHalf: {
    backgroundColor: 'rgba(201, 162, 39, 0.08)',
    borderLeftWidth: 1,
    borderLeftColor: theme.gold.dim,
  },
  divergenceHalfTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  shadowHalfTitle: {
    color: theme.shadow.redBright,
  },
  vitalizedHalfTitle: {
    color: theme.gold.bright,
  },
  shadowBlur: {
    fontSize: 12,
    color: theme.shadow.redBright,
    opacity: 0.78,
    lineHeight: 18,
    textShadowColor: 'rgba(139, 38, 53, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  vitalizedSharp: {
    fontSize: 12,
    color: theme.gold.bright,
    fontWeight: '600',
    lineHeight: 18,
    textShadowColor: 'rgba(201, 162, 39, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  pledgeCard: {
    marginBottom: 32,
    backgroundColor: theme.obsidian.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.obsidian.border,
    overflow: 'hidden',
  },
  pledgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.obsidian.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  scannable: {
    padding: 20,
    paddingTop: 8,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    backgroundColor: theme.obsidian.bg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.gold.dim,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  qrText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.gold.primary,
    letterSpacing: 2,
  },
  qrHint: {
    fontSize: 10,
    color: theme.obsidian.muted,
    marginTop: 4,
  },
  pledgeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pledgeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.white,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.obsidian.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: theme.gold.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.obsidian.muted,
  },
  toggleThumbOn: {
    backgroundColor: theme.white,
  },
  buttonWrap: {
    paddingHorizontal: 0,
  },
  primaryButton: {
    backgroundColor: theme.gold.primary,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.gold.bright,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.obsidian.surface,
    borderColor: theme.obsidian.border,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.obsidian.bg,
    letterSpacing: 2,
  },
  primaryButtonTextDisabled: {
    color: theme.obsidian.muted,
  },
});

/**
 * PFF — Manifesto Flow
 * Slide 6: Lagos Origin. Parallax skyline background.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import type { ManifestoSlide } from './types';
import { theme } from '../vote/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Placeholder Lagos skyline silhouette (replace with asset via imageUrl when available). */
function LagosSkylineSvg() {
  return (
    <Svg width={SCREEN_WIDTH * 1.2} height={240} viewBox={`0 0 ${SCREEN_WIDTH * 1.2} 240`} preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id="skylineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={theme.obsidian.bg} stopOpacity="0" />
          <Stop offset="0.6" stopColor={theme.obsidian.bg} stopOpacity="0.3" />
          <Stop offset="1" stopColor={theme.obsidian.surface} stopOpacity="0.9" />
        </LinearGradient>
      </Defs>
      <Path
        d="M0,240 L0,180 L40,160 L80,200 L120,140 L160,180 L200,120 L240,160 L280,100 L320,140 L360,90 L400,130 L440,80 L480,120 L520,70 L560,110 L600,60 L640,100 L680,50 L720,90 L760,40 L800,80 L840,50 L880,90 L920,60 L960,100 L1000,70 L1040,110 L1080,80 L1120,120 L1160,90 L1200,130 L1200,240 Z"
        fill="url(#skylineGrad)"
      />
      <Path
        d="M0,240 L0,200 L30,180 L60,220 L90,160 L130,200 L170,150 L210,190 L250,130 L290,170 L330,120 L370,160 L410,110 L450,150 L490,100 L530,140 L570,95 L610,135 L650,90 L690,130 L730,85 L770,125 L810,80 L850,120 L890,75 L930,115 L970,70 L1010,110 L1050,75 L1090,115 L1130,80 L1170,120 L1200,100 L1200,240 Z"
        fill={theme.obsidian.surface}
        opacity={0.6}
      />
    </Svg>
  );
}

export interface SlideLagosProps {
  slide: ManifestoSlide;
  isFocused: boolean;
}

export function SlideLagos({ slide, isFocused }: SlideLagosProps): React.JSX.Element {
  const parallax = useSharedValue(0);

  useEffect(() => {
    if (!isFocused) {
      parallax.value = withTiming(0, { duration: 300 });
      return;
    }
    parallax.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [isFocused, parallax]);

  const bgStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(parallax.value, [0, 1], [-8, 8]) },
      { translateY: interpolate(parallax.value, [0, 1], [4, -4]) },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.skylineWrap, bgStyle]} pointerEvents="none">
        <LagosSkylineSvg />
      </Animated.View>
      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        {slide.subtitle ? <Text style={styles.subtitle}>{slide.subtitle}</Text> : null}
        {slide.body ? <Text style={styles.body}>{slide.body}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  skylineWrap: {
    position: 'absolute',
    bottom: 0,
    left: -SCREEN_WIDTH * 0.1,
    right: -SCREEN_WIDTH * 0.1,
    height: 240,
  },
  content: {
    maxWidth: 360,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.white,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.gold.primary,
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.obsidian.muted,
  },
});

/**
 * PFF — Manifesto Flow
 * Slide 7: Comparison. Before/After draggable slider (Shadow Economy vs Vitalized State).
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import type { ManifestoSlide } from './types';
import { theme } from '../vote/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PAD = 28;
const SLIDER_WIDTH = SCREEN_WIDTH - CONTENT_PAD * 2;
const THUMB_WIDTH = 32;
const SPRING_CONFIG = { damping: 20, stiffness: 200 };

export interface SlideComparisonProps {
  slide: ManifestoSlide;
}

export function SlideComparison({ slide }: SlideComparisonProps): React.JSX.Element {
  const cmp = slide.comparison ?? {
    beforeLabel: 'The Shadow Economy',
    beforeBody: 'Unverified identities. Fraud. No presence-based reality. The old world.',
    afterLabel: 'The Vitalized State',
    afterBody: 'Hardware-bound proof. Zero-knowledge. Presence-only. The future.',
  };
  const thumbX = useSharedValue(SLIDER_WIDTH / 2 - THUMB_WIDTH / 2);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: { startX: number }) => {
      ctx.startX = thumbX.value;
    },
    onActive: (e, ctx) => {
      const next = ctx.startX + e.translationX;
      thumbX.value = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_WIDTH, next));
    },
    onEnd: () => {
      thumbX.value = withSpring(thumbX.value, SPRING_CONFIG);
    },
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    left: thumbX.value,
  }));

  const overlayInnerStyle = useAnimatedStyle(() => ({
    marginLeft: -thumbX.value,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{slide.title}</Text>
      {slide.subtitle ? <Text style={styles.subtitle}>{slide.subtitle}</Text> : null}

      <View style={styles.sliderWrap}>
        <View style={[styles.panel, styles.beforePanel]}>
          <Text style={styles.panelLabel}>{cmp.beforeLabel}</Text>
          <Text style={styles.panelBody}>{cmp.beforeBody}</Text>
        </View>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Animated.View style={[styles.overlayInner, overlayInnerStyle]}>
            <View style={[styles.panel, styles.afterPanel]}>
              <Text style={[styles.panelLabel, styles.afterLabel]}>{cmp.afterLabel}</Text>
              <Text style={[styles.panelBody, styles.afterBody]}>{cmp.afterBody}</Text>
            </View>
          </Animated.View>
        </Animated.View>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.thumb, thumbStyle]}>
            <View style={styles.thumbBar} />
          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: CONTENT_PAD,
    paddingTop: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.white,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.obsidian.muted,
    letterSpacing: 1,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  sliderWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.obsidian.border,
    minHeight: 180,
    position: 'relative',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'center',
  },
  beforePanel: {
    backgroundColor: 'rgba(139, 38, 53, 0.15)',
  },
  afterPanel: {
    backgroundColor: 'rgba(201, 162, 39, 0.08)',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  overlayInner: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SLIDER_WIDTH,
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
    color: theme.shadow.redBright,
  },
  afterLabel: {
    color: theme.gold.bright,
  },
  panelBody: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.shadow.redBright,
    opacity: 0.9,
  },
  afterBody: {
    color: theme.gold.bright,
    fontWeight: '600',
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: THUMB_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  thumbBar: {
    width: 4,
    height: '60%',
    borderRadius: 2,
    backgroundColor: theme.gold.primary,
  },
});

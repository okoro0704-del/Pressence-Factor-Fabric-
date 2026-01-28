/**
 * PFF — Manifesto Flow
 * Slide 8: Final. CTA transitions directly into Presence Check.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import type { ManifestoSlide } from './types';
import { theme } from '../vote/theme';

export interface SlideFinalProps {
  slide: ManifestoSlide;
  onVitalize?: () => void;
}

export function SlideFinal({ slide, onVitalize }: SlideFinalProps): React.JSX.Element {
  const cta = slide.cta ?? 'Begin';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        {slide.subtitle ? <Text style={styles.subtitle}>{slide.subtitle}</Text> : null}
        {slide.body ? <Text style={styles.body}>{slide.body}</Text> : null}
      </View>
      <TouchableOpacity
        style={styles.cta}
        onPress={() => {
          Vibration.vibrate(50);
          onVitalize?.();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>{cta}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  content: {
    maxWidth: 360,
    marginBottom: 40,
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
  cta: {
    backgroundColor: theme.gold.primary,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.gold.bright,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.obsidian.bg,
    letterSpacing: 2,
  },
});

/**
 * PFF — Manifesto Flow
 * Generic slide renderer. Routes to layout-specific components (default, lagos, comparison, final).
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import type { ManifestoSlide as ManifestoSlideType } from './types';
import { SlideLagos } from './SlideLagos';
import { SlideComparison } from './SlideComparison';
import { SlideFinal } from './SlideFinal';
import { theme } from '../vote/theme';

export interface ManifestoSlideProps {
  slide: ManifestoSlideType;
  onVitalize?: () => void;
  isFocused?: boolean;
}

export function ManifestoSlide({ slide, onVitalize, isFocused }: ManifestoSlideProps): React.JSX.Element {
  if (slide.layout === 'lagos') {
    return <SlideLagos slide={slide} isFocused={isFocused ?? false} />;
  }
  if (slide.layout === 'comparison') {
    return <SlideComparison slide={slide} />;
  }
  if (slide.layout === 'final') {
    return <SlideFinal slide={slide} onVitalize={onVitalize} />;
  }

  return (
    <View style={styles.container}>
      {slide.imageUrl ? (
        <Image source={{ uri: slide.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : null}
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
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.15,
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

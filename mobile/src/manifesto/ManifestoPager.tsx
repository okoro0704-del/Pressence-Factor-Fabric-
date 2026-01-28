/**
 * PFF — Manifesto Flow
 * Horizontal PagerView wrapper. Renders 8 Manifesto slides.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { ManifestoSlide } from './ManifestoSlide';
import type { ManifestoSlide as ManifestoSlideType } from './types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ManifestoPagerProps {
  slides: ManifestoSlideType[];
  onVitalize?: () => void;
  onPageSelected?: (index: number) => void;
}

export function ManifestoPager({ slides, onVitalize, onPageSelected }: ManifestoPagerProps): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState(0);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const idx = e.nativeEvent.position;
      setCurrentPage(idx);
      onPageSelected?.(idx);
    },
    [onPageSelected]
  );

  if (!slides.length) return <View style={styles.container} />;

  return (
    <PagerView
      style={styles.pager}
      initialPage={0}
      onPageSelected={handlePageSelected}
    >
      {slides.map((slide, index) => (
        <View key={slide.id} style={styles.page} collapsable={false}>
          <ManifestoSlide
            slide={slide}
            onVitalize={onVitalize}
            isFocused={index === currentPage}
          />
        </View>
      ))}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pager: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  page: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

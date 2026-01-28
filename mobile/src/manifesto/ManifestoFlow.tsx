/**
 * PFF — Manifesto Flow
 * Primary onboarding: 8 slides, Skip to Vitalize, Presence Check → Vitalization.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getManifestoSlides, getDefaultManifestoSlides } from './contentSource';
import type { ManifestoSlide } from './types';
import { ManifestoPager } from './ManifestoPager';
import { PresenceVerificationOverlay } from '../presence/PresenceVerificationOverlay';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../vote/theme';

type ManifestoNav = NativeStackNavigationProp<RootStackParamList, 'Manifesto'>;

export function ManifestoFlow(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ManifestoNav>();
  const [slides, setSlides] = useState<ManifestoSlide[]>(() => getDefaultManifestoSlides());
  const [overlayVisible, setOverlayVisible] = useState(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    getManifestoSlides().then((s) => {
      if (s.length) setSlides(s);
    });
  }, []);

  const handleVitalize = useCallback(() => {
    verifiedRef.current = false;
    setOverlayVisible(true);
  }, []);

  const handleOverlaySuccess = useCallback(() => {
    verifiedRef.current = true;
  }, []);

  const handleOverlayClose = useCallback(() => {
    setOverlayVisible(false);
    if (verifiedRef.current) navigation.navigate('Vitalization');
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <PresenceVerificationOverlay
        visible={overlayVisible}
        onClose={handleOverlayClose}
        onSuccess={handleOverlaySuccess}
      />
      <TouchableOpacity
        style={[styles.skip, { top: insets.top + 8 }]}
        onPress={handleVitalize}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip to Vitalize</Text>
      </TouchableOpacity>
      <ManifestoPager slides={slides} onVitalize={handleVitalize} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.obsidian.bg,
  },
  skip: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.obsidian.muted,
  },
});

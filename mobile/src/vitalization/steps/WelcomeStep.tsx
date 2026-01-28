/**
 * PFF — Vitalization Flow
 * Step 0: Welcome. Anchoring hardware to legal identity.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps): React.JSX.Element {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { maxWidth: width * 0.9 }]}>
      <Text style={styles.title}>Vitalization</Text>
      <Text style={styles.subtitle}>
        Anchor your device to your legal identity. Your biometrics never leave
        this phone — we only use a signed proof of your presence.
      </Text>
      <Text style={styles.ethos}>Born in Lagos, Built for the World.</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    marginBottom: 24,
  },
  ethos: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

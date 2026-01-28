/**
 * PFF — Vitalization Flow
 * Step 3: Complete. Hardware anchored to legal identity.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import type { LegalIdentityForm } from './LegalIdentityStep';
import type { KeyGenerationResult } from '../../pff/types';

interface CompleteStepProps {
  legalIdentity: LegalIdentityForm;
  keyResult: KeyGenerationResult;
  onFinish: () => void;
}

export function CompleteStep({
  legalIdentity,
  keyResult,
  onFinish,
}: CompleteStepProps): React.JSX.Element {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { maxWidth: width * 0.9 }]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>✓</Text>
      </View>
      <Text style={styles.title}>You're vitalized</Text>
      <Text style={styles.subtitle}>
        This device is now anchored to your legal identity. Your signing key is
        stored in secure hardware and protected by {keyResult.biometryType}.
      </Text>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Identity</Text>
        <Text style={styles.summaryValue}>{legalIdentity.fullName}</Text>
        <Text style={styles.summaryLabel}>ID</Text>
        <Text style={styles.summaryValue}>
          {legalIdentity.idType} • {legalIdentity.idNumber}
        </Text>
        <Text style={styles.summaryLabel}>Key</Text>
        <Text style={styles.summaryValue}>{keyResult.keyId}</Text>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={onFinish} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Continue to PFF</Text>
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
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 24,
  },
  summary: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 12,
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

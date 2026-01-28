/**
 * PFF — Vitalization Flow
 * Step 2: Device binding. Secure Enclave / Keymaster key generation (Layer 1).
 * Checks capabilities, creates hardware-bound signing key.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {
  getDeviceCapabilities,
  createSigningKey,
  hasSigningKey,
} from '../../pff/secureEnclaveService';
import type { DeviceCapabilities, KeyGenerationResult } from '../../pff/types';

interface DeviceBindingStepProps {
  onNext: (result: KeyGenerationResult) => void;
  onBack: () => void;
}

type Status =
  | 'loading'
  | 'checking'
  | 'ready'
  | 'creating'
  | 'done'
  | 'error'
  | 'no_biometrics';

export function DeviceBindingStep({
  onNext,
  onBack,
}: DeviceBindingStepProps): React.JSX.Element {
  const [status, setStatus] = useState<Status>('loading');
  const [caps, setCaps] = useState<DeviceCapabilities | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [keyResult, setKeyResult] = useState<KeyGenerationResult | null>(null);
  const { width } = useWindowDimensions();

  useEffect(() => {
    (async () => {
      setStatus('checking');
      const c = await getDeviceCapabilities();
      setCaps(c);
      if (!c.hasBiometrics) {
        setStatus('no_biometrics');
        return;
      }
      const exists = await hasSigningKey();
      if (exists) {
        setStatus('ready');
        return;
      }
      setStatus('ready');
    })();
  }, []);

  const handleCreateKey = async () => {
    setStatus('creating');
    setErrorMessage('');
    const result = await createSigningKey();
    if (result.success) {
      setKeyResult(result);
      setStatus('done');
      onNext(result);
      return;
    }
    setErrorMessage(result.message);
    setStatus('error');
  };

  if (status === 'loading' || status === 'checking') {
    return (
      <View style={[styles.container, { maxWidth: width * 0.9 }]}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Checking device...</Text>
      </View>
    );
  }

  if (status === 'no_biometrics') {
    return (
      <View style={[styles.container, { maxWidth: width * 0.9 }]}>
        <Text style={styles.title}>Device not supported</Text>
        <Text style={styles.subtitle}>
          This device does not have biometrics (Touch ID, Face ID, or Android
          Biometrics). PFF requires hardware-backed authentication.
        </Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { maxWidth: width * 0.9 }]}>
      <Text style={styles.title}>Anchor this device</Text>
      <Text style={styles.subtitle}>
        We will create a key in your phone's secure hardware (Secure Enclave /
        Keymaster). It never leaves the device and is protected by{' '}
        {caps?.biometryType ?? 'biometrics'}.
      </Text>

      {caps?.biometryType && (
        <View style={styles.caps}>
          <Text style={styles.capsText}>
            Biometrics: {caps.biometryType} • Secure hardware: available
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onBack}
          disabled={status === 'creating'}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (status === 'creating' || status === 'done') && styles.primaryDisabled,
          ]}
          onPress={handleCreateKey}
          disabled={status === 'creating' || status === 'done'}
          activeOpacity={0.8}
        >
          {status === 'creating' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {status === 'done' ? 'Anchored' : 'Create secure key'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
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
    marginBottom: 20,
  },
  caps: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  capsText: {
    fontSize: 14,
    color: '#475569',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#b91c1c',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
});

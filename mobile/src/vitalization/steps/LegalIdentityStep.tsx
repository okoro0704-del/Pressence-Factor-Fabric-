/**
 * PFF — Vitalization Flow
 * Step 1: Legal identity binding (KYC). Mock form for MVP; wire to provider later.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export interface LegalIdentityForm {
  fullName: string;
  idType: string;
  idNumber: string;
}

interface LegalIdentityStepProps {
  initial?: Partial<LegalIdentityForm>;
  onNext: (data: LegalIdentityForm) => void;
  onBack: () => void;
}

const defaultForm: LegalIdentityForm = {
  fullName: '',
  idType: 'NIN',
  idNumber: '',
};

export function LegalIdentityStep({
  initial,
  onNext,
  onBack,
}: LegalIdentityStepProps): React.JSX.Element {
  const [form, setForm] = useState<LegalIdentityForm>({
    ...defaultForm,
    ...initial,
  });
  const { width } = useWindowDimensions();

  const canProceed =
    form.fullName.trim().length > 0 && form.idNumber.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { maxWidth: width * 0.9 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Legal identity</Text>
        <Text style={styles.subtitle}>
          Link your identity to this device. We never store raw biometrics — only
          a signed proof.
        </Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          value={form.fullName}
          onChangeText={(t) => setForm((p) => ({ ...p, fullName: t }))}
          placeholder="Legal name as on ID"
          placeholderTextColor="#94a3b8"
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Text style={styles.label}>ID type</Text>
        <TextInput
          style={styles.input}
          value={form.idType}
          onChangeText={(t) => setForm((p) => ({ ...p, idType: t }))}
          placeholder="e.g. NIN, BVN, Passport"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>ID number</Text>
        <TextInput
          style={styles.input}
          value={form.idNumber}
          onChangeText={(t) => setForm((p) => ({ ...p, idNumber: t }))}
          placeholder="Your ID number"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          keyboardType="default"
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, !canProceed && styles.primaryDisabled]}
            onPress={() => onNext(form)}
            disabled={!canProceed}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
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
  },
  primaryDisabled: {
    opacity: 0.5,
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

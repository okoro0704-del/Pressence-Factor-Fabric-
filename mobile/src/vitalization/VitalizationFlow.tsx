/**
 * PFF — Vitalization Flow
 * Multi-step onboarding: legal identity → device binding (Secure Enclave key) → complete.
 * Anchors user hardware to legal identity per System Prompt.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { WelcomeStep } from './steps/WelcomeStep';
import { LegalIdentityStep } from './steps/LegalIdentityStep';
import type { LegalIdentityForm } from './steps/LegalIdentityStep';
import { DeviceBindingStep } from './steps/DeviceBindingStep';
import { CompleteStep } from './steps/CompleteStep';
import { StepIndicator } from './StepIndicator';
import type { KeyGenerationResult } from '../pff/types';

const STEP_WELCOME = 0;
const STEP_LEGAL = 1;
const STEP_DEVICE = 2;
const STEP_COMPLETE = 3;

export function VitalizationFlow(): React.JSX.Element {
  const [step, setStep] = useState(STEP_WELCOME);
  const [legalIdentity, setLegalIdentity] = useState<LegalIdentityForm | null>(null);
  const [keyResult, setKeyResult] = useState<KeyGenerationResult | null>(null);

  const handleWelcomeNext = useCallback(() => setStep(STEP_LEGAL), []);
  const handleLegalNext = useCallback((data: LegalIdentityForm) => {
    setLegalIdentity(data);
    setStep(STEP_DEVICE);
  }, []);
  const handleLegalBack = useCallback(() => setStep(STEP_WELCOME), []);
  const handleDeviceNext = useCallback((result: KeyGenerationResult) => {
    setKeyResult(result);
    setStep(STEP_COMPLETE);
  }, []);
  const handleDeviceBack = useCallback(() => setStep(STEP_LEGAL), []);
  const handleFinish = useCallback(() => {
    // TODO: Navigate to main app, store Presence Token, etc.
    setStep(STEP_COMPLETE);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {step < STEP_COMPLETE && (
          <StepIndicator current={step} />
        )}
        <View style={styles.content}>
          {step === STEP_WELCOME && (
            <WelcomeStep onNext={handleWelcomeNext} />
          )}
          {step === STEP_LEGAL && (
            <LegalIdentityStep
              initial={legalIdentity ?? undefined}
              onNext={handleLegalNext}
              onBack={handleLegalBack}
            />
          )}
          {step === STEP_DEVICE && (
            <DeviceBindingStep
              onNext={handleDeviceNext}
              onBack={handleDeviceBack}
            />
          )}
          {step === STEP_COMPLETE && legalIdentity && keyResult && (
            <CompleteStep
              legalIdentity={legalIdentity}
              keyResult={keyResult}
              onFinish={handleFinish}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

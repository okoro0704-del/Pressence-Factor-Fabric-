'use client';

import { useState } from 'react';
import { AccountType, type GlobalIdentity } from '@/lib/phoneIdentity';
import { PresenceScanStep } from './steps/PresenceScanStep';
import { PersonalDetailsStep } from './steps/PersonalDetailsStep';
import { DependentRegistrationStep } from './steps/DependentRegistrationStep';
import { RegistrationCompleteStep } from './steps/RegistrationCompleteStep';
import { FamilyTreeVisualization } from './FamilyTreeVisualization';

interface SteppedRegistrationFlowProps {
  accountType: AccountType;
  title: string;
  subtitle: string;
  onComplete: () => void;
  onCancel: () => void;
  allowDependentRegistration?: boolean;
  guardianPhone?: string;
}

type RegistrationStep = 'scan' | 'details' | 'dependent' | 'complete';

export function SteppedRegistrationFlow({
  accountType,
  title,
  subtitle,
  onComplete,
  onCancel,
  allowDependentRegistration = false,
  guardianPhone,
}: SteppedRegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('scan');
  const [identity, setIdentity] = useState<GlobalIdentity | null>(null);
  const [dependents, setDependents] = useState<GlobalIdentity[]>([]);

  const handleScanComplete = (scannedIdentity: GlobalIdentity) => {
    setIdentity(scannedIdentity);
    setCurrentStep('details');
  };

  const handleDetailsComplete = (updatedIdentity: GlobalIdentity) => {
    setIdentity(updatedIdentity);
    
    if (allowDependentRegistration && accountType === AccountType.SOVEREIGN_OPERATOR) {
      setCurrentStep('dependent');
    } else {
      setCurrentStep('complete');
    }
  };

  const handleDependentAdded = (dependent: GlobalIdentity) => {
    setDependents([...dependents, dependent]);
  };

  const handleDependentSkip = () => {
    setCurrentStep('complete');
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-black mb-2" style={{ color: '#D4AF37' }}>
          {title}
        </h2>
        <p className="text-sm" style={{ color: '#6b6b70' }}>
          {subtitle}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        <StepIndicator 
          number={1} 
          label="Scan Presence" 
          active={currentStep === 'scan'} 
          completed={currentStep !== 'scan'}
        />
        <StepConnector completed={currentStep !== 'scan'} />
        <StepIndicator 
          number={2} 
          label="Personal Details" 
          active={currentStep === 'details'} 
          completed={currentStep === 'dependent' || currentStep === 'complete'}
        />
        {allowDependentRegistration && (
          <>
            <StepConnector completed={currentStep === 'complete'} />
            <StepIndicator 
              number={3} 
              label="Add Dependent (Optional)" 
              active={currentStep === 'dependent'} 
              completed={currentStep === 'complete'}
            />
          </>
        )}
      </div>

      {/* Family Tree Visualization (if identity exists) */}
      {identity && (
        <FamilyTreeVisualization 
          parent={identity} 
          dependents={dependents}
          guardianPhone={guardianPhone}
        />
      )}

      {/* Step Content */}
      <div className="max-w-3xl mx-auto">
        {currentStep === 'scan' && (
          <PresenceScanStep 
            accountType={accountType}
            guardianPhone={guardianPhone}
            onComplete={handleScanComplete}
            onCancel={onCancel}
          />
        )}

        {currentStep === 'details' && identity && (
          <PersonalDetailsStep 
            identity={identity}
            onComplete={handleDetailsComplete}
            onBack={() => setCurrentStep('scan')}
          />
        )}

        {currentStep === 'dependent' && identity && (
          <DependentRegistrationStep 
            parentIdentity={identity}
            onDependentAdded={handleDependentAdded}
            onSkip={handleDependentSkip}
            onComplete={() => setCurrentStep('complete')}
          />
        )}

        {currentStep === 'complete' && identity && (
          <RegistrationCompleteStep 
            identity={identity}
            dependents={dependents}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
          active ? 'scale-110' : ''
        }`}
        style={{
          background: active || completed 
            ? 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)' 
            : '#16161a',
          color: active || completed ? '#0d0d0f' : '#6b6b70',
          border: active ? '3px solid #D4AF37' : '2px solid #2a2a2e',
          boxShadow: active ? '0 0 30px rgba(212, 175, 55, 0.5)' : 'none'
        }}
      >
        {completed ? '✓' : number}
      </div>
      <p className="text-xs font-medium" style={{ color: active ? '#D4AF37' : '#6b6b70' }}>
        {label}
      </p>
    </div>
  );
}

// Step Connector Component
function StepConnector({ completed }: { completed: boolean }) {
  return (
    <div 
      className="h-1 w-16 rounded-full transition-all duration-300"
      style={{
        background: completed 
          ? 'linear-gradient(90deg, #D4AF37 0%, #c9a227 100%)' 
          : '#2a2a2e'
      }}
    />
  );
}


'use client';

import { useState } from 'react';
import { AccountType, type GlobalIdentity, generateIdentityHash, validatePhoneNumber } from '@/lib/phoneIdentity';
import { resolveSovereignByPresence, AuthStatus } from '@/lib/biometricAuth';

interface DependentRegistrationStepProps {
  parentIdentity: GlobalIdentity;
  onDependentAdded: (dependent: GlobalIdentity) => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function DependentRegistrationStep({
  parentIdentity,
  onDependentAdded,
  onSkip,
  onComplete
}: DependentRegistrationStepProps) {
  const [showForm, setShowForm] = useState(false);
  const [dependentName, setDependentName] = useState('');
  const [dependentPhone, setDependentPhone] = useState('');
  const [dependentDOB, setDependentDOB] = useState('');
  const [scanning, setScanning] = useState(false);
  const [addedDependents, setAddedDependents] = useState<GlobalIdentity[]>([]);

  const handleAddDependent = async () => {
    if (!validatePhoneNumber(dependentPhone)) {
      alert('Invalid phone number. Use E.164 with country code (e.g., +1 202 555 0123)');
      return;
    }

    if (!dependentName.trim()) {
      alert('Please enter dependent name');
      return;
    }

    if (!dependentDOB) {
      alert('Please enter date of birth');
      return;
    }

    // Validate DOB is not in the future
    const today = new Date();
    const dob = new Date(dependentDOB);
    if (dob > today) {
      alert('Date of birth cannot be in the future');
      return;
    }

    setScanning(true);

    // Simulate 4-layer scan for dependent
    const authResult = await resolveSovereignByPresence((layer, status) => {
      // Progress callback
    });

    setScanning(false);

    if (authResult.success) {
      // Calculate age
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      const dependent: GlobalIdentity = {
        id: crypto.randomUUID(),
        phone_number: dependentPhone,
        global_identity_hash: await generateIdentityHash(dependentPhone),
        account_type: AccountType.DEPENDENT,
        full_name: dependentName.trim(),
        date_of_birth: dependentDOB,
        age_years: age,
        guardian_phone: parentIdentity.phone_number, // KEY: Link to parent
        linked_bank_accounts: [],
        vida_balance: 0,
        spendable_vida: 0,
        locked_vida: 0,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        status: 'ACTIVE',
      };

      onDependentAdded(dependent);
      setAddedDependents([...addedDependents, dependent]);

      // Reset form
      setDependentName('');
      setDependentPhone('');
      setDependentDOB('');
      setShowForm(false);
    } else {
      alert('Biometric scan failed. Please try again.');
    }
  };

  return (
    <div 
      className="rounded-xl border p-8"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        boxShadow: '0 0 30px rgba(212, 175, 55, 0.1)'
      }}
    >
      <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: '#D4AF37' }}>
        Step 3: Add Dependent (Optional)
      </h3>

      <p className="text-sm text-center mb-8" style={{ color: '#6b6b70' }}>
        Add dependents (children, elderly) to {parentIdentity.full_name}'s account. 
        Each dependent will be cryptographically linked to this parent.
      </p>

      {/* Added Dependents List */}
      {addedDependents.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>
            Added Dependents ({addedDependents.length})
          </p>
          {addedDependents.map((dep) => (
            <div 
              key={dep.id}
              className="rounded-lg border p-3"
              style={{
                background: 'rgba(0, 127, 255, 0.1)',
                borderColor: '#007FFF'
              }}
            >
              <p className="font-bold text-sm" style={{ color: '#007FFF' }}>
                {dep.full_name}
              </p>
              <p className="text-xs" style={{ color: '#6b6b70' }}>
                {dep.phone_number}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Dependent Form */}
      {showForm ? (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
              Dependent Name
            </label>
            <input
              type="text"
              value={dependentName}
              onChange={(e) => setDependentName(e.target.value)}
              placeholder="Enter dependent name"
              className="w-full px-4 py-3 rounded-lg text-sm"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '2px solid #2a2a2e',
                color: '#ffffff',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
              Dependent Phone Number
            </label>
            <input
              type="tel"
              value={dependentPhone}
              onChange={(e) => setDependentPhone(e.target.value)}
              placeholder="+1 202 555 0123"
              className="w-full px-4 py-3 rounded-lg font-mono text-sm"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '2px solid #2a2a2e',
                color: '#ffffff',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
              Date of Birth
            </label>
            <input
              type="date"
              value={dependentDOB}
              onChange={(e) => setDependentDOB(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg font-mono text-sm"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '2px solid #2a2a2e',
                color: '#ffffff',
                outline: 'none'
              }}
            />
            <p className="text-xs mt-1" style={{ color: '#6b6b70' }}>
              Required for age-based auto-promotion at 18 years
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 rounded-lg font-bold text-sm"
              style={{
                background: '#16161a',
                color: '#6b6b70',
                border: '2px solid #2a2a2e'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddDependent}
              disabled={scanning}
              className="flex-1 px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #007FFF 0%, #0066CC 100%)',
                color: '#ffffff'
              }}
            >
              {scanning ? 'Scanning...' : 'Scan & Add'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider mb-6 transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #007FFF 0%, #0066CC 100%)',
            color: '#ffffff',
            boxShadow: '0 0 20px rgba(0, 127, 255, 0.3)'
          }}
        >
          + Add Another Dependent
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onSkip}
          className="px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300"
          style={{
            background: '#16161a',
            color: '#6b6b70',
            border: '2px solid #2a2a2e'
          }}
        >
          Skip
        </button>
        <button
          onClick={onComplete}
          className="px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
            color: '#0d0d0f',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}


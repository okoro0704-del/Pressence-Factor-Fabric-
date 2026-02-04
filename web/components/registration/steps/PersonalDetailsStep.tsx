'use client';

import { useState } from 'react';
import { type GlobalIdentity, validatePhoneNumber } from '@/lib/phoneIdentity';

interface PersonalDetailsStepProps {
  identity: GlobalIdentity;
  onComplete: (updatedIdentity: GlobalIdentity) => void;
  onBack: () => void;
}

export function PersonalDetailsStep({ identity, onComplete, onBack }: PersonalDetailsStepProps) {
  const [phoneNumber, setPhoneNumber] = useState(identity.phone_number);
  const [fullName, setFullName] = useState(identity.full_name);
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; name?: string }>({});

  const handleSubmit = () => {
    const newErrors: { phone?: string; name?: string } = {};

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phone = 'Invalid phone number. Use E.164 format (e.g., +2348012345678)';
    }

    // Validate full name
    if (!fullName || fullName.trim().length < 2) {
      newErrors.name = 'Please enter a valid full name';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update identity with collected details
    const updatedIdentity: GlobalIdentity = {
      ...identity,
      phone_number: phoneNumber,
      full_name: fullName.trim(),
      linked_bank_accounts: bankAccount ? [bankAccount] : [],
    };

    onComplete(updatedIdentity);
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
        Step 2: Personal Details
      </h3>

      <div className="space-y-6 mb-8">
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
            Phone Number (Global Identity Link) *
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+2348012345678"
            className="w-full px-4 py-3 rounded-lg font-mono text-sm"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: errors.phone ? '2px solid #ef4444' : '2px solid #2a2a2e',
              color: '#ffffff',
              outline: 'none'
            }}
          />
          {errors.phone && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
              {errors.phone}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: '#6b6b70' }}>
            This will be your unique identifier across the PFF system
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
            Full Name *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter full name"
            className="w-full px-4 py-3 rounded-lg text-sm"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: errors.name ? '2px solid #ef4444' : '2px solid #2a2a2e',
              color: '#ffffff',
              outline: 'none'
            }}
          />
          {errors.name && (
            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Bank Account (Optional) */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
            Bank Account Number (Optional)
          </label>
          <input
            type="text"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            placeholder="0123456789"
            className="w-full px-4 py-3 rounded-lg font-mono text-sm"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '2px solid #2a2a2e',
              color: '#ffffff',
              outline: 'none'
            }}
          />
        </div>

        {/* Bank Name (Optional) */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>
            Bank Name (Optional)
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-sm"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '2px solid #2a2a2e',
              color: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="">Select bank</option>
            <option value="PFF_PARTNER">PFF Partner Bank (United Bank for Africa)</option>
            <option value="GTBank">Guaranty Trust Bank</option>
            <option value="Access Bank">Access Bank</option>
            <option value="First Bank">First Bank of Nigeria</option>
            <option value="Zenith Bank">Zenith Bank</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-300"
          style={{
            background: '#16161a',
            color: '#6b6b70',
            border: '2px solid #2a2a2e'
          }}
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
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


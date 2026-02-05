'use client';

import { useState } from 'react';
import { registerDependent, validatePhoneNumber } from '@/lib/phoneIdentity';

interface RegisterDependentModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardianPhone: string;
}

export function RegisterDependentModal({ isOpen, onClose, guardianPhone }: RegisterDependentModalProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Invalid phone number. Use E.164 format (e.g., +2348012345678)');
      setLoading(false);
      return;
    }

    // Validate date of birth
    if (!dateOfBirth) {
      setError('Date of birth is required');
      setLoading(false);
      return;
    }

    // Ensure DOB is not in the future
    const today = new Date();
    const dob = new Date(dateOfBirth);
    if (dob > today) {
      setError('Date of birth cannot be in the future');
      setLoading(false);
      return;
    }

    // Register dependent with date of birth
    const result = await registerDependent(phoneNumber, fullName, guardianPhone, dateOfBirth);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFullName('');
        setPhoneNumber('');
        setDateOfBirth('');
      }, 2000);
    } else {
      setError('Failed to register dependent. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-[#16161a] rounded-2xl p-8 border-2 border-[#3b82f6]/50 max-w-md w-full mx-4 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b6b70] hover:text-[#f5f5f5] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="width" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 className="text-2xl font-bold text-[#3b82f6] mb-2">Register Dependent</h2>
          <p className="text-sm text-[#6b6b70]">
            Add a family member or elderly relative to your protocol
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-sm text-green-400 text-center font-semibold">
              ✓ Dependent registered successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-[#6b6b70] mb-2 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-4 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#f5f5f5] text-lg font-semibold focus:border-[#3b82f6] focus:outline-none transition-colors"
              placeholder="e.g., Mama Ngozi"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-[#6b6b70] mb-2 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full px-4 py-4 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#f5f5f5] text-lg font-mono focus:border-[#3b82f6] focus:outline-none transition-colors"
              placeholder="+2348012345678"
            />
            <p className="text-xs text-[#6b6b70] mt-2">
              Use E.164 format with country code (e.g., +234 for Nigeria)
            </p>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-semibold text-[#6b6b70] mb-2 uppercase tracking-wider">
              Date of Birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]} // Cannot be future date
              className="w-full px-4 py-4 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#f5f5f5] text-lg font-mono focus:border-[#3b82f6] focus:outline-none transition-colors"
            />
            <p className="text-xs text-[#6b6b70] mt-2">
              Required for age-based auto-promotion to Sovereign at 18 years
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg p-4">
            <p className="text-xs text-[#6b6b70] leading-relaxed">
              <span className="font-bold text-[#3b82f6]">Simplified Interface:</span> Dependents get a 
              high-contrast, large-button interface with "Request Payout" and "Current Balance" features. 
              You will oversee their account security.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#3b82f6] text-white font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#3b82f6]/20"
          >
            {loading ? 'Registering...' : '✓ Register Dependent'}
          </button>
        </form>
      </div>
    </div>
  );
}


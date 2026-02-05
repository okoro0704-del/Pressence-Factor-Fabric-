'use client';

import { useState, useEffect } from 'react';
import { getIdentityAnchorPhone } from '@/lib/sentinelActivation';
import {
  getBiometricStrictness,
  setBiometricStrictness,
  strictnessToConfig,
  type BiometricStrictness,
} from '@/lib/biometricStrictness';

const GOLD = '#D4AF37';
const BORDER = 'rgba(212, 175, 55, 0.3)';

export function BiometricStrictnessSlider() {
  const [strictness, setStrictness] = useState<BiometricStrictness>('low');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const phone = getIdentityAnchorPhone();

  useEffect(() => {
    if (!phone?.trim()) {
      setLoading(false);
      return;
    }
    getBiometricStrictness(phone).then((s) => {
      setStrictness(s);
      setLoading(false);
    });
  }, [phone]);

  const handleChange = async (value: BiometricStrictness) => {
    setStrictness(value);
    setMessage(null);
    if (!phone?.trim()) return;
    setSaving(true);
    const result = await setBiometricStrictness(phone, value);
    setSaving(false);
    if (result.ok) {
      setMessage('Saved. Applies on all your devices.');
    } else {
      setMessage(result.error ?? 'Failed to save');
    }
  };

  const config = strictnessToConfig(strictness);

  if (loading) {
    return (
      <div className="rounded-xl border p-4" style={{ borderColor: BORDER, background: 'rgba(13,13,15,0.8)' }}>
        <p className="text-sm text-[#6b6b70]">Loading Biometric Strictness…</p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border p-5" style={{ borderColor: BORDER, background: 'rgba(13,13,15,0.8)' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: GOLD }}>
        Biometric Strictness
      </h2>
      <p className="text-xs text-[#6b6b70] mb-4">
        Low = High Speed (reduced lighting, faster match). High = Maximum Security (strict verification, lighting required).
      </p>

      <div className="flex items-center gap-4 mb-2">
        <span className="text-xs text-[#6b6b70] shrink-0">High Speed</span>
        <input
          type="range"
          min={0}
          max={1}
          step={1}
          value={strictness === 'high' ? 1 : 0}
          onChange={(e) => handleChange(e.target.value === '1' ? 'high' : 'low')}
          disabled={saving || !phone}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[#D4AF37]"
          style={{ background: 'linear-gradient(to right, #3b82f6, #D4AF37)' }}
          aria-label="Biometric Strictness"
        />
        <span className="text-xs text-[#6b6b70] shrink-0">Maximum Security</span>
      </div>

      <div className="flex justify-between text-xs mt-1">
        <span className={strictness === 'low' ? 'font-semibold' : ''} style={{ color: strictness === 'low' ? GOLD : '#6b6b70' }}>
          High Speed
        </span>
        <span className={strictness === 'high' ? 'font-semibold' : ''} style={{ color: strictness === 'high' ? GOLD : '#6b6b70' }}>
          Maximum Security
        </span>
      </div>

      <p className="text-[11px] text-[#6b6b70] mt-3">
        Current: confidence threshold {config.confidenceThreshold}, brightness check {config.enforceBrightnessCheck ? 'on' : 'off'}.
      </p>
      {message && (
        <p className={`text-xs mt-2 ${message.startsWith('Saved') ? 'text-emerald-400' : 'text-amber-400'}`}>
          {message}
        </p>
      )}
    </section>
  );
}

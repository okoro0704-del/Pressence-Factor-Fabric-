'use client';

import { useState } from 'react';
import { submitPartnerApplication } from '@/lib/partnerApplication';

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.7)';
const BG = 'rgba(0,0,0,0.5)';
const BORDER = 'rgba(212, 175, 55, 0.3)';

const INDUSTRIES = [
  'Banking & Finance',
  'Healthcare',
  'Government & Public Sector',
  'Retail & E‑commerce',
  'Telecommunications',
  'Energy & Utilities',
  'Education',
  'Logistics & Supply Chain',
  'Technology & SaaS',
  'Other',
];

export function PartnerApplication() {
  const [step, setStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [integrationIntent, setIntegrationIntent] = useState('');
  const [consentRoyalty, setConsentRoyalty] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceedStep1 =
    companyName.trim().length > 0 &&
    industry.length > 0 &&
    integrationIntent.trim().length > 0;
  const canSubmit = consentRoyalty && consentPrivacy && canProceedStep1;

  const handleNext = () => {
    setError(null);
    if (step === 1 && canProceedStep1) setStep(2);
  };

  const handleBack = () => {
    setError(null);
    if (step === 2) setStep(1);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    const result = await submitPartnerApplication({
      company_name: companyName.trim(),
      industry,
      integration_intent: integrationIntent.trim(),
      consent_royalty: consentRoyalty,
      consent_privacy: consentPrivacy,
    });
    setSubmitting(false);
    if (result.ok) {
      setSuccess(true);
    } else {
      setError(result.error ?? 'Submission failed');
    }
  };

  if (success) {
    return (
      <div
        className="rounded-xl border p-8 max-w-lg mx-auto"
        style={{ background: BG, borderColor: BORDER }}
      >
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)' }}
          >
            ✓
          </div>
        </div>
        <h2 className="text-xl font-semibold text-center mb-3" style={{ color: GOLD }}>
          Success
        </h2>
        <p className="text-center text-sm" style={{ color: GOLD_DIM }}>
          Your application has been broadcast to the Foundation. Review takes 48–72 hours.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-6 sm:p-8 max-w-lg mx-auto"
      style={{ background: BG, borderColor: BORDER }}
    >
      <h2 className="text-xl font-semibold mb-6" style={{ color: GOLD }}>
        Partner Application — Join the PFF Network
      </h2>

      {step === 1 && (
        <>
          <div className="space-y-4 mb-6">
            <label className="block">
              <span className="block text-sm mb-1" style={{ color: GOLD_DIM }}>
                Company Name *
              </span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-2 rounded border bg-black/40 text-white placeholder:opacity-50"
                style={{ borderColor: BORDER }}
              />
            </label>
            <label className="block">
              <span className="block text-sm mb-1" style={{ color: GOLD_DIM }}>
                Industry *
              </span>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 rounded border bg-black/40 text-white"
                style={{ borderColor: BORDER }}
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm mb-1" style={{ color: GOLD_DIM }}>
                Integration Intent *
              </span>
              <textarea
                value={integrationIntent}
                onChange={(e) => setIntegrationIntent(e.target.value)}
                placeholder="Describe how you plan to integrate with the PFF Network (e.g. identity verification, payments, presence protocol)."
                rows={4}
                className="w-full px-3 py-2 rounded border bg-black/40 text-white placeholder:opacity-50 resize-y"
                style={{ borderColor: BORDER }}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceedStep1}
              className="px-4 py-2 rounded font-medium disabled:opacity-50"
              style={{
                background: canProceedStep1 ? GOLD : 'rgba(212,175,55,0.3)',
                color: canProceedStep1 ? '#0d0d0f' : GOLD_DIM,
              }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="space-y-4 mb-6">
            <div className="rounded-lg border p-3 text-sm" style={{ borderColor: BORDER, color: GOLD_DIM }}>
              <div><strong style={{ color: GOLD }}>{companyName}</strong> · {industry}</div>
              <div className="mt-1 opacity-80">{integrationIntent.slice(0, 120)}{integrationIntent.length > 120 ? '…' : ''}</div>
            </div>
            <p className="text-sm" style={{ color: GOLD_DIM }}>
              To submit, you must accept the following:
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentRoyalty}
                onChange={(e) => setConsentRoyalty(e.target.checked)}
                className="mt-1 rounded border-2"
                style={{ accentColor: GOLD }}
              />
              <span className="text-sm" style={{ color: GOLD_DIM }}>
                I agree to the <strong style={{ color: GOLD }}>2% Worldwide User-Revenue Royalty</strong> to the PFF Foundation.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentPrivacy}
                onChange={(e) => setConsentPrivacy(e.target.checked)}
                className="mt-1 rounded border-2"
                style={{ accentColor: GOLD }}
              />
              <span className="text-sm" style={{ color: GOLD_DIM }}>
                I accept the <strong style={{ color: GOLD }}>Sovereign Privacy Agreement</strong> — handling of identity and presence data as defined by the Foundation.
              </span>
            </label>
          </div>
          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded font-medium border"
              style={{ borderColor: BORDER, color: GOLD_DIM }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="px-4 py-2 rounded font-medium disabled:opacity-50"
              style={{
                background: canSubmit && !submitting ? GOLD : 'rgba(212,175,55,0.3)',
                color: canSubmit && !submitting ? '#0d0d0f' : GOLD_DIM,
              }}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

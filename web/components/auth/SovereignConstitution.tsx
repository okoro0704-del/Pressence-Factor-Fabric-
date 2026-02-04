'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { resolveSovereignByPresence, AuthLayer, AuthStatus } from '@/lib/biometricAuth';
import { recordConstitutionSignature, CURRENT_CONSTITUTION_VERSION } from '@/lib/legalApprovals';
import { getCurrentUserRole } from '@/lib/roleAuth';
import { ARTICLES_OF_THE_MESH, CONSTITUTION_PREAMBLE } from '@/data/articlesOfTheMesh';
import { FileSignature, Loader2 } from 'lucide-react';

const GOLD = '#D4AF37';
const GOLD_TRIM = 'rgba(212, 175, 55, 0.6)';
const PARCHMENT = '#f4e4bc';
const PARCHMENT_DARK = '#e8d4a0';
const INK = '#2c2416';

export interface SovereignConstitutionProps {
  identityAnchorPhone: string;
  onAccept: () => void | Promise<void>;
  /** Optional: skip voice layer (e.g. elder/minor). */
  skipVoiceLayer?: boolean;
}

/**
 * Sovereign Constitution Entry Gate.
 * Displays the Articles of the Mesh in a Legal Scroll format.
 * Replaces standard "I Agree" with Biometric Signature; 10 VIDA minting only after signature is recorded.
 */
export function SovereignConstitution({
  identityAnchorPhone,
  onAccept,
  skipVoiceLayer = false,
}: SovereignConstitutionProps) {
  const [signing, setSigning] = useState(false);
  const [layer, setLayer] = useState<AuthLayer | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  /** State Consent checkbox — shown only for GOVERNMENT_ADMIN (and MASTER_ARCHITECT). */
  const [showStateConsent, setShowStateConsent] = useState(false);
  const [stateConsentChecked, setStateConsentChecked] = useState(false);
  const biometricPendingRef = useRef(false);

  useEffect(() => {
    if (!identityAnchorPhone?.trim()) return;
    getCurrentUserRole(identityAnchorPhone.trim()).then((role) => {
      const isGovAdmin = role === 'GOVERNMENT_ADMIN' || role === 'MASTER_ARCHITECT';
      setShowStateConsent(isGovAdmin);
    });
  }, [identityAnchorPhone]);

  const handleBiometricSignature = async () => {
    if (!identityAnchorPhone?.trim()) {
      setError('Identity Anchor is required.');
      return;
    }
    if (biometricPendingRef.current) return;
    biometricPendingRef.current = true;
    setError(null);
    setSigning(true);
    setLayer(null);
    setStatus(AuthStatus.SCANNING);
    try {
      const result = await resolveSovereignByPresence(
        identityAnchorPhone.trim(),
        (l, s) => {
          setLayer(l ?? null);
          setStatus(s);
        },
        { skipVoiceLayer, requireAllLayers: false }
      );
      if (!result.success) {
        setError(result.errorMessage ?? 'Biometric verification failed. Please try again.');
        setStatus(AuthStatus.FAILED);
        return;
      }
      const recorded = await recordConstitutionSignature(
        identityAnchorPhone.trim(),
        CURRENT_CONSTITUTION_VERSION
      );
      if (!recorded.ok) {
        setError(recorded.error ?? 'Failed to record signature.');
        setStatus(AuthStatus.FAILED);
        return;
      }
      setStatus(AuthStatus.IDENTIFIED);
      await onAccept();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed.');
      setStatus(AuthStatus.FAILED);
    } finally {
      setSigning(false);
      setLayer(null);
      biometricPendingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1510]">
      {/* Parchment-style Legal Scroll with gold trim */}
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden border-4 shadow-2xl"
        style={{
          background: `linear-gradient(180deg, ${PARCHMENT} 0%, ${PARCHMENT_DARK} 100%)`,
          borderColor: GOLD_TRIM,
          boxShadow: `0 0 0 2px ${GOLD_TRIM}, 0 20px 60px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Gold header band */}
        <div
          className="py-3 px-6 text-center border-b-2 shrink-0"
          style={{ borderColor: GOLD_TRIM, background: 'rgba(212, 175, 55, 0.2)' }}
        >
          <h1
            className="text-lg font-bold uppercase tracking-widest"
            style={{ color: INK }}
          >
            Articles of the Mesh
          </h1>
          <p className="text-xs mt-1" style={{ color: '#5c4d3a' }}>
            Sovereign Constitution · Version {CURRENT_CONSTITUTION_VERSION}
          </p>
        </div>

        {/* Scrollable body — formal Legal Scroll format */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ color: INK }}>
          <p className="text-sm italic leading-relaxed border-l-4 pl-4" style={{ borderColor: GOLD }}>
            {CONSTITUTION_PREAMBLE}
          </p>
          {ARTICLES_OF_THE_MESH.map((article) => (
            <section key={article.number} className="space-y-1">
              <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: GOLD }}>
                Article {article.number}: {article.title}
              </h2>
              <p className="text-sm leading-relaxed">{article.body}</p>
            </section>
          ))}
        </div>

        {/* Gold footer band — Biometric Signature */}
        <div
          className="p-6 border-t-2 shrink-0 space-y-4"
          style={{ borderColor: GOLD_TRIM, background: 'rgba(212, 175, 55, 0.08)' }}
        >
          {showStateConsent && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stateConsentChecked}
                onChange={(e) => setStateConsentChecked(e.target.checked)}
                className="w-4 h-4 rounded border-2 accent-[#D4AF37]"
                style={{ borderColor: GOLD_TRIM }}
              />
              <span className="text-sm" style={{ color: INK }}>
                I attest State Consent as GOVERNMENT_ADMIN (or MASTER_ARCHITECT) to the Sovereign Constitution.
              </span>
            </label>
          )}
          <p className="text-xs text-center" style={{ color: '#5c4d3a' }}>
            Acceptance is recorded only after 3-of-4 Biometric verification. Your signature and timestamp are stored in the legal ledger.
          </p>
          {error && (
            <div
              className="py-2 px-4 rounded text-sm text-center"
              style={{ background: 'rgba(220, 38, 38, 0.15)', color: '#b91c1c' }}
            >
              {error}
            </div>
          )}
          <motion.button
            type="button"
            onClick={handleBiometricSignature}
            disabled={signing || (showStateConsent && !stateConsentChecked)}
            className="w-full min-h-[48px] py-4 px-6 rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all disabled:opacity-70 touch-manipulation"
            style={{
              background: signing ? 'rgba(212, 175, 55, 0.5)' : `linear-gradient(135deg, ${GOLD}, #C9A227)`,
              color: '#1a1510',
              border: `2px solid ${GOLD_TRIM}`,
              boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {signing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {status === AuthStatus.SCANNING && layer
                  ? `Verifying ${layer.replace(/_/g, ' ')}…`
                  : 'Verifying…'}
              </>
            ) : (
              <>
                <FileSignature className="w-5 h-5" />
                Biometric Signature — Accept Constitution
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

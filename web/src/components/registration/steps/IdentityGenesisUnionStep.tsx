'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { type GlobalIdentity } from '@/lib/phoneIdentity';
import { ensureDeviceId } from '@/lib/deviceId';
import { getFaceHashFromSession, setFaceHashInSession, sha256FromUint8Array } from '@/lib/biometricAnchorSync';
import {
  executeIdentityUnionPipeline,
  deriveBiometricMathematicalFeatures,
  isIdentityUnionConflict,
} from '@/lib/identityUnionPipeline';
import { SentinelApiError } from '@/lib/sentinel/client';
import { PalmPulseCapture } from '@/components/auth/PalmPulseCapture';
import { ArchitectVisionCapture } from '@/components/auth/ArchitectVisionCapture';

const panelStyle: CSSProperties = {
  background: 'rgba(0, 0, 0, 0.6)',
  borderColor: 'rgba(212, 175, 55, 0.3)',
  boxShadow: '0 0 30px rgba(212, 175, 55, 0.1)',
};

function Panel({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-xl border p-8 ${className}`} style={{ ...panelStyle, ...style }}>
      {children}
    </div>
  );
}


export interface IdentityGenesisUnionStepProps {
  identity: GlobalIdentity;
  bvn: string;
  onComplete: (result: { citizenId: string; unionSealedAt: string }) => void;
  onBack: () => void;
}

export function IdentityGenesisUnionStep({
  identity,
  bvn,
  onComplete,
  onBack,
}: IdentityGenesisUnionStepProps) {
  const phoneNumber = identity.phone_number.trim();

  const [faceHash, setFaceHash] = useState<string | null>(null);
  const [palmHash, setPalmHash] = useState<string | null>(null);
  const [palmOpen, setPalmOpen] = useState(false);
  const [faceOpen, setFaceOpen] = useState(false);
  const [faceVerifySuccess, setFaceVerifySuccess] = useState<boolean | null>(null);
  const pendingFaceBlobRef = useRef<Blob | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  useEffect(() => {
    const fromSession = getFaceHashFromSession(phoneNumber);
    if (fromSession && /^[0-9a-f]{64}$/i.test(fromSession)) {
      setFaceHash(fromSession.toLowerCase());
    }
  }, [phoneNumber]);

  const finalizeFaceFromBlob = useCallback(
    async (blob: Blob) => {
      const buf = await blob.arrayBuffer();
      const hash = await sha256FromUint8Array(new Uint8Array(buf));
      setFaceHash(hash);
      setFaceHashInSession(phoneNumber, hash);
    },
    [phoneNumber]
  );

  const handleSealUnion = async () => {
    setError(null);
    setShowConflictModal(false);

    if (!bvn.trim() || bvn.trim().length < 10) {
      setError('A valid BVN is required before sealing the identity union.');
      return;
    }
    if (!faceHash && !palmHash) {
      setError('Capture at least one biometric pillar (face or palm) before sealing.');
      return;
    }

    setLoading(true);
    try {
      const biometricMathematicalFeatures = await deriveBiometricMathematicalFeatures({
        faceHash: faceHash ?? undefined,
        palmHash: palmHash ?? undefined,
      });

      const result = await executeIdentityUnionPipeline({
        phoneNumber,
        bvn: bvn.trim(),
        biometricMathematicalFeatures,
        deviceRawIdentifier: ensureDeviceId(),
      });

      onComplete({
        citizenId: result.citizenId,
        unionSealedAt: result.unionSealedAt,
      });
    } catch (err) {
      if (isIdentityUnionConflict(err)) {
        setShowConflictModal(true);
        return;
      }
      if (err instanceof SentinelApiError) {
        setError(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : 'Identity union failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Panel>
        <h3 className="text-2xl font-bold mb-2 text-center" style={{ color: '#D4AF37' }}>
          Seal Identity Union
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: '#6b6b70' }}>
          Genesis registration, anchor staging, and hardware enclave attestation against PFF Express.
        </p>

        <div className="space-y-3 mb-6 text-sm font-mono" style={{ color: '#a0a0a5' }}>
          <p>
            <span style={{ color: '#D4AF37' }}>Anchor:</span> {phoneNumber}
          </p>
          <p>
            <span style={{ color: '#D4AF37' }}>Device:</span> {ensureDeviceId()}
          </p>
          <p>
            <span style={{ color: '#D4AF37' }}>Face hash:</span>{' '}
            {faceHash ? `${faceHash.slice(0, 12)}…` : 'Not captured'}
          </p>
          <p>
            <span style={{ color: '#D4AF37' }}>Palm hash:</span>{' '}
            {palmHash ? `${palmHash.slice(0, 12)}…` : 'Not captured'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <button
            type="button"
            onClick={() => {
              setFaceVerifySuccess(null);
              pendingFaceBlobRef.current = null;
              setFaceOpen(true);
            }}
            className="px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider"
            style={{
              background: faceHash
                ? 'rgba(212, 175, 55, 0.15)'
                : 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
              color: faceHash ? '#D4AF37' : '#0d0d0f',
              border: '2px solid rgba(212, 175, 55, 0.4)',
            }}
          >
            {faceHash ? 'Re-scan Face' : 'Architect Vision (Face)'}
          </button>
          <button
            type="button"
            onClick={() => setPalmOpen(true)}
            className="px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider"
            style={{
              background: palmHash ? 'rgba(212, 175, 55, 0.15)' : '#16161a',
              color: '#D4AF37',
              border: '2px solid rgba(212, 175, 55, 0.4)',
            }}
          >
            {palmHash ? 'Re-scan Palm' : 'Palm Pulse (Vascular)'}
          </button>
        </div>

        {error && (
          <div
            className="rounded-lg border p-4 mb-4"
            style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}
          >
            <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
              {error}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            style={{ background: '#16161a', color: '#6b6b70', border: '2px solid #2a2a2e' }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSealUnion}
            disabled={loading}
            className="px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider disabled:opacity-50 hover:scale-105 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
              color: '#0d0d0f',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
            }}
          >
            {loading ? 'Sealing union…' : 'Execute identity union'}
          </button>
        </div>
      </Panel>

      <PalmPulseCapture
        isOpen={palmOpen}
        onClose={() => setPalmOpen(false)}
        onSuccess={(hash) => {
          setPalmHash(hash);
          setPalmOpen(false);
        }}
        onError={(msg) => setError(msg)}
      />

      <ArchitectVisionCapture
        isOpen={faceOpen}
        onClose={() => {
          setFaceOpen(false);
          setFaceVerifySuccess(null);
          pendingFaceBlobRef.current = null;
        }}
        verificationSuccess={faceVerifySuccess}
        onReadyForVerify={(blob) => {
          if (blob) pendingFaceBlobRef.current = blob;
        }}
        onForceCompleteRequest={() => setFaceVerifySuccess(true)}
        forceCompleteAfterLivenessMs={1500}
        enableArchitectBypass
        isMasterArchitectInit
        onComplete={async () => {
          const blob = pendingFaceBlobRef.current;
          if (blob) {
            try {
              await finalizeFaceFromBlob(blob);
            } catch {
              setError('Failed to derive face biometric hash from capture.');
            }
          }
          setFaceOpen(false);
          setFaceVerifySuccess(null);
          pendingFaceBlobRef.current = null;
        }}
        closeLabel="Cancel"
      />

      {showConflictModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.85)' }}
          role="alertdialog"
          aria-labelledby="conflict-title"
          aria-describedby="conflict-desc"
        >
          <Panel className="max-w-md w-full border-2" style={{ borderColor: '#D4AF37' }}>
            <h4 id="conflict-title" className="text-xl font-black mb-3 text-center" style={{ color: '#D4AF37' }}>
              Ledger binding conflict
            </h4>
            <p id="conflict-desc" className="text-sm text-center mb-6" style={{ color: '#c9c9ce' }}>
              This profile or physical device is already bound to a network ledger node.
            </p>
            <button
              type="button"
              onClick={() => setShowConflictModal(false)}
              className="w-full py-3 rounded-lg font-bold text-sm uppercase"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #c9a227 100%)',
                color: '#0d0d0f',
              }}
            >
              Understood
            </button>
          </Panel>
        </div>
      )}
    </>
  );
}

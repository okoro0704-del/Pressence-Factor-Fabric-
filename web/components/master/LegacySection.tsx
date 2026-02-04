'use client';

import { useState, useEffect } from 'react';
import {
  listLegacyBeneficiaries,
  setPrimaryBeneficiary,
  setSecondaryBeneficiary,
  getProofOfLifeStatus,
  PROOF_OF_LIFE_DAYS,
  PRESENCE_CHECK_GRACE_DAYS,
  type LegacyBeneficiary,
  type BeneficiaryRank,
} from '@/lib/legacyBeneficiaries';
import { maskPhoneForDisplay } from '@/lib/phoneMask';

const SOFT_GOLD = '#c9a227';
const GOLD_BORDER = 'rgba(201, 162, 39, 0.35)';
const GOLD_BG = 'rgba(201, 162, 39, 0.06)';

interface LegacySectionProps {
  ownerIdentityAnchor: string;
  ownerDisplayName?: string;
}

export function LegacySection({ ownerIdentityAnchor, ownerDisplayName }: LegacySectionProps) {
  const [beneficiaries, setBeneficiaries] = useState<LegacyBeneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [proofOfLife, setProofOfLife] = useState<{ daysSince: number | null; shouldSendCheck: boolean; shouldActivate: boolean } | null>(null);
  const [editAnchor, setEditAnchor] = useState<Partial<Record<BeneficiaryRank, string>>>({});
  const [editName, setEditName] = useState<Partial<Record<BeneficiaryRank, string>>>({});

  const load = async () => {
    if (!ownerIdentityAnchor) return;
    setLoading(true);
    const list = await listLegacyBeneficiaries(ownerIdentityAnchor);
    if (list.ok) setBeneficiaries(list.beneficiaries);
    setLoading(false);
    const status = await getProofOfLifeStatus(ownerIdentityAnchor);
    if (status.ok) {
      setProofOfLife({
        daysSince: status.status.daysSinceVerification,
        shouldSendCheck: status.status.shouldSendPresenceCheck,
        shouldActivate: status.status.shouldActivateInheritance,
      });
    }
  };

  useEffect(() => {
    load();
  }, [ownerIdentityAnchor]);

  const getByRank = (rank: BeneficiaryRank) => beneficiaries.find((b) => b.rank === rank);
  const primary = getByRank('primary');
  const secondary1 = getByRank('secondary_1');
  const secondary2 = getByRank('secondary_2');

  const handleSave = async (rank: BeneficiaryRank, anchor: string, displayName?: string) => {
    if (!ownerIdentityAnchor || !anchor.trim()) {
      setMessage({ type: 'error', text: 'Enter beneficiary phone or identity.' });
      return;
    }
    setSaving(rank);
    setMessage(null);
    const result =
      rank === 'primary'
        ? await setPrimaryBeneficiary(ownerIdentityAnchor, anchor.trim(), displayName)
        : await setSecondaryBeneficiary(ownerIdentityAnchor, rank === 'secondary_1' ? 0 : 1, anchor.trim(), displayName);
    setSaving(null);
    if (result.ok) {
      setMessage({ type: 'success', text: rank === 'primary' ? 'Primary Beneficiary saved.' : 'Secondary Beneficiary saved.' });
      setEditAnchor((a) => ({ ...a, [rank]: undefined }));
      setEditName((n) => ({ ...n, [rank]: undefined }));
      load();
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  return (
    <section
      className="rounded-2xl border-2 p-6 transition-all duration-200"
      style={{
        background: 'linear-gradient(180deg, rgba(5, 5, 5, 0.98) 0%, rgba(10, 10, 10, 0.95) 100%)',
        borderColor: GOLD_BORDER,
        boxShadow: '0 0 40px rgba(201, 162, 39, 0.08)',
      }}
    >
      <h2 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: SOFT_GOLD }}>
        Legacy
      </h2>
      <p className="text-xs text-[#6b6b70] mb-6">
        Nominate one Primary and two Secondary Beneficiaries. Proof of Life: after {PROOF_OF_LIFE_DAYS} days without verification, a Presence Check is sent; after {PRESENCE_CHECK_GRACE_DAYS} days without response, the Inheritance Protocol activates. 50% National Reserve remains with the Government on transfer.
      </p>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm border transition-all duration-200 ${
            message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Family Tree visualization — soft gold, respectful */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-center" style={{ color: SOFT_GOLD }}>
          Family Tree
        </h3>
        <div className="flex flex-col items-center gap-4">
          {/* Owner (Master Device) */}
          <div
            className="rounded-xl border-2 px-6 py-4 text-center min-w-[200px] transition-all duration-200"
            style={{ background: GOLD_BG, borderColor: GOLD_BORDER }}
          >
            <div className="text-2xl mb-1">🏛️</div>
            <p className="font-semibold text-[#f5f5f5]">{ownerDisplayName || 'You'}</p>
            <p className="text-xs font-mono mt-0.5" style={{ color: SOFT_GOLD }}>
              {maskPhoneForDisplay(ownerIdentityAnchor)}
            </p>
            <p className="text-[10px] text-[#6b6b70] mt-1">Master Device</p>
          </div>

          {/* Connector */}
          <div className="w-0.5 h-6 rounded-full" style={{ background: GOLD_BORDER }} aria-hidden />

          {/* Beneficiaries row */}
          <div className="flex flex-wrap justify-center gap-6">
            {(['primary', 'secondary_1', 'secondary_2'] as const).map((rank, idx) => {
              const b = getByRank(rank);
              const label = rank === 'primary' ? 'Primary Beneficiary' : `Secondary ${idx}`;
              return (
                <div key={rank} className="flex flex-col items-center">
                  <div
                    className="rounded-xl border-2 px-4 py-3 text-center min-w-[160px] transition-all duration-200"
                    style={{
                      background: b ? GOLD_BG : 'rgba(26, 26, 30, 0.6)',
                      borderColor: b ? GOLD_BORDER : 'rgba(107, 107, 112, 0.3)',
                    }}
                  >
                    <div className="text-xl mb-1">{rank === 'primary' ? '👑' : '🌿'}</div>
                    {b ? (
                      <>
                        <p className="font-medium text-[#f5f5f5] text-sm">{b.display_name || 'Beneficiary'}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: SOFT_GOLD }}>
                          {maskPhoneForDisplay(b.beneficiary_anchor)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-[#6b6b70]">Not set</p>
                    )}
                    <p className="text-[10px] text-[#6b6b70] mt-1">{label}</p>
                  </div>
                  {/* Inline edit */}
                  <div className="mt-3 w-full max-w-[200px]">
                    <input
                      type="tel"
                      placeholder="Phone or identity"
                      value={editAnchor[rank] ?? ''}
                      onChange={(e) => setEditAnchor((a) => ({ ...a, [rank]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d0d0f] border text-[#f5f5f5] text-xs placeholder:text-[#6b6b70] focus:border-[#c9a227]/50 focus:outline-none mb-1"
                      style={{ borderColor: GOLD_BORDER }}
                    />
                    <input
                      type="text"
                      placeholder="Display name (optional)"
                      value={editName[rank] ?? ''}
                      onChange={(e) => setEditName((n) => ({ ...n, [rank]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#0d0d0f] border text-[#f5f5f5] text-xs placeholder:text-[#6b6b70] focus:border-[#c9a227]/50 focus:outline-none mb-2"
                      style={{ borderColor: GOLD_BORDER }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(rank, (editAnchor[rank]?.trim() || b?.beneficiary_anchor) ?? '', editName[rank] ?? b?.display_name ?? undefined)}
                      disabled={saving === rank || !((editAnchor[rank]?.trim() ?? b?.beneficiary_anchor) ?? '')}
                      className="w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 disabled:opacity-50"
                      style={{
                        background: SOFT_GOLD,
                        color: '#050505',
                      }}
                    >
                      {saving === rank ? 'Saving…' : b ? 'Update' : 'Nominate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Proof of Life status */}
      {proofOfLife && (
        <div
          className="rounded-xl border p-4 transition-all duration-200"
          style={{ background: GOLD_BG, borderColor: GOLD_BORDER }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: SOFT_GOLD }}>
            Proof of Life
          </h3>
          <p className="text-xs text-[#a0a0a5]">
            {proofOfLife.daysSince != null
              ? `Last 3-of-4 verification: ${proofOfLife.daysSince} days ago.`
              : 'No verification record yet.'}
            {proofOfLife.shouldSendCheck && (
              <span className="block mt-1 text-[#c9a227]">Presence Check will be sent automatically.</span>
            )}
            {proofOfLife.shouldActivate && (
              <span className="block mt-1 text-amber-400">Inheritance Protocol may activate if no response.</span>
            )}
          </p>
        </div>
      )}

      {/* Governance note */}
      <p className="mt-4 text-[10px] text-[#6b6b70] text-center italic">
        The 50% National Reserve remains with the Government during any transfer, preserving the state&apos;s stability while your family keeps the personal wealth.
      </p>
    </section>
  );
}

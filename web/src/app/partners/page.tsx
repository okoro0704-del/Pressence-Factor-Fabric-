'use client';

import { useState, useEffect } from 'react';
import { JetBrains_Mono } from 'next/font/google';
import { PFFSentinel } from '@/components/partners/PFFSentinel';
import { getApprovedPartners, type PartnerApplicationRow } from '@/lib/partnerApplication';

const jetbrains = JetBrains_Mono({ weight: ['400', '600', '700'], subsets: ['latin'] });

const GOLD = '#D4AF37';
const GOLD_DIM = 'rgba(212, 175, 55, 0.7)';
const SLATE = '#0f172a';
const SLATE_BG = '#020617';
const SLATE_SURFACE = '#1e293b';
const BORDER = 'rgba(212, 175, 55, 0.25)';

/** Placeholder logo: first two letters of company name in gold circle */
function PartnerLogo({ companyName }: { companyName: string }) {
  const initials = (companyName || 'P')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg"
      style={{
        background: `linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.05) 100%)`,
        border: `1px solid ${BORDER}`,
        color: GOLD,
      }}
    >
      {initials || 'P'}
    </div>
  );
}

/**
 * PFF Partners Page — Certified PFF Partners grid.
 * Data from pff_partner_applications where status = APPROVED.
 * JetBrains Mono, deep slate/gold, Global Institutional feel.
 */
export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getApprovedPartners().then((list) => {
      if (!cancelled) {
        setPartners(list);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <main
      className="min-h-screen py-8 px-4"
      style={{ background: SLATE_BG, color: GOLD_DIM }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Sentinel at top */}
        <div className="mb-8">
          <PFFSentinel />
        </div>

        <h1
          className={`text-2xl font-semibold mb-2 ${jetbrains.className}`}
          style={{ color: GOLD }}
        >
          Certified PFF Partners
        </h1>
        <p className={`text-sm mb-8 ${jetbrains.className}`} style={{ color: GOLD_DIM, opacity: 0.9 }}>
          Presence Factor Fabric certified partners — Sovereign Verified integration with the Protocol.
        </p>

        {loading ? (
          <p className={`text-sm ${jetbrains.className}`} style={{ color: GOLD_DIM }}>
            Loading partners...
          </p>
        ) : partners.length === 0 ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ borderColor: BORDER, background: SLATE_SURFACE }}
          >
            <p className={`text-sm ${jetbrains.className}`} style={{ color: GOLD_DIM }}>
              No certified partners yet. Approved applications will appear here.
            </p>
            <a
              href="/partners/apply"
              className="inline-block mt-4 px-4 py-2 rounded font-medium"
              style={{ background: GOLD, color: SLATE_BG }}
            >
              Apply to become a partner
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="rounded-xl border p-5 flex flex-col"
                style={{
                  borderColor: BORDER,
                  background: `linear-gradient(180deg, ${SLATE_SURFACE} 0%, ${SLATE} 100%)`,
                  boxShadow: '0 0 24px rgba(212, 175, 55, 0.06)',
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <PartnerLogo companyName={partner.company_name} />
                  <div className="flex-1 min-w-0">
                    <h2
                      className={`font-semibold truncate ${jetbrains.className}`}
                      style={{ color: GOLD }}
                    >
                      {partner.company_name}
                    </h2>
                    <p className={`text-xs ${jetbrains.className}`} style={{ color: GOLD_DIM, opacity: 0.9 }}>
                      {partner.industry}
                    </p>
                  </div>
                </div>
                <p className={`text-xs mb-4 line-clamp-2 ${jetbrains.className}`} style={{ color: GOLD_DIM, opacity: 0.85 }}>
                  {partner.integration_intent}
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    <span aria-hidden>◆</span>
                    Sovereign Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 pt-8 border-t" style={{ borderColor: BORDER }}>
          <p className={`text-xs ${jetbrains.className}`} style={{ color: GOLD_DIM, opacity: 0.8 }}>
            Presence Factor Fabric — Born in Lagos. Built for the World.
          </p>
          <a
            href="/partners/apply"
            className={`inline-block mt-2 text-sm font-medium ${jetbrains.className}`}
            style={{ color: GOLD }}
          >
            Apply to become a Certified PFF Partner →
          </a>
        </div>
      </div>
    </main>
  );
}
